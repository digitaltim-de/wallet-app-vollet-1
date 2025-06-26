"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Key, Eye, EyeOff, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { useAccountStore } from "@/store/account";
import { useToast } from "@/components/ui/use-toast";

export default function LoginOrCreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { unlocked, login, createAccount } = useAccountStore();

  // Form state
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // UI state
  const [hasExistingAccounts, setHasExistingAccounts] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "create">("login");

  // Check if user is already logged in
  useEffect(() => {
    if (unlocked) {
      router.push("/dashboard");
    }
  }, [unlocked, router]);

  // Check if there are any existing accounts
  useEffect(() => {
    const checkExistingAccounts = async () => {
      try {
        const dbList = await indexedDB.databases();
        const hasAccounts = dbList.some(db => db.name?.startsWith("bp_"));
        setHasExistingAccounts(hasAccounts);

        // If no accounts exist, default to create tab
        if (!hasAccounts) {
          setActiveTab("create");
        }
      } catch (error) {
        console.error("Error checking databases:", error);
        setHasExistingAccounts(false);
      }
    };

    checkExistingAccounts();
  }, []);

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await login(passphrase);

      switch (result) {
        case "ok":
          router.push("/dashboard");
          break;
        case "not-found":
          toast({
            title: "Account not found",
            description: "No account exists with this passphrase. Would you like to create one?",
            variant: "destructive"
          });
          setActiveTab("create");
          break;
        case "wrong-pass":
          toast({
            title: "Authentication failed",
            description: "Wrong passphrase. Please try again.",
            variant: "destructive"
          });
          break;
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle account creation
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passphrases match
    if (passphrase !== confirmPassphrase) {
      setError("Passphrases do not match");
      setIsLoading(false);
      return;
    }

    // Validate passphrase strength
    if (passphrase.length < 8) {
      setError("Passphrase must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const result = await createAccount(passphrase);

      switch (result) {
        case "created":
          toast({
            title: "Account created",
            description: "Your account has been created successfully.",
            variant: "default"
          });
          router.push("/dashboard");
          break;
        case "exists":
          toast({
            title: "Account already exists",
            description: "An account with this passphrase already exists.",
            variant: "destructive"
          });
          setActiveTab("login");
          break;
      }
    } catch (error) {
      console.error("Create account error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking for existing accounts
  if (hasExistingAccounts === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#222222] p-4 sm:p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2a2a2a] mb-4">
            <Wallet className="h-8 w-8 text-[#a99fec]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Wollet APP</h1>
          <p className="text-gray-400">Secure, simple crypto management</p>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "login" | "create")}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-2 bg-[#2a2a2a]">
            <TabsTrigger 
              value="login" 
              className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-[#a99fec] data-[state=active]:shadow-none text-gray-400"
              disabled={!hasExistingAccounts && hasExistingAccounts !== null}
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="create" 
              className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-[#a99fec] data-[state=active]:shadow-none text-gray-400"
            >
              Create Account
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card className="bg-[#2a2a2a] border-0 shadow-none text-white">
              <CardHeader>
                <CardTitle className="text-white">Login to Account</CardTitle>
                <CardDescription className="text-gray-400">Enter your passphrase to unlock your account</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passphrase" className="text-gray-300">Passphrase</Label>
                    <div className="relative">
                      <Input
                        id="passphrase"
                        type={showPassword ? "text" : "password"}
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        required
                        className="bg-[#222222] border-[#3a3a3a] focus:border-[#a99fec] text-white"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#a99fec]"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <div className="bg-[#3a2a2a] p-3 rounded-lg flex items-start border border-red-900">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                      <span className="text-red-400">{error}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#a99fec] text-[#222222] hover:bg-[#9888db] transition-colors" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Unlocking..." : "Unlock"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Create Account Tab */}
          <TabsContent value="create">
            <Card className="bg-[#2a2a2a] border-0 shadow-none text-white">
              <CardHeader>
                <CardTitle className="text-white">Create New Account</CardTitle>
                <CardDescription className="text-gray-400">Set up a secure passphrase for your account</CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateAccount}>
                <CardContent className="space-y-4">
                  <Card className="border border-[#3a3a3a] bg-[#222222] rounded-xl">
                    <CardContent className="p-4 pt-4">
                      <div className="flex items-center mb-2">
                        <Shield className="w-5 h-5 text-[#a99fec] mr-2" />
                        <h3 className="font-semibold text-white">Security First</h3>
                      </div>
                      <p className="text-sm text-gray-400">
                        Your passphrase is the only way to access your account. Make sure it's strong and don't forget it!
                      </p>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <Label htmlFor="create-passphrase" className="text-gray-300">Passphrase</Label>
                    <div className="relative">
                      <Input
                        id="create-passphrase"
                        type={showPassword ? "text" : "password"}
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        required
                        className="bg-[#222222] border-[#3a3a3a] focus:border-[#a99fec] text-white"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#a99fec]"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-passphrase" className="text-gray-300">Confirm Passphrase</Label>
                    <Input
                      id="confirm-passphrase"
                      type="password"
                      value={confirmPassphrase}
                      onChange={(e) => setConfirmPassphrase(e.target.value)}
                      required
                      className="bg-[#222222] border-[#3a3a3a] focus:border-[#a99fec] text-white"
                      autoComplete="new-password"
                    />
                  </div>

                  {error && (
                    <div className="bg-[#3a2a2a] p-3 rounded-lg flex items-start border border-red-900">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                      <span className="text-red-400">{error}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#a99fec] text-[#222222] hover:bg-[#9888db] transition-colors" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating..." : "Create Account"}
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
