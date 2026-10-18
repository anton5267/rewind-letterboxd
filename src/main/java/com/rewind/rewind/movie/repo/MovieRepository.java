package com.rewind.rewind.movie.repo;

import com.rewind.rewind.movie.entity.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.Collection;
import java.util.List;

public interface MovieRepository extends JpaRepository<Movie, Long>, JpaSpecificationExecutor<Movie> {

    @EntityGraph(attributePaths = "genres")
    @Query("select m from Movie m where m.id = :movieId")
    Optional<Movie> findWithGenresById(@Param("movieId") Long movieId);

    Optional<Movie> findByTmdbId(Long tmdbId);

    Optional<Movie> findByImdbId(String imdbId);

    List<Movie> findAllByTmdbIdIn(Collection<Long> tmdbIds);

    Page<Movie> findByTmdbIdIsNotNull(Pageable pageable);

    @Query(value = """
        SELECT COUNT(*) AS totalMovies,
               COALESCE(SUM(CASE WHEN m.tmdb_id IS NOT NULL THEN 1 ELSE 0 END), 0) AS tmdbLinkedMovies,
               COALESCE(SUM(CASE WHEN m.tmdb_id IS NOT NULL AND NULLIF(TRIM(m.photo_url), '') IS NULL THEN 1 ELSE 0 END), 0) AS missingPoster,
               COALESCE(SUM(CASE WHEN m.tmdb_id IS NOT NULL AND NULLIF(TRIM(m.backdrop_url), '') IS NULL THEN 1 ELSE 0 END), 0) AS missingBackdrop,
               COALESCE(SUM(CASE WHEN m.tmdb_id IS NOT NULL AND NULLIF(TRIM(m.short_plot), '') IS NULL THEN 1 ELSE 0 END), 0) AS missingPlot,
               COALESCE(SUM(CASE WHEN m.tmdb_id IS NOT NULL AND m.duration_minutes IS NULL THEN 1 ELSE 0 END), 0) AS missingRuntime,
               COALESCE(SUM(CASE WHEN m.tmdb_id IS NOT NULL AND NULLIF(TRIM(m.trailer_url), '') IS NULL THEN 1 ELSE 0 END), 0) AS missingTrailer,
               COALESCE(SUM(CASE WHEN m.tmdb_id IS NOT NULL AND NOT EXISTS (
                   SELECT 1 FROM external_ratings er WHERE er.movie_id = m.id AND er.source = 'TMDB'
               ) THEN 1 ELSE 0 END), 0) AS missingTmdbRating,
               COALESCE(SUM(CASE WHEN m.tmdb_id IS NOT NULL
                   AND NULLIF(TRIM(m.photo_url), '') IS NOT NULL
                   AND NULLIF(TRIM(m.backdrop_url), '') IS NOT NULL
                   AND NULLIF(TRIM(m.short_plot), '') IS NOT NULL
                   AND m.duration_minutes IS NOT NULL
                   AND NULLIF(TRIM(m.trailer_url), '') IS NOT NULL
                   AND EXISTS (
                       SELECT 1 FROM external_ratings er WHERE er.movie_id = m.id AND er.source = 'TMDB'
                   )
               THEN 1 ELSE 0 END), 0) AS completeTmdbMovies
        FROM movies m
        """, nativeQuery = true)
    List<Object[]> findTmdbQualityMetrics();

    @Query("""
        select distinct candidate from Movie candidate join candidate.genres candidateGenre
        where candidate.id <> :movieId and candidateGenre in (
            select sourceGenre from Movie source join source.genres sourceGenre where source.id = :movieId
        )
        order by candidate.rating desc nulls last, candidate.releaseDate desc nulls last
        """)
    Page<Movie> findGenreSimilar(@Param("movieId") Long movieId, Pageable pageable);

    @Modifying
    @Transactional
    @Query(value = """
        UPDATE movies m
        SET m.rating = (
            SELECT CASE
                WHEN COUNT(*) = 0 THEN NULL
                ELSE ROUND(AVG(r.rating), 1)
            END
            FROM ratings r
            WHERE r.movie_id = :movieId
        )
        WHERE m.id = :movieId
        """, nativeQuery = true)
    void recalcAverageRating(@Param("movieId") Long movieId);
}
