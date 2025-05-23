import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zjjkfvozqkdrqwgxbfef.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqamtmdm96cWtkcnF3Z3hiZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NTgwNjQsImV4cCI6MjA1NjIzNDA2NH0.ypRLhhhK5mZI255mEcAwd3k4z-cpia31S1VRfoV8OB0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
