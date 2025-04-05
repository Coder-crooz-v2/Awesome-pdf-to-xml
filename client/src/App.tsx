import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "./redux/store";
import { getCurrentUser } from "./redux/slices/authSlice";
import HomePage from "./pages/Home";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import { ThemeProvider } from "./providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./providers/ProtectedRoute";
import { setUser } from "./redux/slices/userSlice";

function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Try to auto login the user on app load
    dispatch(getCurrentUser())
      .unwrap()
      .then((userData) => {
        dispatch(setUser(userData));
      })
      .catch((error) => {
        console.error("Auto login failed:", error);
      });
  }, [dispatch]);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            {/* Add other routes here */}
          </Routes>
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;