import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  try {
    const payload = await req.json();

    // Verify it's an UPDATE on task_instances and the status changed to completed
    if (payload.type !== "UPDATE" || payload.table !== "task_instances") {
      return new Response("Not a task update", { status: 200 });
    }

    const oldRecord = payload.old_record;
    const newRecord = payload.record;

    if (oldRecord.status === "completed" || newRecord.status !== "completed") {
      return new Response("Task not newly completed", { status: 200 });
    }

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase internal credentials not found");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the room details to get the name
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("name")
      .eq("id", newRecord.room_id)
      .single();

    if (roomError || !room) {
      console.error("Room fetch error:", roomError);
      return new Response("Room not found", { status: 500 });
    }

    // Fetch the user who completed the task
    const completedByUserId = newRecord.completed_by_user_id;
    if (!completedByUserId) {
      return new Response("No completed_by_user_id", { status: 200 });
    }

    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", completedByUserId)
      .single();

    if (userError || !user) {
      console.error("User fetch error:", userError);
      return new Response("User not found", { status: 500 });
    }

    const userName = user.full_name || "A roommate";
    const roomName = room.name;
    const taskTitle = newRecord.title;
    const points = newRecord.points_reward;

    // The notification title and body
    const title = `Task Completed! 🎉`;
    const body = `${userName} completed "${taskTitle}" in ${roomName} (+${points} pts)`;

    // Fetch all OTHER members of the room
    const { data: roomMembers, error: membersError } = await supabase
      .from("room_members")
      .select("user_id")
      .eq("room_id", newRecord.room_id)
      .neq("user_id", completedByUserId);

    if (membersError || !roomMembers) {
      console.error("Room members fetch error:", membersError);
      return new Response("Room members fetch failed", { status: 500 });
    }

    if (roomMembers.length === 0) {
      return new Response("No other room members to notify", { status: 200 });
    }

    // Dispatch a call to our `send-push` edge function for each other member
    const pushResults = [];
    for (const member of roomMembers) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`, // Bypass invoke auth
          },
          body: JSON.stringify({
            target_user_id: member.user_id,
            title,
            body,
            url: "/dashboard/tasks",
          }),
        });

        const data = await response.json();
        pushResults.push({ user_id: member.user_id, ...data });
      } catch (err: any) {
        console.error(`Failed to invoke send-push for user ${member.user_id}:`, err);
        pushResults.push({ user_id: member.user_id, error: err.message });
      }
    }

    return new Response(JSON.stringify({ success: true, pushResults }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
