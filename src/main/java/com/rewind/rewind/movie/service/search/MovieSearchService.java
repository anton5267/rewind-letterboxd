package com.rewind.rewind.movie.service.search;

import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.movie.repo.spec.MovieSpecifications;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class MovieSearchService {

    private final MovieRepository movies;

    public MovieSearchService(MovieRepository movies) {
        this.movies = movies;
    }

    public Page<MovieCardResponse> search(String q,
                                          Long genreId,
                                          String tag,
                                          Integer year,
                                          BigDecimal minRating,
                                          String sort,
                                          int page,
                                          int size) {

        Specification<Movie> spec = Specification
                .where(MovieSpecifications.titleContains(q))
                .and(MovieSpecifications.releaseYearIs(year))
                .and(MovieSpecifications.ratingGte(minRating))
                .and(MovieSpecifications.hasGenreId(genreId))
                .and(MovieSpecifications.hasGenreName(tag));

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                clamp(size, 1, 50),
                toSort(sort)
        );

        return movies.findAll(spec, pageable)
                .map(m -> new MovieCardResponse(
                        m.getId(),
                        m.getTitle(),
                        m.getReleaseDate(),
                        m.getRating(),
                        m.getPhotoUrl()
                ));
    }

    private Sort toSort(String sort) {
        if (sort == null) return Sort.by(Sort.Direction.DESC, "releaseDate");

        return switch (sort) {
            case "newest" -> Sort.by(Sort.Direction.DESC, "releaseDate");
            case "oldest" -> Sort.by(Sort.Direction.ASC, "releaseDate");
            case "rating_desc" -> Sort.by(Sort.Direction.DESC, "rating");
            case "rating_asc" -> Sort.by(Sort.Direction.ASC, "rating");
            case "title_asc" -> Sort.by(Sort.Direction.ASC, "title");
            default -> Sort.by(Sort.Direction.DESC, "releaseDate");
        };
    }

    private int clamp(int v, int min, int max) {
        return Math.max(min, Math.min(max, v));
    }
}
