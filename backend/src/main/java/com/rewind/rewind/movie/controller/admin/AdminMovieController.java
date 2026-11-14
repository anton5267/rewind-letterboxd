package com.rewind.rewind.movie.controller.admin;

import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.movie.dto.admin.AdminMovieCatalogResponse;
import com.rewind.rewind.movie.dto.admin.CreateMovieRequest;
import com.rewind.rewind.movie.dto.admin.UpdateMovieRequest;
import com.rewind.rewind.movie.service.admin.AdminMovieService;
import com.rewind.rewind.movie.dto.MovieDetailsResponse;
import com.rewind.rewind.movie.service.MovieDetailsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/admin/movies")
public class AdminMovieController {

    private final AdminMovieService service;
    private final MovieDetailsService detailsService;

    public AdminMovieController(AdminMovieService service, MovieDetailsService detailsService) {
        this.service = service;
        this.detailsService = detailsService;
    }

    @GetMapping("/{id}")
    public MovieDetailsResponse details(@PathVariable Long id, Principal principal) {
        return detailsService.getDetails(id, principal.getName());
    }

    @GetMapping
    public Page<AdminMovieCatalogResponse> list(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "50") int size,
                                                @RequestParam(required = false, name = "q") String query) {
        return service.listCatalog(page, size, query);
    }

    @PostMapping
    public MovieCardResponse create(@Valid @RequestBody CreateMovieRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public MovieCardResponse update(@PathVariable Long id, @Valid @RequestBody UpdateMovieRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
