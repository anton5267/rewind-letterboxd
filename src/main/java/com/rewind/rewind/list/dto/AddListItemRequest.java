package com.rewind.rewind.list.dto;

import jakarta.validation.constraints.NotNull;

public class AddListItemRequest {

    @NotNull
    private Long movieId;

    private Integer position;

    public Long getMovieId() { return movieId; }
    public void setMovieId(Long movieId) { this.movieId = movieId; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
