-- Script para adicionar campos de atualização na tabela companies manualmente (caso a migration falhe)
-- Execute: psql -U postgres -d jaspi_hub -f create-app-version-fields.sql

ALTER TABLE companies ADD COLUMN IF NOT EXISTS "empVer" VARCHAR(50) DEFAULT '0.0.0';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS "empAttIs" BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS "empAttDisp" VARCHAR(50);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS "empAttDtaHorIni" TIMESTAMP;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS "empAttDtaHorFim" TIMESTAMP;
