"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Copy, QrCode, Trash2, AlertCircle, CheckCircle2, Eye, EyeOff, Key } from "lucide-react";
import { getWallet, deleteWallet } from "@/lib/db";
import { decryptPrivateKey } from "@/lib/crypto";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });
  
  // State
  const [passphrase, setPassphrase] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showPassphraseModal, setShowPassphraseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionType, setActionType] = useState<"export" | "delete" | null>(null);
  
  // Get wallet address and network from session
  const address = session?.user?.address as string;
  const network = session?.user?.network as "ethereum" | "bnb";
  
  // Handle export private key
  const handleExportKey = () => {
    setActionType("export");
    setPassphrase("");
    setError("");
    setShowPassphraseModal(true);
  };
  
  // Handle delete wallet
  const handleDeleteWallet = () => {
    setActionType("delete");
    setPassphrase("");
    setError("");
    setShowDeleteModal(true);
  };
  
  // Handle show QR code
  const handleShowQR = () => {
    if (privateKey) {
      setShowQRModal(true);
    } else {
      handleExportKey();
    }
  };
  
  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    if (privateKey) {
      navigator.clipboard.writeText(privateKey)
        .then(() => {
          setSuccess("Private key copied to clipboard");
          setTimeout(() => setSuccess(""), 3000);
        })
        .catch(() => {
          setError("Failed to copy to clipboard");
        });
    } else {
      handleExportKey();
    }
  };
  
  // Handle passphrase submission
  const handlePassphraseSubmit = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      // Get wallet from IndexedDB
      const wallet = await getWallet(address);
      
      if (!wallet) {
        throw new Error("Wallet not found");
      }
      
      // Decrypt private key with passphrase
      const privateKeyHex = await decryptPrivateKey({
        salt: wallet.salt,
        iv: wallet.iv,
        ciphertext: wallet.ciphertext
      }, passphrase);
      
      if (!privateKeyHex) {
        throw new Error("Incorrect passphrase");
      }
      
      if (actionType === "export") {
        // Set private key for display/QR
        setPrivateKey(privateKeyHex);
        setShowPassphraseModal(false);
        
        // If this was triggered by QR button, show QR modal
        if (showQRModal) {
          setShowQRModal(true);
        }
      } else if (actionType === "delete") {
        // Delete wallet from IndexedDB
        await deleteWallet(address);
        
        // Sign out
        await signOut({ redirect: false });
        
        // Redirect to login page
        router.push("/login");
      }
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Loading state
  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary p-4 text-white">
        <div className="container mx-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-primary/80 mr-2"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Wallet Settings</h1>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <Card className="shadow-lg max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Wallet Security</CardTitle>
            <CardDescription>
              Manage your wallet security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Wallet Info */}
            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <div className="flex items-center space-x-2">
                <div className="bg-gray-100 p-2 rounded-lg text-sm font-mono flex-1 truncate">
                  {address}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(address);
                    setSuccess("Address copied to clipboard");
                    setTimeout(() => setSuccess(""), 3000);
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-500">
                {network === "ethereum" ? "Ethereum Network" : "BNB Chain"}
              </div>
            </div>
            
            {/* Private Key Section */}
            {privateKey && (
              <div className="space-y-2 border p-3 rounded-lg bg-secondary">
                <Label className="flex items-center">
                  <Key className="w-4 h-4 mr-1" />
                  Private Key
                </Label>
                <div className="relative">
                  <Input
                    type={showPrivateKey ? "text" : "password"}
                    value={privateKey}
                    readOnly
                    className="font-mono pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="text-xs text-red-500 font-semibold">
                  WARNING: Never share your private key with anyone!
                </div>
              </div>
            )}
            
            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-50 p-3 rounded-lg flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-green-600">{success}</span>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 p-3 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                <span className="text-red-600">{error}</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="outline"
                className="flex items-center justify-center"
                onClick={handleShowQR}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Show QR
              </Button>
              <Button
                variant="outline"
                className="flex items-center justify-center"
                onClick={handleCopyToClipboard}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Secret
              </Button>
            </div>
            <Button
              variant="destructive"
              className="w-full flex items-center justify-center"
              onClick={handleDeleteWallet}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Wallet
            </Button>
          </CardFooter>
        </Card>
      </main>
      
      {/* Passphrase Modal */}
      {showPassphraseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Enter Passphrase</CardTitle>
              <CardDescription>
                Your passphrase is needed to access your private key
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passphrase">Wallet Passphrase</Label>
                  <Input
                    id="passphrase"
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="bg-red-50 p-3 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                    <span className="text-red-600">{error}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPassphraseModal(false);
                  setPassphrase("");
                  setActionType(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handlePassphraseSubmit} disabled={isLoading}>
                {isLoading ? "Processing..." : "Continue"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Delete Wallet</CardTitle>
              <CardDescription>
                This action cannot be undone. Your wallet will be removed from this device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-red-600 font-medium">Warning:</p>
                  <p className="text-red-600">
                    Make sure you have backed up your private key before deleting your wallet.
                    Without your private key, you will permanently lose access to your funds.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delete-passphrase">Enter Passphrase to Confirm</Label>
                  <Input
                    id="delete-passphrase"
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="bg-red-50 p-3 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                    <span className="text-red-600">{error}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setPassphrase("");
                  setActionType(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handlePassphraseSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete Wallet"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      
      {/* QR Code Modal */}
      {showQRModal && privateKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Private Key QR Code</CardTitle>
              <CardDescription>
                Scan this QR code to import your wallet on another device
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={privateKey}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="mt-4 text-center text-red-600 text-sm font-medium">
                WARNING: Keep this QR code private and secure!
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button
                onClick={() => setShowQRModal(false)}
              >
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}