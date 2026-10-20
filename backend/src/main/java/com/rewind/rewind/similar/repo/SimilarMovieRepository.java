package com.rewind.rewind.similar.repo;

import com.rewind.rewind.similar.entity.SimilarMovie;
import com.rewind.rewind.similar.entity.SimilarMovieId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;

public interface SimilarMovieRepository extends JpaRepository<SimilarMovie, SimilarMovieId> {
    @EntityGraph(attributePaths = "similarMovie")
    List<SimilarMovie> findById_MovieId(Long movieId);
    void deleteByIdMovieId(Long movieId);
}
