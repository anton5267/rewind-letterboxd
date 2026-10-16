package com.rewind.rewind.director.repo;

import com.rewind.rewind.director.entity.MovieDirector;
import com.rewind.rewind.director.entity.MovieDirectorId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovieDirectorRepository extends JpaRepository<MovieDirector, MovieDirectorId> {
    List<MovieDirector> findById_MovieId(Long movieId);
}
