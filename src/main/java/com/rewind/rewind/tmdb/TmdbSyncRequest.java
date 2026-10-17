package com.rewind.rewind.tmdb;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class TmdbSyncRequest {
    @NotNull
    @Positive
    private Long tmdbId;

    private boolean syncSimilar = true;

    public Long getTmdbId() { return tmdbId; }
    public void setTmdbId(Long tmdbId) { this.tmdbId = tmdbId; }
    public boolean isSyncSimilar() { return syncSimilar; }
    public void setSyncSimilar(boolean syncSimilar) { this.syncSimilar = syncSimilar; }
}
