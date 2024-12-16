import { createClient } from "@supabase/supabase-js";

// Replace with your actual Supabase URL and anon/public key

const supabaseUrl = "https://uksmigraymeypqvfsevg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc21pZ3JheW1leXBxdmZzZXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzNzAzNzEsImV4cCI6MjA0OTk0NjM3MX0.Q89_vKPPtvXf9-1sLzZ6Uw2vp3zQ8WAPsRb17tjL2bY";

export const supabase = createClient(supabaseUrl, supabaseKey);
