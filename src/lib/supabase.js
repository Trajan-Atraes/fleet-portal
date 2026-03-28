import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://kiayjlepwmdacojhpisq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_b7zg8JgNWZuMjkG7_HnLeg_yylvj3MH";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export { SUPABASE_URL };
export default supabase;
