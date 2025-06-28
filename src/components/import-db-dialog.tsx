"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Upload, Download, Image, FileUp, CheckCircle2 } from "lucide-react";
import { importDatabaseFromBase64 } from "@/lib/dbExportImport";
import { extractDataFromImage } from "@/lib/steganography";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAccountStore } from "@/store/account";

interface ImportDBDialogProps {
  className?: string;
  showLabel?: boolean;
}

export function ImportDBDialog({ className, showLabel = false }: ImportDBDialogProps) {
  const router = useRouter();
  const { unlocked } = useAccountStore();

  // State
  const [open, setOpen] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [importData, setImportData] = useState("");
  const [importType, setImportType] = useState<"text" | "image">("text");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false);
  const [dbToOverwrite, setDbToOverwrite] = useState("");

  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle import database submission
  const handleImportSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (!importData) {
        throw new Error("No import data provided");
      }

      if (!passphrase) {
        throw new Error("Passphrase is required");
      }

      // Validate passphrase
      if (passphrase.trim() === "") {
        throw new Error("Invalid passphrase");
      }

      // We can't parse the import data directly anymore because it's encrypted
      // Instead, we'll check if any database with the bp_ prefix exists
      const dbList = await indexedDB.databases();
      const existingDbs = dbList.filter(db => db.name?.startsWith("bp_"));

      // If any database with the bp_ prefix exists and we're not in confirmation mode, ask for confirmation
      if (existingDbs.length > 0 && !showConfirmOverwrite) {
        setDbToOverwrite("existing wallet");
        setShowConfirmOverwrite(true);
        setIsLoading(false);
        return;
      }

      // Import the database from encrypted base64
      await importDatabaseFromBase64(importData, passphrase);

      // If user is logged in, sign out
      if (unlocked) {
        await signOut({ redirect: false });
      }

      // Show success message
      setSuccess("Database imported successfully. Please log in again.");
      setShowConfirmOverwrite(false);

      // Close the dialog after a short delay
      setTimeout(() => {
        setOpen(false);
        // Redirect to login page
        router.push("/login-or-create");
      }, 2000);
    } catch (error: any) {
      console.error("Import error:", error);
      setError(error.message || "An error occurred during import");
      setShowConfirmOverwrite(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel overwrite
  const handleCancelOverwrite = () => {
    setShowConfirmOverwrite(false);
    setDbToOverwrite("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {showLabel ? (
          <Button 
            variant="outline" 
            className={`text-gray-400 hover:text-[#a99fec] border-[#444444] bg-[#333333] hover:bg-[#444444] ${className}`}
          >
            <Upload size={18} className="mr-2" />
            Import Database
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className={`text-gray-400 hover:text-[#a99fec] ${className}`}
          >
            <Upload size={18} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Import Database</DialogTitle>
          <DialogDescription className="text-gray-400">
            Paste the exported data to import your wallet
          </DialogDescription>
        </DialogHeader>

        {!showConfirmOverwrite ? (
          <div className="space-y-4">
            {/* Import Type Selector */}
            <div className="w-full flex mb-4 border-b border-[#444444]">
              <button
                className={`flex-1 py-2 px-4 ${importType === 'text' ? 'text-[#a99fec] border-b-2 border-[#a99fec]' : 'text-gray-400'}`}
                onClick={() => setImportType('text')}
              >
                <span className="flex items-center justify-center">
                  <Download className="w-4 h-4 mr-2" />
                  Text
                </span>
              </button>
              <button
                className={`flex-1 py-2 px-4 ${importType === 'image' ? 'text-[#a99fec] border-b-2 border-[#a99fec]' : 'text-gray-400'}`}
                onClick={() => setImportType('image')}
              >
                <span className="flex items-center justify-center">
                  <Image className="w-4 h-4 mr-2" />
                  Image
                </span>
              </button>
            </div>

            {/* Text Import */}
            {importType === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="import-data" className="text-gray-300">Import Data</Label>
                <textarea
                  id="import-data"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste exported data here"
                  className="w-full h-40 font-mono text-xs bg-[#222222] border-[#444444] text-gray-300 p-2 rounded"
                />
              </div>
            )}

            {/* Image Import */}
            {importType === 'image' && (
              <div className="space-y-2">
                <Label htmlFor="import-image" className="text-gray-300">Upload Backup Image</Label>
                <div className="flex flex-col items-center justify-center w-full h-40 bg-[#222222] border-2 border-dashed border-[#444444] rounded-lg p-4">
                  <input
                    type="file"
                    id="import-image"
                    ref={fileInputRef}
                    accept="image/png"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsLoading(true);
                        setError("");
                        try {
                          const extractedData = await extractDataFromImage(file);
                          if (!extractedData) {
                            throw new Error('No data found in the image or invalid image format');
                          }
                          setImportData(extractedData);
                          setSuccess("Data extracted from image successfully");
                          setTimeout(() => setSuccess(""), 3000);
                        } catch (error: any) {
                          console.error("Error extracting data from image:", error);
                          setError(error.message || "Failed to extract data from image");
                        } finally {
                          setIsLoading(false);
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                    disabled={isLoading}
                  >
                    <FileUp className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">
                      {isLoading ? "Processing..." : "Click to upload backup image"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG only</p>
                  </button>
                </div>
                {importData && importType === 'image' && (
                  <div className="bg-green-900/20 p-3 rounded-lg border border-green-800">
                    <p className="text-green-400 text-sm">
                      <CheckCircle2 className="w-4 h-4 inline mr-1"/>
                      Data extracted successfully
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="import-passphrase" className="text-gray-300">Passphrase</Label>
              <Input
                id="import-passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter your passphrase"
                className="bg-[#222222] border-[#444444] text-gray-300"
              />
            </div>

            <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-800">
              <p className="text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                This will replace your current wallet data if it exists. Make sure you have a backup.
              </p>
            </div>

            {error && (
              <div className="bg-red-900/20 p-3 rounded-lg flex items-start border border-red-800">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                <span className="text-red-400">{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-900/20 p-3 rounded-lg flex items-start border border-green-800">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-green-400">{success}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-900/20 p-4 rounded-lg border border-red-800">
              <h3 className="text-red-400 font-semibold mb-2">Wallet Already Exists</h3>
              <p className="text-red-300 mb-2">
                You already have a wallet on this device. Importing will overwrite your existing wallet data.
              </p>
              <p className="text-red-300">
                Are you sure you want to continue?
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {!showConfirmOverwrite ? (
            <>
              <Button
                variant="outline"
                className="border-[#444444] bg-[#333333] text-white hover:bg-[#444444] hover:text-[#a99fec]"
                onClick={() => {
                  setOpen(false);
                  setImportData("");
                  setPassphrase("");
                  setError("");
                  setSuccess("");
                  setImportType('text'); // Reset to default for next time
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                className="bg-[#a99fec] text-[#222222] hover:bg-[#9888db]"
                onClick={handleImportSubmit} 
                disabled={isLoading || !importData || !passphrase}
              >
                {isLoading ? "Importing..." : "Import"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="border-[#444444] bg-[#333333] text-white hover:bg-[#444444] hover:text-[#a99fec]"
                onClick={handleCancelOverwrite}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                className="bg-red-900 hover:bg-red-800"
                onClick={handleImportSubmit}
              >
                Overwrite Database
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
