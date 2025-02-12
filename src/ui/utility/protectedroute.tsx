import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./authprovider";
import { supabase } from "./supabaseClient";

const ProtectedRoute = () => {
  const { session, isSessionLoading } = useAuth();
  const navigate = useNavigate();

  const checkServiceStatus = async () => {
    try {
      let { data: serviceStatus, error: serviceStatusError } = await supabase
        .from("AppConfig")
        .select("*");
      console.log(serviceStatus);

      if (serviceStatusError) throw serviceStatusError;
      // @ts-ignore
      if (serviceStatus[0].isAppServiceActive === false) {
        navigate("/maintenance");
      }
    } catch (serviceStatusError) {
      console.error("Error checking service status:", serviceStatusError);
    }
  };

  const checkUserStatus = async () => {
    try {
      let { data: userStatus, error: userStatusError } = await supabase
        .from("User")
        .select("status")
        .eq("accountId", session?.user.id)
        .single();

      if (userStatusError) throw userStatusError;
      // @ts-ignore
      if (userStatus?.status === "INACTIVE") {
        await supabase.auth.signOut();
        console.warn("User session ended due to INACTIVE status.");
      }
    } catch (userStatusError) {
      console.error("Error checking service status:", userStatusError);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
        <div className="loader border-4 border-white border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
        <p className="text-white mt-4">Authenticating...</p>
      </div>
    );
  } else {
    if (!session) {
      console.log("No session found, redirecting to /");
      return <Navigate to="/" replace />;
    }

    checkServiceStatus();
    checkUserStatus();

    console.log("Session found, rendering protected content");
    return <Outlet />;
  }
};

export default ProtectedRoute;
