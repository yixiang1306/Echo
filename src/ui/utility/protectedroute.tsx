import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./authprovider";

const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  if (loading) {
    console.log("⏳ Still loading session...");
    return <div>Loading...</div>; // Show this only while loading
  }

  if (!session) {
    console.log("No session found, redirecting to /");
    return <Navigate to="/" replace />;
  }

  console.log("Session found, rendering protected content");
  return <Outlet />;
};

export default ProtectedRoute;
