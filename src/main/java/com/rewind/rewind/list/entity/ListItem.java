package com.rewind.rewind.list.entity;

import com.rewind.rewind.movie.entity.Movie;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "list_items",
        uniqueConstraints = @UniqueConstraint(name = "uk_list_movie", columnNames = {"list_id", "movie_id"})
)
public class ListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "list_id")
    private MovieList list;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id")
    private Movie movie;

    @Column
    private Integer position;

    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt;

    @PrePersist
    void onCreate() {
        addedAt = Instant.now();
    }

    public Long getId() { return id; }

    public MovieList getList() { return list; }
    public void setList(MovieList list) { this.list = list; }

    public Movie getMovie() { return movie; }
    public void setMovie(Movie movie) { this.movie = movie; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
