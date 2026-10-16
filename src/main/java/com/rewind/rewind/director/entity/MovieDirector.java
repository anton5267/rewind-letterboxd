package com.rewind.rewind.director.entity;

import com.rewind.rewind.movie.entity.Movie;
import jakarta.persistence.*;

@Entity
@Table(name = "movie_directors")
public class MovieDirector {

    @EmbeddedId
    private MovieDirectorId id = new MovieDirectorId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("movieId")
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("directorId")
    @JoinColumn(name = "director_id", nullable = false)
    private Director director;

    public Movie getMovie() { return movie; }
    public Director getDirector() { return director; }
}
