CREATE TABLE producers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    tmdb_id BIGINT NULL,
    photo_url VARCHAR(255),
    CONSTRAINT uk_producers_tmdb_id UNIQUE (tmdb_id)
);

CREATE TABLE movie_producers (
    movie_id BIGINT NOT NULL,
    producer_id BIGINT NOT NULL,
    PRIMARY KEY (movie_id, producer_id),
    CONSTRAINT fk_movieproducers_movie
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    CONSTRAINT fk_movieproducers_producer
        FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE CASCADE
);

CREATE INDEX idx_movie_producers_producer_movie ON movie_producers (producer_id, movie_id);
