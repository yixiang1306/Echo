import { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

type AuthContextType = {
  session: Session | null;
  isSessionLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  isSessionLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true); // ✅ Track loading state

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        // ✅ Get current session (also retrieves refresh token)
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (isMounted) {
          setSession(data.session);
          console.log("Existing session found:", data.session);
        }
      } catch (error) {
        console.error("Error retrieving session:", error);
      } finally {
        if (isMounted) {
          setIsSessionLoading(false);
        }
      }
    };

    initializeSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log(" Auth event:", _event);

        if (_event === "SIGNED_OUT") {
          console.log("🚪 User signed out, redirecting...");

          setSession(null);
          navigate("/");
        } else {
          // Avoid unnecessary updates if session remains the same
          setSession((prevSession) => {
            if (JSON.stringify(prevSession) === JSON.stringify(newSession)) {
              return prevSession; // No need to update state
            }
            return newSession; // Only update if different
          });
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, isSessionLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
