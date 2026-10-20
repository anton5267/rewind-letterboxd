package com.rewind.rewind.social.repo;

import com.rewind.rewind.social.entity.ListLike;
import com.rewind.rewind.list.entity.MovieList;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ListLikeRepository extends JpaRepository<ListLike, Long> {
    boolean existsByListIdAndUserId(Long listId, Long userId);
    @Query("select count(ll.id) from ListLike ll where ll.list.id = :listId and ll.user.isActive = true")
    long countActiveByListId(@Param("listId") Long listId);
    long deleteByListIdAndUserId(Long listId, Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "INSERT IGNORE INTO list_likes (list_id, user_id, created_at) VALUES (:listId, :userId, CURRENT_TIMESTAMP)", nativeQuery = true)
    int insertIgnore(@Param("listId") Long listId, @Param("userId") Long userId);

    @Query(value = "SELECT l.* FROM lists l JOIN users owner ON owner.id = l.user_id JOIN list_likes ll ON ll.list_id = l.id JOIN users liker ON liker.id = ll.user_id "
            + "WHERE l.is_public = true AND l.list_type = :listType AND owner.is_active = true AND liker.is_active = true "
            + "GROUP BY l.id ORDER BY MAX(ll.created_at) DESC, l.id DESC",
            countQuery = "SELECT COUNT(DISTINCT l.id) FROM lists l JOIN users owner ON owner.id = l.user_id JOIN list_likes ll ON ll.list_id = l.id JOIN users liker ON liker.id = ll.user_id "
                    + "WHERE l.is_public = true AND l.list_type = :listType AND owner.is_active = true AND liker.is_active = true",
            nativeQuery = true)
    Page<MovieList> findRecentlyLikedPublic(@Param("listType") String listType, Pageable pageable);

    @Query("select ll.list.id as listId, count(ll.id) as likes from ListLike ll where ll.list.id in :listIds and ll.user.isActive = true group by ll.list.id")
    List<ListLikeCountRow> countByListIds(@Param("listIds") Collection<Long> listIds);

    interface ListLikeCountRow {
        Long getListId();
        Long getLikes();
    }
}
