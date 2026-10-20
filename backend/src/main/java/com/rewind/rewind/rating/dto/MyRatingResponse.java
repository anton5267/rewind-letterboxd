package com.rewind.rewind.rating.dto;

public class MyRatingResponse {
    private Integer rating;

    public MyRatingResponse(Integer rating) {
        this.rating = rating;
    }

    public Integer getRating() { return rating; }
}
