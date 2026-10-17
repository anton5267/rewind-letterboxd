package com.rewind.rewind.tag.repo;

import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.tag.entity.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findBySlug(String slug);
    List<Tag> findAllBySlugIn(Collection<String> slugs);

    @Query("select t from Tag t join t.lists l where l.isPublic = true and l.listType = :type " +
            "group by t.id order by count(l.id) desc, t.name asc")
    List<Tag> findPopular(@Param("type") ListType type, Pageable pageable);
}
