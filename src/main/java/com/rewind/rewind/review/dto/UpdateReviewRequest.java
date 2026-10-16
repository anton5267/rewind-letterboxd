package com.rewind.rewind.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class UpdateReviewRequest {

    @Size(min = 1, max = 5000)
    private String content; // nullable

    @Min(1)
    @Max(5)
    private Integer rating; // nullable

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
}
