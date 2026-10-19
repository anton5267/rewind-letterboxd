package com.rewind.rewind.search.dto;

import com.rewind.rewind.list.dto.PublicListCardResponse;
import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.tag.dto.TagResponse;
import com.rewind.rewind.user.dto.PublicUserResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public record GlobalSearchResponse(
        Page<MovieCardResponse> films,
        Page<PublicUserResponse> users,
        Page<PublicListCardResponse> lists,
        List<TagResponse> tags,
        List<GlobalSearchPersonResponse> people,
        Page<com.rewind.rewind.review.dto.RecentReviewResponse> reviews,
        Page<GlobalSearchArticleResponse> journal
) {}
