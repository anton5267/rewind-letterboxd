package com.rewind.rewind.tmdb;

import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Opt-in metadata crawl for already linked catalog entries. The default is off
 * so a missing/rotating provider key can never trigger an unsolicited request.
 */
@Component
@ConditionalOnProperty(prefix = "app.tmdb.scheduler", name = "enabled", havingValue = "true")
@ConditionalOnProperty(prefix = "app.tmdb", name = "enabled", havingValue = "true")
public class TmdbCatalogScheduler {
    private static final Logger log = LoggerFactory.getLogger(TmdbCatalogScheduler.class);

    private final MovieRepository movies;
    private final TmdbSyncService sync;
    private final int batchSize;

    public TmdbCatalogScheduler(MovieRepository movies, TmdbSyncService sync,
                                @Value("${app.tmdb.scheduler.batch-size:10}") int batchSize) {
        this.movies = movies;
        this.sync = sync;
        this.batchSize = Math.max(1, Math.min(batchSize, 20));
    }

    @Scheduled(fixedDelayString = "${app.tmdb.scheduler.interval-ms:86400000}", initialDelayString = "${app.tmdb.scheduler.initial-delay-ms:60000}")
    public void refreshCatalogMetadata() {
        var page = movies.findByTmdbIdIsNotNull(PageRequest.of(0, batchSize,
                Sort.by(Sort.Order.asc("updatedAt"), Sort.Order.asc("id"))));
        int succeeded = 0;
        for (Movie movie : page.getContent().stream().limit(batchSize).toList()) {
            try {
                TmdbSyncRequest request = new TmdbSyncRequest();
                request.setTmdbId(movie.getTmdbId());
                request.setSyncSimilar(false);
                sync.sync(movie.getId(), request);
                succeeded++;
            } catch (RuntimeException exception) {
                log.warn("TMDB scheduled sync failed for movie {}", movie.getId(), exception);
            }
        }
        log.info("TMDB scheduled sync completed: {}/{} movies", succeeded, page.getNumberOfElements());
    }
}
