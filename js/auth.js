import { supabase } from './supabase.js?v=4';

// ===== LOGIN COM EMAIL =====
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// ===== REGISTRO =====
export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { user_name: username } },
  });
  if (error) throw error;
  return data;
}

// ===== LOGIN COM GITHUB =====
export async function signInWithGitHub(redirectUrl) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: redirectUrl },
  });
  if (error) throw error;
}

// ===== LOGOUT =====
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ===== LISTENER DE SESSÃO =====
export function onAuthChange(callback) {
  supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

// ===== PERFIL =====
export async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function saveBalance(userId, balance) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, balance, updated_at: new Date().toISOString() });
  if (error) throw error;
}
