package com.rewind.rewind.similar.entity;

import com.rewind.rewind.movie.entity.Movie;
import jakarta.persistence.*;

@Entity
@Table(name = "similar_movies")
public class SimilarMovie {

    @EmbeddedId
    private SimilarMovieId id = new SimilarMovieId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("movieId")
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("similarMovieId")
    @JoinColumn(name = "similar_movie_id", nullable = false)
    private Movie similarMovie;

    public Movie getMovie() { return movie; }
    public Movie getSimilarMovie() { return similarMovie; }
}
