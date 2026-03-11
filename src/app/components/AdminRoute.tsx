import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * AdminRoute Component
 * 
 * Protects routes that should only be accessible by Admin users.
 * Redirects non-admin users to the dashboard with an error message.
 */
export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.role !== "Admin") {
        toast.error("Access denied. This feature is only available to Administrators.", {
          duration: 4000,
        });
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#B0BF00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // Only render children if user is Admin
  if (user && user.role === "Admin") {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}
