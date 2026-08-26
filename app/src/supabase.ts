import { createClient } from '@supabase/supabase-js';
import { secureStorage } from './storage';

const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url,key,{ auth:{ storage:secureStorage, persistSession:true, autoRefreshToken:true, detectSessionInUrl:false } }) : null;
