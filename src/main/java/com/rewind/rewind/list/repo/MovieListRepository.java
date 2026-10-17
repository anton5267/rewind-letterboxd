package com.rewind.rewind.list.repo;

import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.entity.MovieList;
import com.rewind.rewind.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MovieListRepository extends JpaRepository<MovieList, Long> {
    List<MovieList> findAllByUser(User user);
    Optional<MovieList> findByIdAndUser(Long id, User user);
    Optional<MovieList> findByUserAndListType(User user, ListType listType);

    @Query(value = "select l.id as id, u.id as userId, u.username as username, l.name as name, l.description as description, l.listType as listType, l.isPublic as isPublic, count(i.id) as itemCount, l.createdAt as createdAt, l.updatedAt as updatedAt from MovieList l join l.user u left join ListItem i on i.list = l group by l.id, u.id, u.username, l.name, l.description, l.listType, l.isPublic, l.createdAt, l.updatedAt order by l.updatedAt desc",
            countQuery = "select count(l) from MovieList l")
    Page<AdminListProjection> findAdminRows(Pageable pageable);

    @Query("select l.id as id, u.id as userId, u.username as username, l.name as name, l.description as description, l.listType as listType, l.isPublic as isPublic, count(i.id) as itemCount, l.createdAt as createdAt, l.updatedAt as updatedAt from MovieList l join l.user u left join ListItem i on i.list = l where l.id = :id group by l.id, u.id, u.username, l.name, l.description, l.listType, l.isPublic, l.createdAt, l.updatedAt")
    Optional<AdminListProjection> findAdminRowById(@Param("id") Long id);

    // ✅ публічні кастомні списки (для каталогу)
    Page<MovieList> findAllByIsPublicTrueAndListType(ListType listType, Pageable pageable);

    // ✅ публічні кастомні списки інших (якщо треба "не мої")
    Page<MovieList> findAllByIsPublicTrueAndListTypeAndUserIdNot(ListType listType, Long userId, Pageable pageable);

    @Query(value = "select distinct l from MovieList l join l.tags t where l.isPublic = true and l.listType = :type and t.slug = :slug",
            countQuery = "select count(distinct l) from MovieList l join l.tags t where l.isPublic = true and l.listType = :type and t.slug = :slug")
    Page<MovieList> findPublicByTag(@Param("type") ListType type, @Param("slug") String slug, Pageable pageable);
}
