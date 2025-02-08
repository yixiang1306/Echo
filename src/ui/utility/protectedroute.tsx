import { Navigate, Outlet } from "react-router-dom";
import { useLoading } from "./loadingContext";
import { useAuth } from "./authprovider";

const ProtectedRoute = () => {
  const { session } = useAuth();
  const { isLoading } = useLoading();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
        <div className="loader border-4 border-white border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
        <p className="text-white mt-4">Authenticating...</p>
      </div>
    );
  }

  if (!session) {
    console.log("🚫 No session found, redirecting to /");
    return <Navigate to="/" replace />;
  }

  console.log("✅ Session found, rendering protected content");
  return <Outlet />;
};

export default ProtectedRoute;
