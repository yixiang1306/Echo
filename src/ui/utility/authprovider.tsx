import { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        setSession(data.session);
        console.log("Existing session found:", data.session);
      } catch (error) {
        console.error("Error retrieving session:", error);
      } finally {
        setIsSessionLoading(false);
      }
    };

    initializeSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log("Auth event:", _event);
        setSession(newSession); // Automatically null when signed out
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, isSessionLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
