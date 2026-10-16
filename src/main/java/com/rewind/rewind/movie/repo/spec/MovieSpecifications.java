package com.rewind.rewind.movie.repo.spec;

import com.rewind.rewind.movie.entity.Movie;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;

public class MovieSpecifications {

    public static Specification<Movie> titleContains(String q) {
        return (root, query, cb) -> {
            if (q == null || q.isBlank()) return cb.conjunction();
            String like = "%" + q.trim().toLowerCase() + "%";
            return cb.like(cb.lower(root.get("title")), like);
        };
    }

    public static Specification<Movie> releaseYearIs(Integer year) {
        return (root, query, cb) -> {
            if (year == null) return cb.conjunction();
            LocalDate from = LocalDate.of(year, 1, 1);
            LocalDate to = LocalDate.of(year, 12, 31);
            return cb.between(root.get("releaseDate"), from, to);
        };
    }

    public static Specification<Movie> ratingGte(BigDecimal minRating) {
        return (root, query, cb) -> {
            if (minRating == null) return cb.conjunction();
            return cb.greaterThanOrEqualTo(root.get("rating"), minRating);
        };
    }

    public static Specification<Movie> hasGenreId(Long genreId) {
        return (root, query, cb) -> {
            if (genreId == null) return cb.conjunction();
            query.distinct(true);
            var genresJoin = root.join("genres");
            return cb.equal(genresJoin.get("id"), genreId);
        };
    }
    public static Specification<Movie> hasGenreName(String tag) {
        return (root, query, cb) -> {
            if (tag == null || tag.isBlank()) return cb.conjunction();
            query.distinct(true);
            var genresJoin = root.join("genres");
            return cb.like(cb.lower(genresJoin.get("name")), "%" + tag.trim().toLowerCase() + "%");
        };
    }

}
