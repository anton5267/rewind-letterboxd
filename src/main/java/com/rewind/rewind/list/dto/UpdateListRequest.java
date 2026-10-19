package com.rewind.rewind.list.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class UpdateListRequest {

    @NotBlank
    @Size(max = 120)
    private String name;

    @Size(max = 5000)
    private String description;

    private Boolean isPublic;
    @Size(max = 10)
    private List<@Size(min = 1, max = 50) String> tags;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
}
