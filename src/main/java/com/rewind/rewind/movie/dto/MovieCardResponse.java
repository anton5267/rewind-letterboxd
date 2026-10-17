package com.rewind.rewind.movie.dto;

import java.time.LocalDate;
import java.math.BigDecimal;

public class MovieCardResponse {

    private Long id;
    private Long tmdbId;
    private String title;
    private LocalDate releaseDate;
    private BigDecimal rating;
    private String photoUrl;

    /** Required by the Redis JSON serializer when a cached details response is read back. */
    public MovieCardResponse() {
    }

    public MovieCardResponse(
            Long id,
            String title,
            LocalDate releaseDate,
            BigDecimal rating,
            String photoUrl
    ) {
        this(id, null, title, releaseDate, rating, photoUrl);
    }

    public MovieCardResponse(
            Long id,
            Long tmdbId,
            String title,
            LocalDate releaseDate,
            BigDecimal rating,
            String photoUrl
    ) {
        this.id = id;
        this.tmdbId = tmdbId;
        this.title = title;
        this.releaseDate = releaseDate;
        this.rating = rating;
        this.photoUrl = photoUrl;
    }

    public Long getId() { return id; }

    public Long getTmdbId() { return tmdbId; }

    public String getTitle() { return title; }

    public LocalDate getReleaseDate() { return releaseDate; }

    public BigDecimal getRating() { return rating; }

    public String getPhotoUrl() { return photoUrl; }
}
