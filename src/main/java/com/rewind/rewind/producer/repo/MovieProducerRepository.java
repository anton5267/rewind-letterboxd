package com.rewind.rewind.producer.repo;

import com.rewind.rewind.producer.entity.MovieProducer;
import com.rewind.rewind.producer.entity.MovieProducerId;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MovieProducerRepository extends JpaRepository<MovieProducer, MovieProducerId> {
    @EntityGraph(attributePaths = "producer")
    List<MovieProducer> findById_MovieId(Long movieId);
    List<MovieProducer> findById_ProducerId(Long producerId);
    void deleteByIdMovieId(Long movieId);
}
