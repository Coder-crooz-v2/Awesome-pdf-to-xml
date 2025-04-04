import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, clearError } from "@/redux/slices/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    identifier: "",
    password: "",
  });
  const [activeTab, setActiveTab] = useState<"email" | "username">("email");
  
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Clear any existing errors when component mounts
    dispatch(clearError());
    
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [dispatch, isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine if using email or username for login
    const credentials = {
      [activeTab]: loginData.identifier,
      password: loginData.password,
    };
    
    dispatch(loginUser(credentials));
  };

  return (
    <div className="container max-w-md mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <Tabs 
                defaultValue="email" 
                className="w-full mb-4" 
                onValueChange={(value) => setActiveTab(value as "email" | "username")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="username">Username</TabsTrigger>
                </TabsList>
                
                <TabsContent value="email" className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Email</Label>
                    <Input 
                      id="identifier" 
                      name="identifier" 
                      type="email" 
                      placeholder="you@example.com" 
                      value={loginData.identifier} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="username" className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Username</Label>
                    <Input 
                      id="identifier" 
                      name="identifier" 
                      type="text" 
                      placeholder="yourusername" 
                      value={loginData.identifier} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  value={loginData.password} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground text-center w-full">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;