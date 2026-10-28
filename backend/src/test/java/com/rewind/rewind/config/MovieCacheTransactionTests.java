package com.rewind.rewind.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisKeyCommands;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MovieCacheTransactionTests {
    private final RedisConnectionFactory connections = mock(RedisConnectionFactory.class);
    private final RedisConnection connection = mock(RedisConnection.class);
    private final RedisKeyCommands keys = mock(RedisKeyCommands.class);
    private Cache cache;

    @BeforeEach
    void startTransaction() {
        when(connections.getConnection()).thenReturn(connection);
        when(connection.keyCommands()).thenReturn(keys);
        var manager = new CacheConfig().redisCacheManager(connections);
        manager.afterPropertiesSet();
        cache = manager.getCache("movieDetails");
        assertNotNull(cache);
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);
    }

    @AfterEach
    void clearTransaction() {
        TransactionSynchronizationManager.clearSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(false);
    }

    @Test
    void ratingEvictionWaitsUntilDatabaseCommit() {
        cache.evict(9L);
        verifyNoInteractions(connections);

        var synchronizations = TransactionSynchronizationManager.getSynchronizations();
        synchronizations.forEach(TransactionSynchronization::afterCommit);
        synchronizations.forEach(sync -> sync.afterCompletion(TransactionSynchronization.STATUS_COMMITTED));

        verify(keys).del(any(byte[].class));
    }

    @Test
    void rolledBackRatingDoesNotEvictCommittedMovieDetails() {
        cache.evict(9L);
        TransactionSynchronizationManager.getSynchronizations().forEach(
                sync -> sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));

        verifyNoInteractions(connections);
    }
}
