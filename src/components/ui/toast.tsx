"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "./use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            ${toast.visible ? 'animate-enter' : 'animate-leave'}
            ${toast.variant === 'destructive' ? 'bg-red-100 border-red-400 text-red-800' : 
              toast.variant === 'success' ? 'bg-green-100 border-green-400 text-green-800' : 
              'bg-white border-gray-200 text-gray-800'}
            rounded-lg border p-4 shadow-md flex items-start
          `}
          role="alert"
        >
          <div className="flex-1">
            {toast.variant === 'destructive' && (
              <AlertCircle className="w-5 h-5 text-red-500 inline-block mr-2" />
            )}
            {toast.variant === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-500 inline-block mr-2" />
            )}
            <div className="font-medium">{toast.title}</div>
            {toast.description && (
              <div className="text-sm mt-1">{toast.description}</div>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Add these animations to your globals.css or tailwind.config.js
// @keyframes enter { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
// @keyframes leave { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-8px); } }
// .animate-enter { animation: enter 0.2s ease-out; }
// .animate-leave { animation: leave 0.15s ease-in forwards; }