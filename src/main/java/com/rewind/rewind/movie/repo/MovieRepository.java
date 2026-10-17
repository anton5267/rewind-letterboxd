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

public interface MovieRepository extends JpaRepository<Movie, Long>, JpaSpecificationExecutor<Movie> {

    @EntityGraph(attributePaths = "genres")
    @Query("select m from Movie m where m.id = :movieId")
    Optional<Movie> findWithGenresById(@Param("movieId") Long movieId);

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
