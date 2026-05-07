import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Substitua pelos seus valores do Supabase > Project Settings > API
const SUPABASE_URL  = 'https://ylnkvugcungcvscajung.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsbmt2dWdjdW5nY3ZzY2FqdW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODQ3NDIsImV4cCI6MjA5Mzc2MDc0Mn0.wEVTh7tpMLUNjXd76ANW2ukG7wCH4KTper6RmOptL-4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
