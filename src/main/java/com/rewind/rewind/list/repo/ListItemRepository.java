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
    void deleteByListIdAndMovieId(Long listId, Long movieId);

    @Query("select li.movie from ListItem li where li.list.id = :listId order by li.addedAt desc")
    Page<Movie> findMoviesByListId(@Param("listId") Long listId, Pageable pageable);

    // ✅ для reorder
    List<ListItem> findAllByListId(Long listId);
}
