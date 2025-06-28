"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportDBDialog } from "@/components/import-db-dialog";

interface HeaderProps {
  balanceVisible: boolean;
  setBalanceVisible: (visible: boolean) => void;
  lock: () => void;
}

export const Header = ({ balanceVisible, setBalanceVisible, lock }: HeaderProps) => {
  const router = useRouter();

  return (
    <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Image
                src="/wollet-logo.png"
                alt="Wollet Logo"
                width={28}
                height={28}
                className="h-auto w-auto"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="text-gray-400 hover:text-white hover:bg-white/10 h-8 w-8"
            >
              {balanceVisible ? <EyeOff size={16}/> : <Eye size={16}/>}
            </Button>
            <ImportDBDialog />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/settings")}
              className="text-gray-400 hover:text-white hover:bg-white/10 h-8 w-8"
            >
              <Settings size={16}/>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={lock}
              className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
            >
              <LogOut size={16}/>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};