# RLS Policy Initplan Optimization Plan

> **For agentic workers:** Execute inline in this isolated worktree. Follow the plan task by task and verify the replay before proposing deployment.

**Goal:** Remove the confirmed Supabase `auth_rls_initplan` findings from 27 policies without changing which rows the Edge API role can read or write.

**Architecture:** Add one additive PostgreSQL migration that wraps only transaction-local `current_setting(...)` reads in scalar SELECTs in the exact policies reported by Supabase. Keep policy names, roles, operators, and row predicates intact. Add a local migration-replay assertion for the full 27-policy set.

**Tech Stack:** PostgreSQL 17, Supabase CLI 3.0.0, GitHub Actions.

**Spec:** Supabase performance advisor findings observed 2026-11-28; existing pattern in `supabase/migrations/20261110182447_edge_identity_outbox_worker_rls_initplan.sql`.

## Global Constraints

- Do not change grants, RLS enablement, roles, user data, or row access predicates.
- Never edit an already-applied migration; this is a new versioned migration.
- Keep changes additive and replayable on clean PostgreSQL 17.11.
- Do not deploy or alter production as part of the local implementation.

## Review Focus

- Exact target inventory: test that all 27 named policies exist after replay.
- No unwrapped transaction-local setting calls remain in `USING` or `WITH CHECK`.
- `NULLIF(... )::BIGINT` import ownership checks preserve NULL and cast behavior.
- Existing policy names and target roles remain unchanged.
- A clean migration replay succeeds before any release action.

### Task 1: Regression assertion and migration

**Files:**
- Create: `scripts/verify-rls-initplan.sql`
- Create: `supabase/migrations/20261128120000_cache_edge_policy_settings.sql`
- Modify: `.github/workflows/ci.yml`

- [x] Write the SQL assertion for all 27 policy names and unwrapped `current_setting(...)` calls.
- [x] Verify the current hosted policy catalog reports the expected failing set with a read-only query: 27/27 target policies still have an unwrapped setting call.
- [ ] Add the new migration using `ALTER POLICY`; preserve all current predicates and only wrap the GUC reads.
- [ ] Run the SQL assertion in the CI isolated stack after `supabase db reset --no-seed`.
- [ ] Run clean migration replay and the SQL assertion; inspect the full diff for access-control changes.
