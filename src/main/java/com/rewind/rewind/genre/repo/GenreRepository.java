package com.rewind.rewind.genre.repo;

import com.rewind.rewind.genre.entity.Genre;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GenreRepository extends JpaRepository<Genre, Long> {}
