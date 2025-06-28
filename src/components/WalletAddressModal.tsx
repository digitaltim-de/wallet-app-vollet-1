"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Share } from "lucide-react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

interface WalletAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  walletName?: string;
  coinSymbol?: string;
}

export const WalletAddressModal = ({
  isOpen,
  onClose,
  walletAddress,
  walletName,
  coinSymbol = "BTC"
}: WalletAddressModalProps) => {

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      toast.success("Address copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${coinSymbol} Wallet Address`,
          text: `My ${coinSymbol} wallet address: ${walletAddress}`,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(walletAddress);
        toast.success("Address copied to clipboard");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share address");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#2a2a2a] text-white border-[#3a3a3a] sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center space-x-2">
              <span>Receive {coinSymbol}</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-[#a99fec] hover:text-white h-6 w-6 p-0"
            >
              Done
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code Section */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg relative">
              <QRCodeCanvas
                value={walletAddress}
                size={200}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={true}
              />
              {/* Shield icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-full p-2">
                  <svg
                    className="w-8 h-8 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="text-center">
            <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-3">
              <p className="text-sm text-gray-400 font-mono break-all">
                {walletAddress}
              </p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Send only {coinSymbol} to this address.
            </p>
            <p className="text-sm text-gray-400">
              Sending any other coins may result in permanent loss.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-12">
            <button
              onClick={handleCopy}
              className="flex flex-col items-center space-y-1 text-[#a99fec] hover:text-white transition-colors"
            >
              <div className="w-12 h-12 bg-[#3a3a3a] rounded-full flex items-center justify-center hover:bg-[#4a4a4a] transition-colors">
                <Copy className="w-5 h-5" />
              </div>
              <span className="text-xs">Copy</span>
            </button>

            <button
              onClick={handleShare}
              className="flex flex-col items-center space-y-1 text-[#a99fec] hover:text-white transition-colors"
            >
              <div className="w-12 h-12 bg-[#3a3a3a] rounded-full flex items-center justify-center hover:bg-[#4a4a4a] transition-colors">
                <Share className="w-5 h-5" />
              </div>
              <span className="text-xs">Share</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
