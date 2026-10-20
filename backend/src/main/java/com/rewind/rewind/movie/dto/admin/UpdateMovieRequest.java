package com.rewind.rewind.movie.dto.admin;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class UpdateMovieRequest {

    @Size(max = 255)
    @Pattern(regexp = ".*\\S.*", message = "title must not be blank")
    private String title;
    @Size(max = 20)
    private String imdbId;
    @Positive
    private Integer durationMinutes;
    private LocalDate releaseDate;
    @Size(max = 10)
    private String ageRating;
    @DecimalMin("0.0")
    @DecimalMax("10.0")
    private BigDecimal rating;
    @Size(max = 10000)
    private String shortPlot;
    @Size(max = 255)
    private String photoUrl;
    @Size(max = 255)
    private String backdropUrl;
    @Size(max = 255)
    @Pattern(regexp = "https?://\\S+", message = "Trailer URL must use http or https")
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
