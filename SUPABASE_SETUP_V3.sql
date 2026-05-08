-- ============================================================
-- SUPABASE_SETUP_V3.sql
-- Tabela para jogos de Crash server-side
-- ============================================================

CREATE TABLE IF NOT EXISTS crash_games (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bet         DECIMAL(10,2) NOT NULL,
  crash_at    DECIMAL(10,2) NOT NULL,           -- ponto de crash (nunca exposto ao cliente)
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  cashout_mult DECIMAL(10,2),
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost'))
);

ALTER TABLE crash_games ENABLE ROW LEVEL SECURITY;

-- Usuário pode ler seus próprios jogos (para histórico), mas nunca ver crash_at
CREATE POLICY "user_own_crash_games" ON crash_games
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_crash_games_user_status ON crash_games(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crash_games_started    ON crash_games(started_at DESC);

-- Limpar jogos ativos órfãos (mais de 10 min sem cashout = perdeu)
-- Rodar periodicamente via pg_cron ou manualmente
-- UPDATE crash_games SET status='lost', finished_at=now()
--  WHERE status='active' AND started_at < now() - interval '10 minutes';
