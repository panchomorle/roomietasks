"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * /dashboard/profile — redirects to the logged-in user's own profile page.
 * This keeps the Profile navbar tab working without exposing the settings
 * as the primary landing.
 */
export default function ProfileRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.id) {
      router.replace(`/dashboard/profile/${user.id}`);
    }
  }, [user, loading, router]);

  // Brief loading state while auth resolves
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  );
}
