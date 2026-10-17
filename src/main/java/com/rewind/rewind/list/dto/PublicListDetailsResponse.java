package com.rewind.rewind.list.dto;

import com.rewind.rewind.movie.dto.MovieCardResponse;
import java.util.List;

public record PublicListDetailsResponse(
        Long id,
        String name,
        String description,
        Long ownerId,
        String ownerUsername,
        String ownerAvatarUrl,
        List<String> tags,
        List<MovieCardResponse> movies
) {}
