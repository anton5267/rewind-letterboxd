package com.rewind.rewind.list.dto;

import java.util.List;
import com.rewind.rewind.movie.dto.MovieCardResponse;

public class PublicListCardResponse {

    private Long id;
    private String name;
    private String description;
    private Boolean isPublic;

    private Long ownerId;
    private String ownerUsername;
    private String ownerAvatarUrl;
    private List<String> tags;
    private Long likeCount;
    private Long itemCount;
    private List<MovieCardResponse> previewMovies;

    public PublicListCardResponse(
            Long id, String name, String description, Boolean isPublic,
            Long ownerId, String ownerUsername, String ownerAvatarUrl, List<String> tags
    ) {
        this(id, name, description, isPublic, ownerId, ownerUsername, ownerAvatarUrl, tags, null, null, List.of());
    }

    public PublicListCardResponse(
            Long id, String name, String description, Boolean isPublic,
            Long ownerId, String ownerUsername, String ownerAvatarUrl, List<String> tags, Long likeCount
    ) {
        this(id, name, description, isPublic, ownerId, ownerUsername, ownerAvatarUrl, tags, likeCount, null, List.of());
    }

    public PublicListCardResponse(
            Long id, String name, String description, Boolean isPublic,
            Long ownerId, String ownerUsername, String ownerAvatarUrl, List<String> tags,
            Long likeCount, List<MovieCardResponse> previewMovies
    ) {
        this(id, name, description, isPublic, ownerId, ownerUsername, ownerAvatarUrl, tags,
                likeCount, null, previewMovies);
    }

    public PublicListCardResponse(
            Long id, String name, String description, Boolean isPublic,
            Long ownerId, String ownerUsername, String ownerAvatarUrl, List<String> tags,
            Long likeCount, Long itemCount, List<MovieCardResponse> previewMovies
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isPublic = isPublic;
        this.ownerId = ownerId;
        this.ownerUsername = ownerUsername;
        this.ownerAvatarUrl = ownerAvatarUrl;
        this.tags = tags;
        this.likeCount = likeCount;
        this.itemCount = itemCount;
        this.previewMovies = previewMovies == null ? List.of() : previewMovies;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Boolean getIsPublic() { return isPublic; }

    public Long getOwnerId() { return ownerId; }
    public String getOwnerUsername() { return ownerUsername; }
    public String getOwnerAvatarUrl() { return ownerAvatarUrl; }
    public List<String> getTags() { return tags; }
    public Long getLikeCount() { return likeCount; }
    public Long getItemCount() { return itemCount; }
    public List<MovieCardResponse> getPreviewMovies() { return previewMovies; }
}
