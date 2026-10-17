package com.rewind.rewind.tmdb;

import com.rewind.rewind.movie.repo.MovieRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TmdbQualityService {
    private final MovieRepository movies;

    public TmdbQualityService(MovieRepository movies) {
        this.movies = movies;
    }

    @Transactional(readOnly = true)
    public TmdbQualityReport report() {
        List<Object[]> rows = movies.findTmdbQualityMetrics();
        Object[] row = rows.isEmpty() ? new Object[0] : rows.get(0);
        long totalMovies = number(row, 0);
        long tmdbLinkedMovies = number(row, 1);
        long completeTmdbMovies = number(row, 8);
        return new TmdbQualityReport(
                totalMovies,
                tmdbLinkedMovies,
                completeTmdbMovies,
                number(row, 2),
                number(row, 3),
                number(row, 4),
                number(row, 5),
                number(row, 6),
                number(row, 7),
                percentage(tmdbLinkedMovies, totalMovies),
                percentage(completeTmdbMovies, tmdbLinkedMovies)
        );
    }

    private long number(Object[] row, int index) {
        if (index >= row.length) return 0L;
        Object value = row[index];
        return value instanceof Number number ? number.longValue() : 0L;
    }

    private double percentage(long value, long total) {
        if (total == 0) return 0.0;
        return Math.round(value * 1000.0 / total) / 10.0;
    }
}
