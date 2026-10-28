package com.rewind.rewind.movie.service;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

@Service
public class MovieDetailsCacheService {

    @CacheEvict(cacheNames = "movieDetails", key = "#movieId")
    public void evict(Long movieId) {
        // The next public movie-details request will load the current rating from the database.
    }
}
