import { createClient } from "@supabase/supabase-js";

async function fetchEnvData() {
  try {
    //@ts-ignore
    const env = await window.electron.getEnv();
    return env;
  } catch (error) {
    console.error("Failed to fetch environment variables:", error);
  }
}

const envData = await fetchEnvData();

const SUPABASE_URL = (envData.SUPABASE_URL as string) || "";
const SUPABASE_KEY = (envData.SUPABASE_KEY as string) || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
