package com.rewind.rewind.movie.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public class MovieDetailsResponse {

    private Long id;
    private String imdbId;
    private String title;
    private Integer durationMinutes;
    private LocalDate releaseDate;
    private String ageRating;
    private BigDecimal rating;
    private String shortPlot;
    private String photoUrl;
    private String backdropUrl;
    private String trailerUrl;

    private List<IdNameDto> genres;
    private List<PersonDto> directors;
    private List<ActorRoleDto> actors;

    private List<ExternalRatingDto> externalRatings;
    private List<MovieCardResponse> similarMovies;

    private MyFlags myFlags; // null якщо не авторизований

    public MovieDetailsResponse(
            Long id, String imdbId, String title, Integer durationMinutes, LocalDate releaseDate,
            String ageRating, BigDecimal rating, String shortPlot,
            String photoUrl, String backdropUrl, String trailerUrl,
            List<IdNameDto> genres,
            List<PersonDto> directors,
            List<ActorRoleDto> actors,
            List<ExternalRatingDto> externalRatings,
            List<MovieCardResponse> similarMovies,
            MyFlags myFlags
    ) {
        this.id = id;
        this.imdbId = imdbId;
        this.title = title;
        this.durationMinutes = durationMinutes;
        this.releaseDate = releaseDate;
        this.ageRating = ageRating;
        this.rating = rating;
        this.shortPlot = shortPlot;
        this.photoUrl = photoUrl;
        this.backdropUrl = backdropUrl;
        this.trailerUrl = trailerUrl;
        this.genres = genres;
        this.directors = directors;
        this.actors = actors;
        this.externalRatings = externalRatings;
        this.similarMovies = similarMovies;
        this.myFlags = myFlags;
    }

    public Long getId() { return id; }
    public String getImdbId() { return imdbId; }
    public String getTitle() { return title; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public LocalDate getReleaseDate() { return releaseDate; }
    public String getAgeRating() { return ageRating; }
    public BigDecimal getRating() { return rating; }
    public String getShortPlot() { return shortPlot; }
    public String getPhotoUrl() { return photoUrl; }
    public String getBackdropUrl() { return backdropUrl; }
    public String getTrailerUrl() { return trailerUrl; }
    public List<IdNameDto> getGenres() { return genres; }
    public List<PersonDto> getDirectors() { return directors; }
    public List<ActorRoleDto> getActors() { return actors; }
    public List<ExternalRatingDto> getExternalRatings() { return externalRatings; }
    public List<MovieCardResponse> getSimilarMovies() { return similarMovies; }
    public MyFlags getMyFlags() { return myFlags; }

    public static class IdNameDto {
        private Long id;
        private String name;
        public IdNameDto(Long id, String name) { this.id = id; this.name = name; }
        public Long getId() { return id; }
        public String getName() { return name; }
    }

    public static class PersonDto {
        private Long id;
        private String name;
        private String photoUrl;
        public PersonDto(Long id, String name, String photoUrl) {
            this.id = id; this.name = name; this.photoUrl = photoUrl;
        }
        public Long getId() { return id; }
        public String getName() { return name; }
        public String getPhotoUrl() { return photoUrl; }
    }

    public static class ActorRoleDto {
        private Long id;
        private String name;
        private String photoUrl;
        private String characterName;
        private Integer castOrder;

        public ActorRoleDto(Long id, String name, String photoUrl, String characterName, Integer castOrder) {
            this.id = id;
            this.name = name;
            this.photoUrl = photoUrl;
            this.characterName = characterName;
            this.castOrder = castOrder;
        }

        public Long getId() { return id; }
        public String getName() { return name; }
        public String getPhotoUrl() { return photoUrl; }
        public String getCharacterName() { return characterName; }
        public Integer getCastOrder() { return castOrder; }
    }

    public static class ExternalRatingDto {
        private String source;
        private BigDecimal rating;
        private Integer votesCount;
        private Instant lastUpdatedAt;

        public ExternalRatingDto(String source, BigDecimal rating, Integer votesCount, Instant lastUpdatedAt) {
            this.source = source;
            this.rating = rating;
            this.votesCount = votesCount;
            this.lastUpdatedAt = lastUpdatedAt;
        }

        public String getSource() { return source; }
        public BigDecimal getRating() { return rating; }
        public Integer getVotesCount() { return votesCount; }
        public Instant getLastUpdatedAt() { return lastUpdatedAt; }
    }

    public static class MyFlags {
        private boolean watched;
        private boolean watchlist;
        private boolean favorites;

        public MyFlags(boolean watched, boolean watchlist, boolean favorites) {
            this.watched = watched;
            this.watchlist = watchlist;
            this.favorites = favorites;
        }

        public boolean isWatched() { return watched; }
        public boolean isWatchlist() { return watchlist; }
        public boolean isFavorites() { return favorites; }
    }
}
