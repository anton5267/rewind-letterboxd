package com.rewind.rewind.list.dto;

import com.rewind.rewind.movie.dto.MovieCardResponse;

public class ListItemResponse {

    private Long id;          // list_items.id (важливо для reorder)
    private Integer position; // position
    private MovieCardResponse movie;

    public ListItemResponse(Long id, Integer position, MovieCardResponse movie) {
        this.id = id;
        this.position = position;
        this.movie = movie;
    }

    public Long getId() { return id; }
    public Integer getPosition() { return position; }
    public MovieCardResponse getMovie() { return movie; }
}
