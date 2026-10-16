package com.rewind.rewind.list.dto;

public class PublicListCardResponse {

    private Long id;
    private String name;
    private String description;
    private Boolean isPublic;

    private Long ownerId;
    private String ownerUsername;
    private String ownerAvatarUrl;

    public PublicListCardResponse(
            Long id, String name, String description, Boolean isPublic,
            Long ownerId, String ownerUsername, String ownerAvatarUrl
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isPublic = isPublic;
        this.ownerId = ownerId;
        this.ownerUsername = ownerUsername;
        this.ownerAvatarUrl = ownerAvatarUrl;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Boolean getIsPublic() { return isPublic; }

    public Long getOwnerId() { return ownerId; }
    public String getOwnerUsername() { return ownerUsername; }
    public String getOwnerAvatarUrl() { return ownerAvatarUrl; }
}
