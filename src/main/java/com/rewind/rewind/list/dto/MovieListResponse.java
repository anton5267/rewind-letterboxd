package com.rewind.rewind.list.dto;

import com.rewind.rewind.list.entity.ListType;

import java.util.List;

public class MovieListResponse {
    private Long id;
    private String name;
    private String description;
    private ListType listType;
    private Boolean isPublic;
    private List<String> tags;

    public MovieListResponse(Long id, String name, String description, ListType listType, Boolean isPublic) {
        this(id, name, description, listType, isPublic, List.of());
    }

    public MovieListResponse(Long id, String name, String description, ListType listType, Boolean isPublic, List<String> tags) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.listType = listType;
        this.isPublic = isPublic;
        this.tags = tags;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public ListType getListType() { return listType; }
    public Boolean getIsPublic() { return isPublic; }
    public List<String> getTags() { return tags; }
}
