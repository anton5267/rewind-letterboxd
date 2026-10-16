package com.rewind.rewind.actor.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class MovieActorId implements Serializable {
    private Long movieId;
    private Long actorId;

    public Long getMovieId() { return movieId; }
    public Long getActorId() { return actorId; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MovieActorId that)) return false;
        return Objects.equals(movieId, that.movieId) && Objects.equals(actorId, that.actorId);
    }
    @Override public int hashCode() { return Objects.hash(movieId, actorId); }
}
