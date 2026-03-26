"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PushPermission = "granted" | "denied" | "default" | "unsupported";

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Check the current subscription state on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermission);

    // Check if already subscribed
    navigator.serviceWorker.register("/sw.js").then(() => {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }).catch(err => console.warn("Service worker registration skipped/failed", err));
  }, []);

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set.");
      return;
    }
    setIsLoading(true);
    try {
      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;

      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result as PushPermission);
      if (result !== "granted") return;

      // Ghost subscriptions from old VAPID testing iterations cause the browser to throw "AbortError" 
      // when attempting to subscribe with a new key. We actively wipe any old subscription first.
      let subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Subscribe to push
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY.trim()) as any,
      });

      const subJson = subscription.toJSON();
      const endpoint = subscription.endpoint;

      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upsert into push_subscriptions
      const { error } = await supabase.from("push_subscriptions").upsert(
        { user_id: user.id, endpoint, subscription: subJson as any },
        { onConflict: "user_id,endpoint" }
      );

      if (error) throw error;
      setIsSubscribed(true);
    } catch (err) {
      console.error("Push subscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        // Remove from database
        const { error } = await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", endpoint);

        if (error) throw error;
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
