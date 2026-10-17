package com.rewind.rewind.tmdb;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/movies")
public class AdminTmdbController {
    private final TmdbSyncService service;
    private final TmdbBatchSyncService batchSyncService;

    public AdminTmdbController(TmdbSyncService service, TmdbBatchSyncService batchSyncService) {
        this.service = service;
        this.batchSyncService = batchSyncService;
    }

    @PostMapping("/{movieId}/tmdb-sync")
    public TmdbSyncResponse sync(@PathVariable Long movieId, @Valid @RequestBody TmdbSyncRequest request) {
        return service.sync(movieId, request);
    }

    @PostMapping("/tmdb-sync/batch")
    public TmdbBatchSyncResponse syncBatch(@Valid @RequestBody TmdbBatchSyncRequest request) {
        return batchSyncService.sync(request);
    }
}
