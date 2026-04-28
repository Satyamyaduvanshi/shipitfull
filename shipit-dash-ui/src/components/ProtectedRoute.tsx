import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = isAuthenticated();
  const location = useLocation();

  if (!isAuth) {
    // Redirect to login but save the current location to return to after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};