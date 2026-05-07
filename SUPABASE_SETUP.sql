-- ============================================================
-- Cole este SQL no Supabase > SQL Editor > New Query > Run
-- ============================================================

-- Perfil do usuário (balanço)
CREATE TABLE IF NOT EXISTS profiles (
  id        UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username  TEXT,
  balance   DECIMAL(10,2) DEFAULT 50.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventário
CREATE TABLE IF NOT EXISTS inventory (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_data   JSONB NOT NULL,
  obtained_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de aberturas
CREATE TABLE IF NOT EXISTS history (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  case_id     TEXT,
  case_name   TEXT,
  price       DECIMAL(10,2),
  item_data   JSONB NOT NULL,
  opened_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS) — cada user só vê seus dados
-- ============================================================
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE history   ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "user_own_profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Inventory
CREATE POLICY "user_own_inventory" ON inventory
  FOR ALL USING (auth.uid() = user_id);

-- History
CREATE POLICY "user_own_history" ON history
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: criar perfil automaticamente ao registrar
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user   ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_opened ON history(opened_at DESC);
