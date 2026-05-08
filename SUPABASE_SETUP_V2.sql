-- ============================================================
-- SUPABASE_SETUP_V2.sql
-- Execute no SQL Editor do Supabase (New Query → Run)
-- Adiciona: daily bonus, achievements, XP de rank,
--           funções SECURITY DEFINER para saldo seguro,
--           e RLS restrito que bloqueia update direto do balance.
-- ============================================================

-- 1. Novos campos na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_daily_claim TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rank_xp           INTEGER DEFAULT 0;

-- 2. Tabela de conquistas desbloqueadas por usuário
CREATE TABLE IF NOT EXISTS user_achievements (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id);

-- ============================================================
-- 3. RLS restrito em profiles:
--    usuários autenticados só podem LER seu próprio perfil.
--    Toda escrita de saldo passa por funções SECURITY DEFINER.
-- ============================================================
DROP POLICY IF EXISTS "user_own_profile" ON profiles;
CREATE POLICY "user_read_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
-- INSERT é tratado exclusivamente pelo trigger handle_new_user()

-- ============================================================
-- 4. spend_balance(p_amount) — debita saldo atomicamente
-- ============================================================
CREATE OR REPLACE FUNCTION spend_balance(p_amount DECIMAL)
RETURNS DECIMAL LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance DECIMAL;
  v_uid     UUID := auth.uid();
BEGIN
  IF v_uid IS NULL  THEN RAISE EXCEPTION 'unauthenticated';  END IF;
  IF p_amount <= 0  THEN RAISE EXCEPTION 'invalid_amount';   END IF;

  UPDATE profiles
     SET balance = balance - p_amount,
         updated_at = now()
   WHERE id = v_uid
     AND balance >= p_amount
   RETURNING balance INTO v_balance;

  IF NOT FOUND THEN RAISE EXCEPTION 'insufficient_balance'; END IF;
  RETURN v_balance;
END;
$$;

-- ============================================================
-- 5. add_balance(p_amount) — adiciona saldo (cassino, venda, recompensas)
-- ============================================================
CREATE OR REPLACE FUNCTION add_balance(p_amount DECIMAL)
RETURNS DECIMAL LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance DECIMAL;
  v_uid     UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount';  END IF;

  UPDATE profiles
     SET balance = balance + p_amount,
         updated_at = now()
   WHERE id = v_uid
   RETURNING balance INTO v_balance;

  RETURN v_balance;
END;
$$;

-- ============================================================
-- 6. claim_daily_bonus(p_amount) — bônus diário (1x por dia UTC)
-- ============================================================
CREATE OR REPLACE FUNCTION claim_daily_bonus(p_amount DECIMAL)
RETURNS DECIMAL LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance DECIMAL;
  v_last    TIMESTAMPTZ;
  v_uid     UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT last_daily_claim INTO v_last FROM profiles WHERE id = v_uid;

  IF v_last IS NOT NULL
     AND DATE(v_last AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC')
  THEN
    RAISE EXCEPTION 'already_claimed';
  END IF;

  UPDATE profiles
     SET balance          = balance + p_amount,
         last_daily_claim = now(),
         updated_at       = now()
   WHERE id = v_uid
   RETURNING balance INTO v_balance;

  RETURN v_balance;
END;
$$;

-- ============================================================
-- 7. add_rank_xp(p_xp) — incrementa XP de rank
-- ============================================================
CREATE OR REPLACE FUNCTION add_rank_xp(p_xp INTEGER)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_xp  INTEGER;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  UPDATE profiles
     SET rank_xp    = rank_xp + p_xp,
         updated_at = now()
   WHERE id = v_uid
   RETURNING rank_xp INTO v_xp;

  RETURN v_xp;
END;
$$;

-- ============================================================
-- 8. initialize_balance(p_balance) — migração de saldo de convidado
--    só aplica se o saldo ainda está no valor inicial (50.00)
-- ============================================================
CREATE OR REPLACE FUNCTION initialize_balance(p_balance DECIMAL)
RETURNS DECIMAL LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance DECIMAL;
  v_uid     UUID := auth.uid();
BEGIN
  IF v_uid IS NULL   THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_balance <= 50 THEN RETURN 50; END IF;

  UPDATE profiles
     SET balance    = p_balance,
         updated_at = now()
   WHERE id = v_uid
     AND balance = 50.00
   RETURNING balance INTO v_balance;

  IF NOT FOUND THEN
    SELECT balance INTO v_balance FROM profiles WHERE id = v_uid;
  END IF;

  RETURN v_balance;
END;
$$;

-- ============================================================
-- Índices extras para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_inventory_user  ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user    ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_opened  ON history(opened_at DESC);
