package com.rewind.rewind.movie.dto.admin;

import java.math.BigDecimal;
import java.time.LocalDate;

public class UpdateMovieRequest {

    private String title;
    private String imdbId;
    private Integer durationMinutes;
    private LocalDate releaseDate;
    private String ageRating;
    private BigDecimal rating;
    private String shortPlot;
    private String photoUrl;
    private String backdropUrl;
    private String trailerUrl;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getImdbId() { return imdbId; }
    public void setImdbId(String imdbId) { this.imdbId = imdbId; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public LocalDate getReleaseDate() { return releaseDate; }
    public void setReleaseDate(LocalDate releaseDate) { this.releaseDate = releaseDate; }

    public String getAgeRating() { return ageRating; }
    public void setAgeRating(String ageRating) { this.ageRating = ageRating; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    public String getShortPlot() { return shortPlot; }
    public void setShortPlot(String shortPlot) { this.shortPlot = shortPlot; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getBackdropUrl() { return backdropUrl; }
    public void setBackdropUrl(String backdropUrl) { this.backdropUrl = backdropUrl; }

    public String getTrailerUrl() { return trailerUrl; }
    public void setTrailerUrl(String trailerUrl) { this.trailerUrl = trailerUrl; }
}
