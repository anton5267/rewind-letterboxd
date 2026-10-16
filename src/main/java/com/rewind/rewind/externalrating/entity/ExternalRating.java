package com.rewind.rewind.externalrating.entity;

import com.rewind.rewind.movie.entity.Movie;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "external_ratings")
public class ExternalRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ExternalRatingSource source; // IMDB

    @Column(nullable = false, precision = 3, scale = 1)
    private BigDecimal rating;

    @Column(name = "votes_count")
    private Integer votesCount;

    @Column(name = "last_updated_at", nullable = false)
    private Instant lastUpdatedAt;

    public Long getId() { return id; }
    public Movie getMovie() { return movie; }
    public ExternalRatingSource getSource() { return source; }
    public BigDecimal getRating() { return rating; }
    public Integer getVotesCount() { return votesCount; }
    public Instant getLastUpdatedAt() { return lastUpdatedAt; }
}
