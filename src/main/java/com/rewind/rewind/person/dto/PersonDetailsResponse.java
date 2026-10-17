package com.rewind.rewind.person.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PersonDetailsResponse(Long id, String name, String photoUrl, String type, List<Film> films) {
    public record Film(Long id, String title, LocalDate releaseDate, BigDecimal rating, String photoUrl, String characterName) {}
}
