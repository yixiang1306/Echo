import { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { useLoading } from "./loadingContext";

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
  const { setLoading } = useLoading();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      setLoading(true);
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
          setLoading(false);
          setIsSessionLoading(false);
        }
      }
    };

    initializeSession();

    // ✅ Listen for authentication state changes (session refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("🔄 Auth event:", _event, session);

        if (_event === "SIGNED_IN" && session) {
          console.log("User signed in:", session.user.id);
          setSession(session);
        } else if (_event === "SIGNED_OUT") {
          console.log("User signed out, redirecting...");
          setSession(null);
          navigate("/");
        } else if (_event === "TOKEN_REFRESHED" && session) {
          console.log("Session refreshed:", session);
          setSession(session);
        } else if (_event === "USER_UPDATED" && session) {
          console.log("User updated:", session);
          setSession(session);
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
