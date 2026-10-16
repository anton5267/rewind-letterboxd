package com.rewind.rewind.similar.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class SimilarMovieId implements Serializable {
    private Long movieId;
    private Long similarMovieId;

    public Long getMovieId() { return movieId; }
    public Long getSimilarMovieId() { return similarMovieId; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SimilarMovieId that)) return false;
        return Objects.equals(movieId, that.movieId) && Objects.equals(similarMovieId, that.similarMovieId);
    }
    @Override public int hashCode() { return Objects.hash(movieId, similarMovieId); }
}
