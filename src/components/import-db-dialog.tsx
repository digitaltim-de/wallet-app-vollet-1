"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Upload } from "lucide-react";
import { importDatabaseFromBase64 } from "@/lib/dbExportImport";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false);
  const [dbToOverwrite, setDbToOverwrite] = useState("");

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

      // Parse the import data to get the database name
      let dbName;
      try {
        const jsonString = atob(importData);
        const importObj = JSON.parse(jsonString);
        dbName = importObj.dbName;
      } catch (error) {
        throw new Error("Invalid import data format");
      }

      // Check if database already exists
      const dbList = await indexedDB.databases();
      const dbExists = dbList.some(db => db.name === dbName);

      // If database exists and we're not in confirmation mode, ask for confirmation
      if (dbExists && !showConfirmOverwrite) {
        setDbToOverwrite(dbName);
        setShowConfirmOverwrite(true);
        setIsLoading(false);
        return;
      }

      // Import the database from base64
      await importDatabaseFromBase64(importData);

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
                <AlertCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-green-400">{success}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-900/20 p-4 rounded-lg border border-red-800">
              <h3 className="text-red-400 font-semibold mb-2">Database Already Exists</h3>
              <p className="text-red-300 mb-2">
                A database with the name "{dbToOverwrite}" already exists. Importing will overwrite this database.
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
