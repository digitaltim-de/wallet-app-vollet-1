"use client";

import {useState, useRef} from "react";
import {useRouter} from "next/navigation";
import {signOut} from "next-auth/react";
import {QRCodeSVG} from "qrcode.react";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {AlertCircle, ArrowLeft, CheckCircle2, Download, Image, FileUp, Trash2, Upload} from "lucide-react";
import {deleteWallet, getWallet} from "@/lib/db";
import {decryptPrivateKey} from "@/lib/crypto";
import {exportDatabaseToBase64, importDatabaseFromBase64} from "@/lib/dbExportImport";
import {embedDataInImage, extractDataFromImage} from "@/lib/steganography";
import {useAccountStore} from "@/store/account";
import {RouteGuard} from "@/components/route-guard";

export default function SettingsPage() {
    const router = useRouter();
    const {dbName} = useAccountStore();

    // State
    const [passphrase, setPassphrase] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [showPassphraseModal, setShowPassphraseModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [actionType, setActionType] = useState<"export" | "delete" | "exportDb" | "importDb" | null>(null);
    const [exportData, setExportData] = useState("");
    const [importData, setImportData] = useState("");
    const [exportImageUrl, setExportImageUrl] = useState<string | null>(null);
    const [exportType, setExportType] = useState<"text" | "image">("text");
    const [importType, setImportType] = useState<"text" | "image">("text");

    // Refs for file inputs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // We'll need to get address and network from a different source
    // For now, we'll use placeholder values
    const address = ""; // This will need to be updated
    const network = "ethereum" as "ethereum" | "bnb"; // This will need to be updated

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

    // Handle export database
    const handleExportDatabase = () => {
        setActionType("exportDb");
        setPassphrase("");
        setError("");
        setShowPassphraseModal(true);
    };

    // Handle import database
    const handleImportDatabase = () => {
        setActionType("importDb");
        setPassphrase("");
        setError("");
        setImportData("");
        setShowImportModal(true);
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
            // Validate passphrase is not empty
            if (!passphrase || passphrase.trim() === "") {
                throw new Error("Valid passphrase is required");
            }

            // For database export, we need to validate the passphrase
            if (actionType === "exportDb") {
                // Get the database name from the account store
                if (!dbName) {
                    throw new Error("Database name not found. Please log in again.");
                }

                // Export the database to encrypted base64
                const exportedData = await exportDatabaseToBase64(dbName, passphrase);
                setExportData(exportedData);

                setShowPassphraseModal(false);
                setShowExportModal(true);
                return;
            }

            // For export private key action, we'll use a placeholder since we don't have the actual wallet
            if (actionType === "export") {
                // Set a placeholder private key for demonstration
                const demoPrivateKey = "0x" + Array(64).fill('0').join('');
                setPrivateKey(demoPrivateKey);
                setShowPassphraseModal(false);

                // If this was triggered by QR button, show QR modal
                if (showQRModal) {
                    setShowQRModal(true);
                }
                return;
            }

            // For other actions, get wallet from IndexedDB
            const wallet = await getWallet(address);

            if (!wallet) {
                throw new Error("Wallet not found");
            }

            // Combine salt, iv, and ciphertext into a base64 string
            const combinedLength = wallet.salt.length + wallet.iv.length + wallet.ciphertext.length;
            const combined = new Uint8Array(combinedLength);
            combined.set(wallet.salt, 0);
            combined.set(wallet.iv, wallet.salt.length);
            combined.set(wallet.ciphertext, wallet.salt.length + wallet.iv.length);
            
            // Convert to base64
            const encryptedBase64 = btoa(String.fromCharCode(...combined));

            // Decrypt private key with passphrase
            const privateKeyHex = await decryptPrivateKey(encryptedBase64, passphrase);

            if (!privateKeyHex) {
                throw new Error("Incorrect passphrase");
            }

            if (actionType === "delete") {
                // Delete wallet from IndexedDB
                await deleteWallet(address);

                // Sign out
                await signOut({redirect: false});

                // Redirect to login page
                router.push("/login-or-create");
            }
        } catch (error: any) {
            console.error("Error:", error);
            setError(error.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

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

            // Validate passphrase (in a real implementation, this would check against the user's actual passphrase)
            // For now, we'll just check that it's not empty
            if (passphrase.trim() === "") {
                throw new Error("Invalid passphrase");
            }

            // Import the database from encrypted base64
            const dbName = await importDatabaseFromBase64(importData, passphrase);

            // Sign out
            await signOut({redirect: false});

            // Show success message
            setSuccess("Database imported successfully. Please log in again.");
            setShowImportModal(false);

            // Redirect to login page after a short delay
            setTimeout(() => {
                router.push("/login-or-create");
            }, 2000);
        } catch (error: any) {
            console.error("Import error:", error);
            setError(error.message || "An error occurred during import");
        } finally {
            setIsLoading(false);
        }
    };

    // Generate steganography image
    const generateStegImage = async () => {
        if (!exportData) return;

        setIsLoading(true);
        setError("");

        try {
            const imageUrl = await embedDataInImage('/cryptowallet-backup.png', exportData);
            if (!imageUrl) {
                throw new Error('Failed to generate image with embedded data');
            }
            setExportImageUrl(imageUrl);
            console.log('Image with embedded data generated successfully');
        } catch (error) {
            console.error('Error embedding data in image:', error);
            setError('Failed to create image backup. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle export type change
    const handleExportTypeChange = async (type: "text" | "image") => {
        setExportType(type);

        if (type === "image" && exportData && !exportImageUrl) {
            await generateStegImage();
        }
    };

    return (
        <RouteGuard>
            <div className="min-h-screen bg-[#222222] text-white">
                {/* Header */}
                <header className="border-b border-[#2a2a2a] p-4">
                    <div className="container mx-auto flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:text-[#a99fec] mr-2"
                            onClick={() => router.push("/dashboard")}
                        >
                            <ArrowLeft className="w-5 h-5"/>
                        </Button>
                        <h1 className="text-xl font-bold text-[#a99fec]">Wallet Settings</h1>
                    </div>
                </header>

                <main className="container mx-auto p-4">
                    <Card className="shadow-lg max-w-md mx-auto bg-[#2a2a2a] border-[#333333] text-white">
                        <CardHeader>
                            <CardTitle className="text-[#a99fec]">Account Security</CardTitle>
                            <CardDescription className="text-gray-400">
                                Manage your account security settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Success/Error Messages */}
                            {success && (
                                <div
                                    className="bg-green-900/20 p-3 rounded-lg flex items-start border border-green-800">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5"/>
                                    <span className="text-green-400">{success}</span>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-900/20 p-3 rounded-lg flex items-start border border-red-800">
                                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5"/>
                                    <span className="text-red-400">{error}</span>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-3">
                            {/* Database Export/Import */}
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <Button
                                    variant="outline"
                                    className="flex items-center justify-center border-[#444444] bg-[#333333] text-white hover:bg-[#444444] hover:text-[#a99fec]"
                                    onClick={handleExportDatabase}
                                >
                                    <Download className="w-4 h-4 mr-2"/>
                                    Export DB
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex items-center justify-center border-[#444444] bg-[#333333] text-white hover:bg-[#444444] hover:text-[#a99fec]"
                                    onClick={handleImportDatabase}
                                >
                                    <Upload className="w-4 h-4 mr-2"/>
                                    Import DB
                                </Button>
                            </div>

                            <Button
                                variant="destructive"
                                className="w-full flex items-center justify-center bg-red-900 hover:bg-red-800"
                                onClick={handleDeleteWallet}
                            >
                                <Trash2 className="w-4 h-4 mr-2"/>
                                Delete Wallet
                            </Button>
                        </CardFooter>
                    </Card>
                </main>

                {/* Passphrase Modal */}
                {showPassphraseModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-md bg-[#2a2a2a] border-[#333333] text-white">
                            <CardHeader>
                                <CardTitle className="text-[#a99fec]">Backup Password</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Please enter a password to secure your backup. This password will be used to encrypt
                                    your data
                                    and is required when importing your backup in the future. Keep it safe and do not
                                    share it with
                                    anyone. This is not the same as your account login password.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="passphrase" className="text-gray-300">
                                            Enter Password
                                        </Label>
                                        <Input
                                            id="passphrase"
                                            type="password"
                                            value={passphrase}
                                            onChange={(e) => setPassphrase(e.target.value)}
                                            autoFocus
                                            className="bg-[#222222] border-[#444444] text-gray-300"
                                        />
                                    </div>
                                    {error && (
                                        <div
                                            className="bg-red-900/20 p-3 rounded-lg flex items-start border border-red-800">
                                            <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5"/>
                                            <span className="text-red-400">{error}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button
                                    variant="outline"
                                    className="border-[#444444] bg-[#333333] text-white hover:bg-[#444444] hover:text-[#a99fec]"
                                    onClick={() => {
                                        setShowPassphraseModal(false);
                                        setPassphrase("");
                                        setActionType(null);
                                    }}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-[#a99fec] text-[#222222] hover:bg-[#9888db]"
                                    onClick={handlePassphraseSubmit}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Processing..." : "Continue"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-md bg-[#2a2a2a] border-[#333333] text-white">
                            <CardHeader>
                                <CardTitle className="text-red-400">Delete Wallet</CardTitle>
                                <CardDescription className="text-gray-400">
                                    This action cannot be undone. Your wallet will be removed from this device.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="bg-red-900/20 p-3 rounded-lg border border-red-800">
                                        <p className="text-red-400 font-medium">Warning:</p>
                                        <p className="text-red-400">
                                            Make sure you have backed up your private key before deleting your wallet.
                                            Without your private key, you will permanently lose access to your funds.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="delete-passphrase" className="text-gray-300">Enter Passphrase to
                                            Confirm</Label>
                                        <Input
                                            id="delete-passphrase"
                                            type="password"
                                            value={passphrase}
                                            onChange={(e) => setPassphrase(e.target.value)}
                                            autoFocus
                                            className="bg-[#222222] border-[#444444] text-gray-300"
                                        />
                                    </div>
                                    {error && (
                                        <div
                                            className="bg-red-900/20 p-3 rounded-lg flex items-start border border-red-800">
                                            <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5"/>
                                            <span className="text-red-400">{error}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button
                                    variant="outline"
                                    className="border-[#444444] bg-[#333333] text-white hover:bg-[#444444] hover:text-[#a99fec]"
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
                                    className="bg-red-900 hover:bg-red-800"
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
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-md bg-[#2a2a2a] border-[#333333] text-white">
                            <CardHeader>
                                <CardTitle className="text-[#a99fec]">Private Key QR Code</CardTitle>
                                <CardDescription className="text-gray-400">
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
                                <div className="mt-4 text-center text-red-400 text-sm font-medium">
                                    WARNING: Keep this QR code private and secure!
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-center">
                                <Button
                                    className="bg-[#a99fec] text-[#222222] hover:bg-[#9888db]"
                                    onClick={() => setShowQRModal(false)}
                                >
                                    Close
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}

                {/* Database Export Modal */}
                {showExportModal && exportData && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-md bg-[#2a2a2a] border-[#333333] text-white">
                            <CardHeader>
                                <CardTitle className="text-[#a99fec]">Database Export</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Choose how you want to export your wallet data
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                {/* Export Type Selector */}
                                <div className="w-full flex mb-4 border-b border-[#444444]">
                                    <button
                                        className={`flex-1 py-2 px-4 ${exportType === 'text' ? 'text-[#a99fec] border-b-2 border-[#a99fec]' : 'text-gray-400'}`}
                                        onClick={() => handleExportTypeChange('text')}
                                    >
                                        <span className="flex items-center justify-center">
                                            <Download className="w-4 h-4 mr-2" />
                                            Text
                                        </span>
                                    </button>
                                    <button
                                        className={`flex-1 py-2 px-4 ${exportType === 'image' ? 'text-[#a99fec] border-b-2 border-[#a99fec]' : 'text-gray-400'}`}
                                        onClick={() => handleExportTypeChange('image')}
                                    >
                                        <span className="flex items-center justify-center">
                                            <Image className="w-4 h-4 mr-2" />
                                            Image
                                        </span>
                                    </button>
                                </div>

                                {/* Text Export */}
                                {exportType === 'text' && (
                                    <>
                                        <div className="w-full bg-[#222222] p-4 rounded-lg">
                                            <textarea
                                                value={exportData}
                                                readOnly
                                                className="w-full h-40 bg-[#222222] border-[#444444] text-gray-300 font-mono text-xs p-2 rounded"
                                            />
                                        </div>
                                        <div className="mt-4 text-center text-red-400 text-sm font-medium">
                                            WARNING: Keep this data private and secure!
                                        </div>
                                    </>
                                )}

                                {/* Image Export */}
                                {exportType === 'image' && (
                                    <>
                                        <div className="w-full bg-[#222222] p-4 rounded-lg flex justify-center">
                                            {isLoading ? (
                                                <div className="h-40 flex items-center justify-center text-gray-400">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a99fec]"></div>
                                                    <span className="ml-2">Generating image...</span>
                                                </div>
                                            ) : exportImageUrl ? (
                                                <img
                                                    src={exportImageUrl}
                                                    alt="Wallet Backup"
                                                    className="max-w-full max-h-40 object-contain"
                                                    onError={(e) => {
                                                        console.error('Image failed to load', e);
                                                        setError('Failed to load the generated image');
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-40 flex items-center justify-center text-gray-400">
                                                    <div className="text-center">
                                                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                                        <p>Click "Image" tab to generate backup image</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 text-center text-red-400 text-sm font-medium">
                                            WARNING: This image contains your encrypted wallet data!
                                        </div>
                                    </>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between w-full">
                                {exportType === 'text' ? (
                                    <Button
                                        variant="outline"
                                        className="border-[#444444] bg-[#333333] text-white hover:bg-[#444444] hover:text-[#a99fec]"
                                        onClick={() => {
                                            navigator.clipboard.writeText(exportData);
                                            setSuccess("Export data copied to clipboard");
                                            setTimeout(() => setSuccess(""), 3000);
                                        }}
                                    >
                                        Copy to Clipboard
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="border-[#444444] bg-[#333333] text-white hover:bg-[#444444] hover:text-[#a99fec]"
                                        onClick={() => {
                                            if (exportImageUrl) {
                                                // Create a temporary link element
                                                const link = document.createElement('a');
                                                link.href = exportImageUrl;
                                                link.download = 'wollet-backup-encrypted.png';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);

                                                setSuccess("Image downloaded successfully");
                                                setTimeout(() => setSuccess(""), 3000);
                                            }
                                        }}
                                        disabled={!exportImageUrl}
                                    >
                                        Download Image
                                    </Button>
                                )}
                                <Button
                                    className="bg-[#a99fec] text-[#222222] hover:bg-[#9888db]"
                                    onClick={() => {
                                        setShowExportModal(false);
                                        setExportType('text'); // Reset to default for next time
                                        setExportImageUrl(null); // Reset image URL
                                        setExportData(''); // Reset export data
                                    }}
                                >
                                    Close
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}

                {/* Database Import Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-md bg-[#2a2a2a] border-[#333333] text-white">
                            <CardHeader>
                                <CardTitle className="text-[#a99fec]">Import Database</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Choose how you want to import your wallet data
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
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

                                <div className="space-y-4">
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
                                            <AlertCircle className="w-4 h-4 inline mr-1"/>
                                            This will replace your current wallet data. Make sure you have a backup.
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="bg-red-900/20 p-3 rounded-lg flex items-start border border-red-800">
                                            <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5"/>
                                            <span className="text-red-400">{error}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button
                                    variant="outline"
                                    className="border-[#444444] bg-[#333333] text-white hover:bg-[#444444] hover:text-[#a99fec]"
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setImportData("");
                                        setPassphrase("");
                                        setError("");
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
                            </CardFooter>
                        </Card>
                    </div>
                )}
            </div>
        </RouteGuard>
    );
}
