ALTER TABLE rewind.users ADD COLUMN supabase_email_updated_at TIMESTAMPTZ;

GRANT SELECT (supabase_email_updated_at), UPDATE (email, supabase_email_updated_at)
    ON rewind.users TO rewind_edge_app;
