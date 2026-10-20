package com.rewind.rewind.director.repo;

import com.rewind.rewind.director.entity.MovieDirector;
import com.rewind.rewind.director.entity.MovieDirectorId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;

public interface MovieDirectorRepository extends JpaRepository<MovieDirector, MovieDirectorId> {
    @EntityGraph(attributePaths = "director")
    List<MovieDirector> findById_MovieId(Long movieId);
    List<MovieDirector> findById_DirectorId(Long directorId);
    void deleteByIdMovieId(Long movieId);
}
