
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',

    avatar_url VARCHAR(255),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
CREATE TABLE IF NOT EXISTS movies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    imdb_id VARCHAR(20) UNIQUE,
    title VARCHAR(255) NOT NULL,
    duration_minutes INT NULL,
    release_date DATE,
    age_rating VARCHAR(10),
    rating DECIMAL(2,1),
    short_plot TEXT,
    photo_url VARCHAR(255),
    backdrop_url VARCHAR(255),
    trailer_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
CREATE TABLE IF NOT EXISTS actors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    photo_url VARCHAR(255)
    );
CREATE TABLE IF NOT EXISTS genres (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE
    );
CREATE TABLE IF NOT EXISTS directors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    photo_url VARCHAR(255)
    );
CREATE TABLE IF NOT EXISTS movie_actors (
    movie_id BIGINT NOT NULL,
    actor_id BIGINT NOT NULL,
    character_name VARCHAR(150),
    cast_order INT,
    PRIMARY KEY (movie_id, actor_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES actors(id) ON DELETE CASCADE
    );
CREATE TABLE IF NOT EXISTS movie_genres (
    movie_id BIGINT NOT NULL,
    genre_id BIGINT NOT NULL,
    PRIMARY KEY (movie_id, genre_id),
    CONSTRAINT fk_moviegenres_movie
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    CONSTRAINT fk_moviegenres_genre
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
    );
CREATE TABLE IF NOT EXISTS movie_directors (
    movie_id BIGINT NOT NULL,
    director_id BIGINT NOT NULL,
    PRIMARY KEY (movie_id, director_id),
    CONSTRAINT fk_moviedirectors_movie
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    CONSTRAINT fk_moviedirectors_director
    FOREIGN KEY (director_id) REFERENCES directors(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS lists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    name VARCHAR(120) NOT NULL,
    description TEXT,

    -- системний чи користувацький список
    list_type ENUM('CUSTOM', 'WATCHED', 'WATCHLIST', 'FAVORITES') NOT NULL DEFAULT 'CUSTOM',

    is_public BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_lists_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS list_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    list_id BIGINT NOT NULL,
    movie_id BIGINT NOT NULL,

    position INT,  -- порядок у списку (можна NULL, якщо не важливо)
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_listitems_list
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,

    CONSTRAINT fk_listitems_movie
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,

    -- щоб один і той самий фільм не дублювався в одному списку
    UNIQUE KEY uk_list_movie (list_id, movie_id)
    );


CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,
    movie_id BIGINT NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_reviews_movie
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS ratings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,
    movie_id BIGINT NOT NULL,

    rating TINYINT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ratings_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_ratings_movie
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,

    CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5),

    UNIQUE KEY uk_ratings_user_movie (user_id, movie_id)
    );

CREATE TABLE IF NOT EXISTS external_ratings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    movie_id BIGINT NOT NULL,

    source ENUM('IMDB') NOT NULL,
    rating DECIMAL(3,1) NOT NULL,
    votes_count INT,

    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_externalratings_movie
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,

    UNIQUE KEY uk_movie_source (movie_id, source)
    );
CREATE TABLE IF NOT EXISTS similar_movies (
    movie_id BIGINT NOT NULL,
    similar_movie_id BIGINT NOT NULL,

    PRIMARY KEY (movie_id, similar_movie_id),

    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (similar_movie_id) REFERENCES movies(id) ON DELETE CASCADE
    );
