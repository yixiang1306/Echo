import { createClient } from "@supabase/supabase-js";

// Replace with your actual Supabase URL and anon/public key

const supabaseUrl = "";
const supabaseKey = "";

export const supabase = createClient(supabaseUrl, supabaseKey);
