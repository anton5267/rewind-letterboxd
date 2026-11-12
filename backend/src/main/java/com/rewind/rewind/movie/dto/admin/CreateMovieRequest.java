package com.rewind.rewind.movie.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.EnumSet;

public class CreateMovieRequest {

    public enum Field { GENRE_IDS, DIRECTOR_IDS, PRODUCER_IDS, ACTOR_CREDITS }
    private final EnumSet<Field> providedFields = EnumSet.noneOf(Field.class);

    @NotBlank
    @Size(max = 255)
    private String title;

    @Size(max = 20)
    private String imdbId;
    @Pattern(regexp = "(?i)^[a-z]{2}$", message = "originalLanguage must be a two-letter ISO language code")
    private String originalLanguage;
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
    @Size(max = 100)
    private List<@NotNull @Positive Long> genreIds;
    @Size(max = 100)
    private List<@NotNull @Positive Long> directorIds;
    @Size(max = 100)
    private List<@NotNull @Positive Long> producerIds;
    @Size(max = 100)
    private List<@NotNull @Valid ActorCreditWriteRequest> actorCredits;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getImdbId() { return imdbId; }
    public void setImdbId(String imdbId) { this.imdbId = imdbId; }
    public String getOriginalLanguage() { return originalLanguage; }
    public void setOriginalLanguage(String originalLanguage) { this.originalLanguage = originalLanguage; }

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

    public List<Long> getGenreIds() { return genreIds; }
    public void setGenreIds(List<Long> genreIds) { this.genreIds = genreIds; providedFields.add(Field.GENRE_IDS); }
    public List<Long> getDirectorIds() { return directorIds; }
    public void setDirectorIds(List<Long> directorIds) { this.directorIds = directorIds; providedFields.add(Field.DIRECTOR_IDS); }
    public List<Long> getProducerIds() { return producerIds; }
    public void setProducerIds(List<Long> producerIds) { this.producerIds = producerIds; providedFields.add(Field.PRODUCER_IDS); }
    public List<ActorCreditWriteRequest> getActorCredits() { return actorCredits; }
    public void setActorCredits(List<ActorCreditWriteRequest> actorCredits) { this.actorCredits = actorCredits; providedFields.add(Field.ACTOR_CREDITS); }
    public boolean wasProvided(Field field) { return providedFields.contains(field); }
}
