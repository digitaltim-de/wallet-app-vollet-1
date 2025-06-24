"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccountStore } from "@/store/account";

export default function HomePage() {
  const router = useRouter();
  const { unlocked } = useAccountStore();
  
  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    // Otherwise, redirect to login-or-create page
    if (unlocked) {
      router.push("/dashboard");
    } else {
      router.push("/login-or-create");
    }
  }, [unlocked, router]);
  
  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}