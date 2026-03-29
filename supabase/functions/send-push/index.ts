import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import webpush from "npm:web-push@3.6.7";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { target_user_id, title, body, url } = await req.json();

    if (!target_user_id || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Configure Web Push with VAPID keys from environment secrets
    const vapidPublicKey = Deno.env.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@roomietasks.app";

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys are not configured in environment");
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase internal credentials not found");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, subscription")
      .eq("user_id", target_user_id);

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "User has no active push subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Prepare push payload
    const payload = JSON.stringify({
      title,
      body,
      url: url || "/",
    });

    const results = [];
    let failureCount = 0;

    // Send push notification to all unique subscriptions for this user
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        results.push({ endpoint: sub.endpoint, status: "success" });
      } catch (err) {
        console.error(`Error sending to endpoint ${sub.endpoint}:`, err);
        
        // If the subscription is no longer valid, delete it from the database
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
          results.push({ endpoint: sub.endpoint, status: "deleted_stale" });
        } else {
          results.push({ endpoint: sub.endpoint, status: "failed", error: err.message });
          failureCount++;
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      sentCount: results.filter(r => r.status === "success").length,
      failureCount,
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
