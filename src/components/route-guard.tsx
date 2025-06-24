"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccountStore } from "@/store/account";

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * Route guard component that protects routes from unauthenticated access
 * Redirects to login-or-create page if user is not authenticated
 */
export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const { unlocked } = useAccountStore();
  
  useEffect(() => {
    // If not authenticated, redirect to login page
    if (!unlocked) {
      router.push("/login-or-create");
    }
  }, [unlocked, router]);
  
  // If not authenticated, show loading state
  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // If authenticated, render children
  return <>{children}</>;
}