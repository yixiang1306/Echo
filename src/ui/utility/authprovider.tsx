import { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

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
    let isMounted = true; // ✅ Prevents state updates on unmounted components

    const initializeSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data?.session && isMounted) {
          console.log("✅ Existing session found:", data.session);
          setSession(data.session);
        }
      } catch (error) {
        console.error("❌ Error retrieving session:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeSession();

    // Listen for auth state changes only in the main window
    if (window.opener == null) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          console.log("🔄 Auth event:", _event, session);

          if (_event === "SIGNED_IN" && session) {
            console.log("✅ User signed in:", session.user.id);
            setSession(session);
          }

          if (_event === "SIGNED_OUT") {
            console.log("🚪 User signed out, redirecting...");
            setSession(null);
            navigate("/");
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
        isMounted = false;
      };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
