-- Composite indexes for the read paths used by catalog, profiles, reviews and lists.
-- Existing V1-V21 migrations remain unchanged.

CREATE INDEX idx_lists_user_type ON lists (user_id, list_type);
CREATE INDEX idx_lists_public_type_updated ON lists (is_public, list_type, updated_at);
CREATE INDEX idx_list_items_list_position ON list_items (list_id, position, id);
CREATE INDEX idx_reviews_movie_visible_created ON reviews (movie_id, is_hidden, created_at);
CREATE INDEX idx_reviews_user_updated ON reviews (user_id, updated_at);
CREATE INDEX idx_ratings_user_updated ON ratings (user_id, updated_at);
CREATE INDEX idx_movie_actors_movie_cast ON movie_actors (movie_id, cast_order, actor_id);
