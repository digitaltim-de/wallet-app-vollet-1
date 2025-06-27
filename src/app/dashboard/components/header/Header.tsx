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
    <header className="border-b border-[#2a2a2a] p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Image 
            src="/wollet-logo.png" 
            alt="Wollet Logo" 
            width={100} 
            height={25} 
            className="h-auto"
          />
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setBalanceVisible(!balanceVisible)}
            className="text-gray-400 hover:text-[#a99fec]"
          >
            {balanceVisible ? <EyeOff size={18}/> : <Eye size={18}/>}
          </Button>
          <ImportDBDialog />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/settings")}
            className="text-gray-400 hover:text-[#a99fec]"
          >
            <Settings size={18}/>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              lock();
              router.push("/login-or-create");
            }}
            className="text-gray-400 hover:text-[#a99fec]"
          >
            <LogOut size={18}/>
          </Button>
        </div>
      </div>
    </header>
  );
};