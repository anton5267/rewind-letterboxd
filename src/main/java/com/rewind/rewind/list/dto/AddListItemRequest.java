package com.rewind.rewind.list.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public class AddListItemRequest {

    @NotNull
    @Positive
    private Long movieId;

    @PositiveOrZero
    private Integer position;

    public Long getMovieId() { return movieId; }
    public void setMovieId(Long movieId) { this.movieId = movieId; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
