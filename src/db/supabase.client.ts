import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Service role client for server-side operations (bypasses RLS)
export const supabaseServiceClient = createClient<Database>(supabaseUrl, supabaseServiceKey);

export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "0e0fdd5b-b395-4862-9451-9c7da0e1a895";
