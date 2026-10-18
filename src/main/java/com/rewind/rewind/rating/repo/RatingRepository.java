package com.rewind.rewind.rating.repo;

import com.rewind.rewind.rating.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByUserIdAndMovieId(Long userId, Long movieId);
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        INSERT INTO ratings (user_id, movie_id, rating, created_at, updated_at)
        VALUES (:userId, :movieId, :rating, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE rating = VALUES(rating), updated_at = CURRENT_TIMESTAMP
        """, nativeQuery = true)
    int upsertAtomic(@Param("userId") Long userId,
                     @Param("movieId") Long movieId,
                     @Param("rating") byte rating);

    long countByUserIdAndMovieId(Long userId, Long movieId);
    @EntityGraph(attributePaths = "movie")
    Page<Rating> findAllByUserIdOrderByUpdatedAtDesc(Long userId, Pageable pageable);
    long countByUserId(Long userId);
    @Query("select r.rating, count(r) from Rating r where r.user.id = :userId group by r.rating order by r.rating")
    List<Object[]> countDistributionByUserId(@Param("userId") Long userId);
    void deleteByUserIdAndMovieId(Long userId, Long movieId);
}
