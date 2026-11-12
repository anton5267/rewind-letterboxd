package com.rewind.rewind.person.dto;

import java.util.List;

public record PersonSearchResponse(List<PersonSearchResult> content, int totalPages, long totalElements, int number) {
    public record PersonSearchResult(Long id, String name, String photoUrl, String type, long filmCount) {}
}
