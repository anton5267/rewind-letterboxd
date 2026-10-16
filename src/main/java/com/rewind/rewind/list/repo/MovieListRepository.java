package com.rewind.rewind.list.repo;

import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.entity.MovieList;
import com.rewind.rewind.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MovieListRepository extends JpaRepository<MovieList, Long> {
    List<MovieList> findAllByUser(User user);
    Optional<MovieList> findByIdAndUser(Long id, User user);
    Optional<MovieList> findByUserAndListType(User user, ListType listType);

    // ✅ публічні кастомні списки (для каталогу)
    Page<MovieList> findAllByIsPublicTrueAndListType(ListType listType, Pageable pageable);

    // ✅ публічні кастомні списки інших (якщо треба "не мої")
    Page<MovieList> findAllByIsPublicTrueAndListTypeAndUserIdNot(ListType listType, Long userId, Pageable pageable);
}
