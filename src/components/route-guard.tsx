"use client";

import { useEffect, useState } from "react";
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
  const { unlocked, reconnect } = useAccountStore();
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Handle reconnection when component mounts with persisted unlocked state
  useEffect(() => {
    const handleReconnection = async () => {
      if (unlocked) {
        setIsReconnecting(true);
        try {
          const success = await reconnect();
          if (!success) {
            // If reconnection fails, redirect to login page
            router.push("/login-or-create");
          }
        } catch (error) {
          console.error("Error reconnecting to database:", error);
          router.push("/login-or-create");
        } finally {
          setIsReconnecting(false);
        }
      }
    };

    handleReconnection();
  }, [unlocked, reconnect, router]);

  useEffect(() => {
    // If not authenticated, redirect to login page
    if (!unlocked) {
      router.push("/login-or-create");
    }
  }, [unlocked, router]);

  // If not authenticated or reconnecting, show loading state
  if (!unlocked || isReconnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{isReconnecting ? "Reconnecting to database..." : "Checking authentication..."}</p>
        </div>
      </div>
    );
  }

  // If authenticated and reconnected, render children
  return <>{children}</>;
}
