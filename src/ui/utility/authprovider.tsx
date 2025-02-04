import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { Session } from "@supabase/supabase-js";
import {
  markUserAsOffline,
  markUserAsOnline,
  syncCoinsAndSubscriptions,
} from "./syncFunctions";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        console.log("User session found", data.session);
        setSession(data.session);
      } else {
        console.log("No session found, redirecting to login...");
        navigate("/login");
      }
      setLoading(false);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log("🔄 Auth event:", _event, newSession);

        if (_event === "SIGNED_OUT") {
          if (session?.user?.id) {
            const isMarkedOffline = await markUserAsOffline(session.user.id);
            if (!isMarkedOffline) {
              console.error("Failed to mark user as offline");
            }
          }
          setSession(null);
          navigate("/login");
        } else if (newSession?.user) {
          setSession(newSession);
          const userId = newSession.user.id;

          try {
            const isMarkedOnline = await markUserAsOnline(userId);
            if (!isMarkedOnline) {
              console.error("Failed to mark user as online");
            }

            const isSynced = await syncCoinsAndSubscriptions(userId);
            if (!isSynced) {
              console.error("Failed to sync user coins and subscriptions");
            }
          } catch (error) {
            console.error("Error during user sync:", error);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [session]); // Dependency on session to keep track of the last logged-in user

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
