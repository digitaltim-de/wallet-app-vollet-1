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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BluePay Wallet</h1>
          <p className="text-gray-600 mt-2">Secure, simple crypto management</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "create")} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="login" disabled={!hasExistingAccounts}>Login</TabsTrigger>
            <TabsTrigger value="create">Create Account</TabsTrigger>
          </TabsList>
          
          {/* Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login to Account</CardTitle>
                <CardDescription>Enter your passphrase to unlock your account</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-passphrase">Passphrase</Label>
                    <div className="relative">
                      <Input
                        id="login-passphrase"
                        type={showPassword ? "text" : "password"}
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        required
                        autoComplete="current-password"
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
                  {error && (
                    <div className="bg-red-50 p-3 rounded-lg flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                      <span className="text-red-600">{error}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Unlocking..." : "Unlock"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          {/* Create Account Tab */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Account</CardTitle>
                <CardDescription>Set up a secure passphrase for your account</CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateAccount}>
                <CardContent className="space-y-4">
                  <Card className="border-2 border-blue-100 rounded-2xl shadow-sm">
                    <CardContent className="p-4 pt-4">
                      <div className="flex items-center mb-2">
                        <Shield className="w-5 h-5 text-blue-500 mr-2" />
                        <h3 className="font-semibold text-gray-900">Security First</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Your passphrase is the only way to access your account. Make sure it's strong and don't forget it!
                      </p>
                    </CardContent>
                  </Card>
                  
                  <div className="space-y-2">
                    <Label htmlFor="create-passphrase">Passphrase</Label>
                    <div className="relative">
                      <Input
                        id="create-passphrase"
                        type={showPassword ? "text" : "password"}
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        required
                        autoComplete="new-password"
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
                      autoComplete="new-password"
                    />
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 p-3 rounded-lg flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                      <span className="text-red-600">{error}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
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