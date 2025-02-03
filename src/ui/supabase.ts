import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://biluyquncyhyyxgrqyxu.supabase.co/";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpbHV5cXVuY3loeXl4Z3JxeXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3ODk4OTUsImV4cCI6MjA1MzM2NTg5NX0.uJlphsFzIYN3a0ToXzSmdkGarSfqSwRQ7TcH9-Hey-4";

// Initialize supabase client after fetching env variables
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);