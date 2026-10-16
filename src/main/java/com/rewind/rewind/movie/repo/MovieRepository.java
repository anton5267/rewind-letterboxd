package com.rewind.rewind.movie.repo;

import com.rewind.rewind.movie.entity.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface MovieRepository extends JpaRepository<Movie, Long>, JpaSpecificationExecutor<Movie> {

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
