"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Key, Lock, Eye, EyeOff, QrCode } from "lucide-react";
import { encryptPrivateKey, decryptPrivateKey } from "@/lib/crypto";
import { saveWallet } from "@/lib/db";
import { CryptoWebApi } from "@/lib/cryptowebapi";

// Initialize API client
const apiClient = new CryptoWebApi(process.env.NEXT_PUBLIC_CRYPTOWEBAPI_KEY || "");

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form state
  const [loginAddress, setLoginAddress] = useState("");
  const [loginPassphrase, setLoginPassphrase] = useState("");
  
  // Create wallet form state
  const [createNetwork, setCreateNetwork] = useState<"ethereum" | "bnb">("ethereum");
  const [createPassphrase, setCreatePassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  
  // Import wallet form state
  const [importNetwork, setImportNetwork] = useState<"ethereum" | "bnb">("ethereum");
  const [privateKey, setPrivateKey] = useState("");
  const [importPassphrase, setImportPassphrase] = useState("");

  // Handle login with existing wallet
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        address: loginAddress,
        passphrase: loginPassphrase,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials. Please try again.");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setError("An error occurred during login. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle creating a new wallet
  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passphrases match
    if (createPassphrase !== confirmPassphrase) {
      setError("Passphrases do not match");
      setIsLoading(false);
      return;
    }

    try {
      // Create a new wallet using the API
      const wallet = await apiClient.createWallet(createNetwork);
      
      if (!wallet || !wallet.privateKey) {
        throw new Error("Failed to create wallet");
      }

      // Encrypt the private key with the passphrase
      const encryptedData = await encryptPrivateKey(wallet.privateKey, createPassphrase);
      
      // Save the wallet to IndexedDB
      await saveWallet({
        address: wallet.address,
        network: createNetwork,
        salt: encryptedData.salt,
        iv: encryptedData.iv,
        ciphertext: encryptedData.ciphertext,
      });

      // Log in with the new wallet
      const result = await signIn("credentials", {
        address: wallet.address,
        passphrase: createPassphrase,
        redirect: false,
      });

      if (result?.error) {
        setError("Wallet created but login failed. Please try logging in manually.");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setError("Failed to create wallet. Please try again.");
      console.error("Create wallet error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle importing an existing wallet
  const handleImportWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate private key format
      if (!privateKey || privateKey.length < 64) {
        setError("Invalid private key format");
        setIsLoading(false);
        return;
      }

      // TODO: Derive address from private key using viem/ethers
      // For now, we'll use a placeholder
      const address = "0x..."; // This should be derived from the private key

      // Encrypt the private key with the passphrase
      const encryptedData = await encryptPrivateKey(privateKey, importPassphrase);
      
      // Save the wallet to IndexedDB
      await saveWallet({
        address,
        network: importNetwork,
        salt: encryptedData.salt,
        iv: encryptedData.iv,
        ciphertext: encryptedData.ciphertext,
      });

      // Log in with the imported wallet
      const result = await signIn("credentials", {
        address,
        passphrase: importPassphrase,
        redirect: false,
      });

      if (result?.error) {
        setError("Wallet imported but login failed. Please try logging in manually.");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setError("Failed to import wallet. Please try again.");
      console.error("Import wallet error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BluePay Wallet</h1>
          <p className="text-gray-600 mt-2">Secure, simple crypto management</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login to Wallet</CardTitle>
                <CardDescription>Enter your wallet address and passphrase</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-address">Wallet Address</Label>
                    <Input
                      id="login-address"
                      placeholder="0x..."
                      value={loginAddress}
                      onChange={(e) => setLoginAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-passphrase">Passphrase</Label>
                    <div className="relative">
                      <Input
                        id="login-passphrase"
                        type={showPassword ? "text" : "password"}
                        value={loginPassphrase}
                        onChange={(e) => setLoginPassphrase(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Create Wallet Tab */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Wallet</CardTitle>
                <CardDescription>Generate a new blockchain wallet</CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateWallet}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-network">Blockchain Network</Label>
                    <select
                      id="create-network"
                      className="w-full p-2 border rounded-lg"
                      value={createNetwork}
                      onChange={(e) => setCreateNetwork(e.target.value as "ethereum" | "bnb")}
                    >
                      <option value="ethereum">Ethereum</option>
                      <option value="bnb">BNB Chain</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-passphrase">Secure Passphrase</Label>
                    <div className="relative">
                      <Input
                        id="create-passphrase"
                        type={showPassword ? "text" : "password"}
                        value={createPassphrase}
                        onChange={(e) => setCreatePassphrase(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-passphrase">Confirm Passphrase</Label>
                    <Input
                      id="confirm-passphrase"
                      type="password"
                      value={confirmPassphrase}
                      onChange={(e) => setConfirmPassphrase(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Wallet"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Import Wallet Tab */}
          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle>Import Existing Wallet</CardTitle>
                <CardDescription>Import using private key</CardDescription>
              </CardHeader>
              <form onSubmit={handleImportWallet}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-network">Blockchain Network</Label>
                    <select
                      id="import-network"
                      className="w-full p-2 border rounded-lg"
                      value={importNetwork}
                      onChange={(e) => setImportNetwork(e.target.value as "ethereum" | "bnb")}
                    >
                      <option value="ethereum">Ethereum</option>
                      <option value="bnb">BNB Chain</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="private-key">Private Key</Label>
                    <div className="relative">
                      <Input
                        id="private-key"
                        type={showPassword ? "text" : "password"}
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="import-passphrase">New Passphrase</Label>
                    <Input
                      id="import-passphrase"
                      type="password"
                      value={importPassphrase}
                      onChange={(e) => setImportPassphrase(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Importing..." : "Import Wallet"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}