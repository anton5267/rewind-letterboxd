package com.rewind.rewind.movie.dto;

public class MovieStatusResponse {

    private boolean inWatchlist;
    private boolean watched;
    private boolean favorite;
    private Integer myRating; // null якщо не ставив

    public MovieStatusResponse(boolean inWatchlist, boolean watched, boolean favorite, Integer myRating) {
        this.inWatchlist = inWatchlist;
        this.watched = watched;
        this.favorite = favorite;
        this.myRating = myRating;
    }

    public boolean isInWatchlist() { return inWatchlist; }
    public boolean isWatched() { return watched; }
    public boolean isFavorite() { return favorite; }
    public Integer getMyRating() { return myRating; }
}
