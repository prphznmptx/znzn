-- =============================================
-- ADD PORTFOLIO CONNECTION TRACKING
-- Tracks whether a provider profile is connected to user's Portfolio
-- =============================================

-- 1. Add portfolio_connected column to projects_page_providers
ALTER TABLE public.projects_page_providers
ADD COLUMN IF NOT EXISTS portfolio_connected BOOLEAN DEFAULT FALSE;

-- 2. Create index for faster queries on portfolio_connected status
CREATE INDEX IF NOT EXISTS idx_projects_page_providers_portfolio_connected
ON public.projects_page_providers(user_id, portfolio_connected)
WHERE portfolio_connected = TRUE;

-- =============================================
-- NOTES
-- =============================================
-- When portfolio_connected is TRUE:
-- - The 'name' and 'avatar_url' fields are synced from the user's portfolio profile
-- - These fields will persist whenever the user returns to edit the provider profile
-- - Changes to the portfolio profile will automatically reflect in the provider profile
-- 
-- To implement auto-sync, implement a trigger or use application logic to update
-- the provider's name and avatar_url when the profiles table is updated.
