import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nlqfzlwmmrnjbjinsjja.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scWZ6bHdtbXJuamJqaW5zamphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MTQ4MDMsImV4cCI6MjA5OTI5MDgwM30.id4JawfBxnMaC1AfUHYzIhwL4HBRqdng1yuRfNboF58";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to check if tables are accessible
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("items").select("id").limit(1);
    if (error) {
      console.warn("Supabase connection check warning (table might not exist yet):", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase connection failed:", err);
    return false;
  }
}
