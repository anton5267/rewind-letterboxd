package com.rewind.rewind.list.dto;

import java.util.List;

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

    public PublicListCardResponse(
            Long id, String name, String description, Boolean isPublic,
            Long ownerId, String ownerUsername, String ownerAvatarUrl, List<String> tags
    ) {
        this(id, name, description, isPublic, ownerId, ownerUsername, ownerAvatarUrl, tags, null);
    }

    public PublicListCardResponse(
            Long id, String name, String description, Boolean isPublic,
            Long ownerId, String ownerUsername, String ownerAvatarUrl, List<String> tags, Long likeCount
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
}
