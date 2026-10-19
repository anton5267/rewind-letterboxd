package com.rewind.rewind.list.repo;

import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.entity.MovieList;
import com.rewind.rewind.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MovieListRepository extends JpaRepository<MovieList, Long> {
    @EntityGraph(attributePaths = "tags")
    List<MovieList> findAllByUser(User user);

    Page<MovieList> findPageByUserOrderByUpdatedAtDescIdDesc(User user, Pageable pageable);

    Page<MovieList> findPageByUserIdAndListTypeAndIsPublicTrueOrderByUpdatedAtDescIdDesc(Long userId, ListType listType, Pageable pageable);
    @Query("select l from MovieList l join l.user u where l.id in :ids and l.isPublic = true and u.isActive = true")
    List<MovieList> findVisibleByIdIn(@Param("ids") Collection<Long> ids);
    Optional<MovieList> findByIdAndUser(Long id, User user);
    Optional<MovieList> findByUserAndListType(User user, ListType listType);

    @Query(value = "select l.id as id, u.id as userId, u.username as username, l.name as name, l.description as description, l.listType as listType, l.isPublic as isPublic, count(i.id) as itemCount, l.createdAt as createdAt, l.updatedAt as updatedAt from MovieList l join l.user u left join ListItem i on i.list = l group by l.id, u.id, u.username, l.name, l.description, l.listType, l.isPublic, l.createdAt, l.updatedAt order by l.updatedAt desc",
            countQuery = "select count(l) from MovieList l")
    Page<AdminListProjection> findAdminRows(Pageable pageable);

    @Query("select l.id as id, u.id as userId, u.username as username, l.name as name, l.description as description, l.listType as listType, l.isPublic as isPublic, count(i.id) as itemCount, l.createdAt as createdAt, l.updatedAt as updatedAt from MovieList l join l.user u left join ListItem i on i.list = l where l.id = :id group by l.id, u.id, u.username, l.name, l.description, l.listType, l.isPublic, l.createdAt, l.updatedAt")
    Optional<AdminListProjection> findAdminRowById(@Param("id") Long id);

    // ✅ публічні кастомні списки (для каталогу)
    @Query("select l from MovieList l join l.user u where l.isPublic = true and l.listType = :listType "
            + "and u.isActive = true")
    Page<MovieList> findPublicCatalog(@Param("listType") ListType listType, Pageable pageable);

    @Query(value = "select l from MovieList l join l.user u where l.isPublic = true and l.listType = :listType "
            + "and u.isActive = true and (:q is null or :q = '' or lower(l.name) like lower(concat('%', :q, '%')) "
            + "or lower(coalesce(l.description, '')) like lower(concat('%', :q, '%')) "
            + "or lower(u.username) like lower(concat('%', :q, '%'))) "
            + "order by l.updatedAt desc, l.id desc",
            countQuery = "select count(l) from MovieList l join l.user u where l.isPublic = true and l.listType = :listType "
                    + "and u.isActive = true and (:q is null or :q = '' or lower(l.name) like lower(concat('%', :q, '%')) "
                    + "or lower(coalesce(l.description, '')) like lower(concat('%', :q, '%')) "
                    + "or lower(u.username) like lower(concat('%', :q, '%')))" )
    Page<MovieList> findPublicCatalogByQuery(@Param("listType") ListType listType, @Param("q") String q, Pageable pageable);

    @Query(value = "SELECT l.* FROM lists l "
            + "JOIN users u ON u.id = l.user_id "
            + "LEFT JOIN list_likes ll ON ll.list_id = l.id "
            + "LEFT JOIN users liker ON liker.id = ll.user_id AND liker.is_active = true "
            + "WHERE l.is_public = true AND l.list_type = :listType AND u.is_active = true "
            + "GROUP BY l.id "
            + "ORDER BY COUNT(DISTINCT liker.id) DESC, l.updated_at DESC, l.id DESC",
            countQuery = "SELECT COUNT(*) FROM lists l JOIN users u ON u.id = l.user_id "
                    + "WHERE l.is_public = true AND l.list_type = :listType AND u.is_active = true",
            nativeQuery = true)
    Page<MovieList> findPopularPublic(@Param("listType") String listType, Pageable pageable);

    @Query(value = "select l from MovieList l join l.user u where l.isPublic = true and l.listType = :type and u.isActive = true and u.isHq = true order by l.updatedAt desc, l.id desc",
            countQuery = "select count(l) from MovieList l join l.user u where l.isPublic = true and l.listType = :type and u.isActive = true and u.isHq = true")
    Page<MovieList> findTeamPublic(@Param("type") ListType type, Pageable pageable);

    @Query(value = "select distinct l from MovieList l join l.tags t join l.user u where l.isPublic = true "
            + "and l.listType = :type and t.slug = :slug and u.isActive = true",
            countQuery = "select count(distinct l) from MovieList l join l.tags t join l.user u where l.isPublic = true "
                    + "and l.listType = :type and t.slug = :slug and u.isActive = true")
    Page<MovieList> findPublicByTag(@Param("type") ListType type, @Param("slug") String slug, Pageable pageable);
}
