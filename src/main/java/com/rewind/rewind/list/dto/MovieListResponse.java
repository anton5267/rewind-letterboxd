package com.rewind.rewind.list.dto;

import com.rewind.rewind.list.entity.ListType;

public class MovieListResponse {
    private Long id;
    private String name;
    private String description;
    private ListType listType;
    private Boolean isPublic;

    public MovieListResponse(Long id, String name, String description, ListType listType, Boolean isPublic) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.listType = listType;
        this.isPublic = isPublic;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public ListType getListType() { return listType; }
    public Boolean getIsPublic() { return isPublic; }
}
