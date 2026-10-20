package com.rewind.rewind.producer.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class MovieProducerId implements Serializable {
    private Long movieId;
    private Long producerId;

    public MovieProducerId() {}

    public MovieProducerId(Long movieId, Long producerId) {
        this.movieId = movieId;
        this.producerId = producerId;
    }

    public Long getMovieId() { return movieId; }
    public Long getProducerId() { return producerId; }

    @Override public boolean equals(Object value) {
        if (this == value) return true;
        if (!(value instanceof MovieProducerId that)) return false;
        return Objects.equals(movieId, that.movieId) && Objects.equals(producerId, that.producerId);
    }

    @Override public int hashCode() { return Objects.hash(movieId, producerId); }
}
