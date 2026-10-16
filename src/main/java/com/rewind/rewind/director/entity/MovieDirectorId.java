package com.rewind.rewind.director.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class MovieDirectorId implements Serializable {
    private Long movieId;
    private Long directorId;

    public Long getMovieId() { return movieId; }
    public Long getDirectorId() { return directorId; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MovieDirectorId that)) return false;
        return Objects.equals(movieId, that.movieId) && Objects.equals(directorId, that.directorId);
    }
    @Override public int hashCode() { return Objects.hash(movieId, directorId); }
}
