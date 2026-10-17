package com.rewind.rewind.actor.repo;

import com.rewind.rewind.actor.entity.MovieActor;
import com.rewind.rewind.actor.entity.MovieActorId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;

public interface MovieActorRepository extends JpaRepository<MovieActor, MovieActorId> {
    @EntityGraph(attributePaths = "actor")
    List<MovieActor> findById_MovieIdOrderByCastOrderAsc(Long movieId);
    List<MovieActor> findById_ActorId(Long actorId);
}
