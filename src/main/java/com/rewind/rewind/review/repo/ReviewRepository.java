package com.rewind.rewind.review.repo;

import com.rewind.rewind.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "INSERT IGNORE INTO reviews (user_id, movie_id, content, rating) "
            + "VALUES (:userId, :movieId, :content, :rating)", nativeQuery = true)
    int insertIgnore(@Param("userId") Long userId,
                     @Param("movieId") Long movieId,
                     @Param("content") String content,
                     @Param("rating") Byte rating);

    Page<Review> findAllByMovieId(Long movieId, Pageable pageable);
    @Override
    @EntityGraph(attributePaths = {"user", "movie"})
    Page<Review> findAll(Pageable pageable);
    @EntityGraph(attributePaths = {"user", "movie"})
    List<Review> findAllByIdIn(Collection<Long> ids);
    @EntityGraph(attributePaths = {"user", "movie"})
    @Query("select r from Review r where r.id = :id and r.isHidden = false and r.user.isActive = true")
    Optional<Review> findVisibleDetailsById(@Param("id") Long id);
    @EntityGraph(attributePaths = "movie")
    Page<Review> findAllByUserIdOrderByUpdatedAtDesc(Long userId, Pageable pageable);
    @EntityGraph(attributePaths = "user")
    @Query("select r from Review r where r.movie.id = :movieId and r.user.isActive = true and r.isHidden = false "
            + "order by r.createdAt desc, r.id desc")
    Page<Review> findVisibleByMovieId(@Param("movieId") Long movieId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "movie"})
    @Query("select r from Review r where r.user.isActive = true and r.isHidden = false "
            + "order by r.createdAt desc")
    Page<Review> findVisibleRecent(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "movie"})
    @Query(value = "select r from Review r join r.movie m join r.user u where r.isHidden = false and u.isActive = true "
            + "and (lower(r.content) like lower(concat('%', :q, '%')) "
            + "or lower(m.title) like lower(concat('%', :q, '%')) "
            + "or lower(u.username) like lower(concat('%', :q, '%'))) "
            + "order by r.updatedAt desc, r.id desc",
            countQuery = "select count(r) from Review r join r.movie m join r.user u where r.isHidden = false and u.isActive = true "
                    + "and (lower(r.content) like lower(concat('%', :q, '%')) "
                    + "or lower(m.title) like lower(concat('%', :q, '%')) "
                    + "or lower(u.username) like lower(concat('%', :q, '%')))" )
    Page<Review> searchVisible(@Param("q") String q, Pageable pageable);

    @Query(value = "SELECT r.* FROM reviews r "
            + "LEFT JOIN review_likes rl ON rl.review_id = r.id "
            + "LEFT JOIN users liker ON liker.id = rl.user_id AND liker.is_active = true "
            + "JOIN users u ON u.id = r.user_id "
            + "WHERE r.is_hidden = false AND u.is_active = true "
            + "GROUP BY r.id "
            + "ORDER BY COUNT(liker.id) DESC, r.created_at DESC, r.id DESC",
            countQuery = "SELECT COUNT(*) FROM reviews r JOIN users u ON u.id = r.user_id "
                    + "WHERE r.is_hidden = false AND u.is_active = true",
            nativeQuery = true)
    Page<Review> findPopularVisible(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "movie"})
    Page<Review> findAllByIsHidden(Boolean hidden, Pageable pageable);
    @EntityGraph(attributePaths = {"user", "movie"})
    Page<Review> findAllByMovieIdAndIsHidden(Long movieId, Boolean hidden, Pageable pageable);
    @EntityGraph(attributePaths = {"user", "movie"})
    Page<Review> findAllByUserIdAndIsHidden(Long userId, Boolean hidden, Pageable pageable);
    long countByUserIdAndIsHiddenFalse(Long userId);
    long countByIsHiddenTrue();
    @EntityGraph(attributePaths = {"user", "movie"})
    Page<Review> findAllByMovieIdAndUserIdAndIsHidden(Long movieId, Long userId, Boolean hidden, Pageable pageable);
    @EntityGraph(attributePaths = {"user", "movie"})
    Optional<Review> findByIdAndUserId(Long id, Long userId);
    Optional<Review> findByUserIdAndMovieId(Long userId, Long movieId);
    boolean existsByUserIdAndMovieId(Long userId, Long movieId);
    long countByUserIdAndMovieId(Long userId, Long movieId);
}
