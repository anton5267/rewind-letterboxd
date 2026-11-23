-- Reconstructed on 2026-11-20 from read-only metadata of the already-applied
-- production migration. The original SQL body was not present in GitHub or the
-- supplied recovery archive. Validate this source on a disposable PostgreSQL
-- database before using it for a fresh environment.

CREATE TABLE rewind.movie_crew_credits (
  movie_id BIGINT NOT NULL,
  tmdb_person_id BIGINT NOT NULL,
  person_name VARCHAR(255) NOT NULL,
  photo_url VARCHAR(255),
  department VARCHAR(150) NOT NULL DEFAULT '',
  job VARCHAR(255) NOT NULL,
  CONSTRAINT movie_crew_credits_pkey
    PRIMARY KEY (movie_id, tmdb_person_id, department, job),
  CONSTRAINT movie_crew_credits_job_check
    CHECK (btrim(job::text) <> ''::text),
  CONSTRAINT movie_crew_credits_tmdb_person_id_check
    CHECK (tmdb_person_id > 0),
  CONSTRAINT movie_crew_credits_movie_id_fkey
    FOREIGN KEY (movie_id) REFERENCES rewind.movies(id) ON DELETE CASCADE
);

CREATE INDEX movie_crew_credits_person_movie_idx
  ON rewind.movie_crew_credits USING btree (tmdb_person_id, movie_id);

ALTER TABLE rewind.movie_crew_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY edge_app_catalog_delete
  ON rewind.movie_crew_credits FOR DELETE TO rewind_edge_app
  USING (true);

CREATE POLICY edge_app_catalog_insert
  ON rewind.movie_crew_credits FOR INSERT TO rewind_edge_app
  WITH CHECK (true);

CREATE POLICY edge_app_catalog_select
  ON rewind.movie_crew_credits FOR SELECT TO rewind_edge_app
  USING (true);

CREATE POLICY edge_reader_catalog_select
  ON rewind.movie_crew_credits FOR SELECT TO rewind_edge_reader
  USING (true);

GRANT SELECT, INSERT, DELETE ON TABLE rewind.movie_crew_credits TO rewind_edge_app;
GRANT SELECT ON TABLE rewind.movie_crew_credits TO rewind_edge_reader;
