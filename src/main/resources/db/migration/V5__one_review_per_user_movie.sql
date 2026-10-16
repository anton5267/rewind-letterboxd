-- A user can keep one active review per film. Preserve older duplicates before
-- applying the constraint, retaining the most recent row in reviews.
CREATE TABLE review_archive LIKE reviews;

INSERT INTO review_archive
SELECT older.*
FROM reviews older
WHERE EXISTS (
    SELECT 1 FROM reviews newer
    WHERE newer.user_id = older.user_id
      AND newer.movie_id = older.movie_id
      AND newer.id > older.id
);

DELETE older
FROM reviews older
JOIN reviews newer
  ON newer.user_id = older.user_id
 AND newer.movie_id = older.movie_id
 AND newer.id > older.id;

ALTER TABLE reviews ADD UNIQUE KEY uk_reviews_user_movie (user_id, movie_id);
