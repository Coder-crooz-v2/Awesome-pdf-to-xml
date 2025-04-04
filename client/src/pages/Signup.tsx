import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, clearError } from "@/redux/slices/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const SignupPage = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
    });
    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [passwordsMatch, setPasswordsMatch] = useState(true);

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

    // Check if passwords match
    useEffect(() => {
        if (formData.password && formData.confirmPassword) {
            setPasswordsMatch(formData.password === formData.confirmPassword);
        } else {
            setPasswordsMatch(true);
        }
    }, [formData.password, formData.confirmPassword]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file type
            if (!file.type.match('image.*')) {
                toast.error("Invalid file type",{
                    description: "Please upload an image file",
                });
                return;
            }

            // Validate file size (max 1MB)
            if (file.size > 1024 * 1024) {
                toast.error("File too large", {
                    description: "Avatar image must be less than 1MB",
                });
                return;
            }

            setAvatar(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords don't match", {
                description: "Please ensure both passwords match",
            });
            return;
        }

        // Create registration data
        const registrationData = {
            fullName: formData.fullName,
            email: formData.email,
            username: formData.username,
            password: formData.password,
            ...(avatar && { avatar }),
        };

        const result = await dispatch(registerUser(registrationData));

        if (registerUser.fulfilled.match(result)) {
            toast.success("Registration successful", {
                description: "Please login with your credentials",
            });
            navigate("/login");
        }
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
                        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                        <CardDescription>
                            Enter your information to create an account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className={!passwordsMatch ? "border-red-500" : ""}
                                />
                                {!passwordsMatch && (
                                    <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="avatar">Profile Picture (Optional)</Label>
                                <div className="flex items-center space-x-4">
                                    {avatarPreview && (
                                        <div className="w-16 h-16 rounded-full overflow-hidden">
                                            <img
                                                src={avatarPreview}
                                                alt="Avatar preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <Label
                                        htmlFor="avatar-upload"
                                        className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                                    >
                                        <div className="flex flex-col items-center space-y-2">
                                            <Upload className="h-8 w-8 text-gray-500" />
                                            <span className="text-sm text-muted-foreground">
                                                {avatar ? avatar.name : "Upload avatar image"}
                                            </span>
                                        </div>
                                        <Input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarChange}
                                        />
                                    </Label>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading || !passwordsMatch}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    "Create account"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <div className="text-sm text-muted-foreground text-center w-full">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary hover:underline">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
};

export default SignupPage;