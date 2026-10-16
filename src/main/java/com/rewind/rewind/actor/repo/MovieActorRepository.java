package com.rewind.rewind.actor.repo;

import com.rewind.rewind.actor.entity.MovieActor;
import com.rewind.rewind.actor.entity.MovieActorId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovieActorRepository extends JpaRepository<MovieActor, MovieActorId> {
    List<MovieActor> findById_MovieIdOrderByCastOrderAsc(Long movieId);
}
