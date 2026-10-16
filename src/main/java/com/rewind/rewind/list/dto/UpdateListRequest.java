package com.rewind.rewind.list.dto;

import jakarta.validation.constraints.Size;

public class UpdateListRequest {

    @Size(min = 1, max = 120)
    private String name;

    @Size(max = 5000)
    private String description;

    private Boolean isPublic;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
}
