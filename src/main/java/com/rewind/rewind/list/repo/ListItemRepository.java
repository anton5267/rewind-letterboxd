package com.rewind.rewind.list.repo;

import com.rewind.rewind.list.entity.ListItem;
import com.rewind.rewind.list.entity.MovieList;
import com.rewind.rewind.movie.entity.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ListItemRepository extends JpaRepository<ListItem, Long> {
    Optional<ListItem> findByListIdAndMovieId(Long listId, Long movieId);
    boolean existsByListAndMovieId(MovieList list, Long movieId);
    boolean existsByListIdAndMovieId(Long listId, Long movieId);
    long countByListIdAndMovieId(Long listId, Long movieId);
    void deleteByListIdAndMovieId(Long listId, Long movieId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "INSERT IGNORE INTO list_items (list_id, movie_id, position, added_at) "
            + "VALUES (:listId, :movieId, :position, CURRENT_TIMESTAMP)", nativeQuery = true)
    int insertIgnore(@Param("listId") Long listId,
                     @Param("movieId") Long movieId,
                     @Param("position") Integer position);

    @Query("select li.movie from ListItem li where li.list.id = :listId order by li.addedAt desc")
    Page<Movie> findMoviesByListId(@Param("listId") Long listId, Pageable pageable);

    // ✅ для reorder
    @EntityGraph(attributePaths = "movie")
    List<ListItem> findAllByListId(Long listId);
    long countByListId(Long listId);
}
