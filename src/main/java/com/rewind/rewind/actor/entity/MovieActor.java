package com.rewind.rewind.actor.entity;

import com.rewind.rewind.movie.entity.Movie;
import jakarta.persistence.*;

@Entity
@Table(name = "movie_actors")
public class MovieActor {

    @EmbeddedId
    private MovieActorId id = new MovieActorId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("movieId")
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("actorId")
    @JoinColumn(name = "actor_id", nullable = false)
    private Actor actor;

    @Column(name = "character_name", length = 150)
    private String characterName;

    @Column(name = "cast_order")
    private Integer castOrder;

    public Movie getMovie() { return movie; }
    public Actor getActor() { return actor; }
    public String getCharacterName() { return characterName; }
    public Integer getCastOrder() { return castOrder; }
}
