package com.rewind.rewind.producer.entity;

import com.rewind.rewind.movie.entity.Movie;
import jakarta.persistence.*;

@Entity
@Table(name = "movie_producers")
public class MovieProducer {
    @EmbeddedId
    private MovieProducerId id = new MovieProducerId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("movieId")
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("producerId")
    @JoinColumn(name = "producer_id", nullable = false)
    private Producer producer;

    public MovieProducer() {}

    public MovieProducer(Movie movie, Producer producer) {
        this.movie = movie;
        this.producer = producer;
        this.id = new MovieProducerId(movie.getId(), producer.getId());
    }

    public Movie getMovie() { return movie; }
    public Producer getProducer() { return producer; }
}
