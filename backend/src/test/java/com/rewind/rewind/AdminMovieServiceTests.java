package com.rewind.rewind;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rewind.rewind.genre.entity.Genre;
import com.rewind.rewind.genre.repo.GenreRepository;
import com.rewind.rewind.actor.repo.ActorRepository;
import com.rewind.rewind.actor.repo.MovieActorRepository;
import com.rewind.rewind.actor.entity.Actor;
import com.rewind.rewind.actor.entity.MovieActor;
import com.rewind.rewind.director.repo.DirectorRepository;
import com.rewind.rewind.director.repo.MovieDirectorRepository;
import com.rewind.rewind.director.entity.Director;
import com.rewind.rewind.director.entity.MovieDirector;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.movie.dto.admin.AdminMovieCatalogResponse;
import com.rewind.rewind.movie.service.admin.AdminMovieService;
import com.rewind.rewind.producer.repo.ProducerRepository;
import com.rewind.rewind.producer.repo.MovieProducerRepository;
import com.rewind.rewind.producer.entity.Producer;
import com.rewind.rewind.producer.entity.MovieProducer;
import com.rewind.rewind.movie.dto.admin.ActorCreditWriteRequest;
import com.rewind.rewind.movie.dto.admin.CreateMovieRequest;
import org.springframework.test.util.ReflectionTestUtils;
import com.rewind.rewind.movie.dto.admin.UpdateMovieRequest;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;

class AdminMovieServiceTests {

    private final MovieRepository movies = mock(MovieRepository.class);
    private final GenreRepository genres = mock(GenreRepository.class);
    private final ActorRepository actors = mock(ActorRepository.class);
    private final MovieActorRepository movieActors = mock(MovieActorRepository.class);
    private final DirectorRepository directors = mock(DirectorRepository.class);
    private final MovieDirectorRepository movieDirectors = mock(MovieDirectorRepository.class);
    private final ProducerRepository producers = mock(ProducerRepository.class);
    private final MovieProducerRepository movieProducers = mock(MovieProducerRepository.class);
    private final AdminMovieService service = new AdminMovieService(movies, genres, actors, movieActors,
            directors, movieDirectors, producers, movieProducers);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void adminCatalogTrimsSearchAndReturnsVisibleReviewAggregateWithBoundedPaging() {
        AdminMovieCatalogResponse row = new AdminMovieCatalogResponse(
                42L, 550L, "Mercy", null, null, null, 98, "PG-13", 3L);
        when(movies.findAdminMovieCatalog(anyString(), any(Pageable.class))).thenAnswer(invocation ->
                new PageImpl<>(List.of(row), invocation.getArgument(1), 1));

        var result = service.listCatalog(0, 6, "  Mercy  ");

        assertEquals("Mercy", result.getContent().get(0).title());
        assertEquals(3L, result.getContent().get(0).reviewCount());
        org.mockito.ArgumentCaptor<String> query = org.mockito.ArgumentCaptor.forClass(String.class);
        org.mockito.ArgumentCaptor<Pageable> pageable = org.mockito.ArgumentCaptor.forClass(Pageable.class);
        verify(movies).findAdminMovieCatalog(query.capture(), pageable.capture());
        assertEquals("Mercy", query.getValue());
        assertEquals(6, pageable.getValue().getPageSize());
        assertEquals("id: DESC", pageable.getValue().getSort().toString());
    }

    @Test
    void adminCatalogRejectsOverlongSearchBeforeQueryingRepository() {
        assertThrows(IllegalArgumentException.class, () -> service.listCatalog(0, 6, "x".repeat(121)));
        verify(movies, never()).findAdminMovieCatalog(isNull(), any(Pageable.class));
    }

    @Test
    void partialUpdatePreservesOmittedFieldsAndExplicitNullClearsNullableFields() throws Exception {
        Movie existing = new Movie();
        existing.setTitle("Old title");
        existing.setPhotoUrl("https://example.test/poster.jpg");
        existing.setShortPlot("Existing plot");
        when(movies.findById(42L)).thenReturn(Optional.of(existing));
        when(movies.save(any(Movie.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateMovieRequest rename = objectMapper.readValue("{\"title\":\"New title\"}", UpdateMovieRequest.class);
        service.update(42L, rename);
        assertEquals("New title", existing.getTitle());
        assertEquals("https://example.test/poster.jpg", existing.getPhotoUrl());
        assertEquals("Existing plot", existing.getShortPlot());

        UpdateMovieRequest clear = objectMapper.readValue("{\"photoUrl\":null,\"shortPlot\":null}", UpdateMovieRequest.class);
        service.update(42L, clear);
        assertNull(existing.getPhotoUrl());
        assertNull(existing.getShortPlot());
    }

    @Test
    void adminMovieUpdateReplacesGenreLinksOnlyWhenGenreIdsAreProvided() throws Exception {
        Movie existing = new Movie();
        existing.setTitle("Genre movie");
        Genre drama = new Genre();
        when(movies.findById(42L)).thenReturn(Optional.of(existing));
        when(movies.save(any(Movie.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(genres.findAllById(anyIterable())).thenAnswer(invocation -> {
            Iterable<Long> ids = invocation.getArgument(0);
            return ids.iterator().hasNext() ? java.util.List.of(drama) : java.util.List.of();
        });

        UpdateMovieRequest replace = objectMapper.readValue("{\"genreIds\":[9]}", UpdateMovieRequest.class);
        service.update(42L, replace);
        assertEquals(java.util.Set.of(drama), existing.getGenres());

        UpdateMovieRequest partial = objectMapper.readValue("{\"title\":\"Renamed\"}", UpdateMovieRequest.class);
        service.update(42L, partial);
        assertEquals(java.util.Set.of(drama), existing.getGenres());

        UpdateMovieRequest clear = objectMapper.readValue("{\"genreIds\":[]}", UpdateMovieRequest.class);
        service.update(42L, clear);
        assertEquals(java.util.Set.of(), existing.getGenres());
    }

    @Test
    void adminMovieUpdateReplacesCreditsAndPreservesActorRoleMetadata() throws Exception {
        Movie existing = new Movie();
        ReflectionTestUtils.setField(existing, "id", 42L);
        Actor actor = new Actor(); actor.setName("Actor");
        ReflectionTestUtils.setField(actor, "id", 3L);
        Director director = new Director(); director.setName("Director");
        ReflectionTestUtils.setField(director, "id", 5L);
        Producer producer = new Producer(); producer.setName("Producer");
        ReflectionTestUtils.setField(producer, "id", 6L);
        when(movies.findById(42L)).thenReturn(Optional.of(existing));
        when(movies.save(any(Movie.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(actors.findAllById(anyIterable())).thenReturn(java.util.List.of(actor));
        when(directors.findAllById(anyIterable())).thenReturn(java.util.List.of(director));
        when(producers.findAllById(anyIterable())).thenReturn(java.util.List.of(producer));

        UpdateMovieRequest request = objectMapper.readValue("""
                {"actorCredits":[{"actorId":3,"characterName":"Hero","castOrder":2}],"directorIds":[5],"producerIds":[6]}
                """, UpdateMovieRequest.class);
        service.update(42L, request);

        verify(movieActors).deleteByIdMovieId(42L);
        verify(movieDirectors).deleteByIdMovieId(42L);
        verify(movieProducers).deleteByIdMovieId(42L);
        var actorLinks = org.mockito.ArgumentCaptor.forClass(Iterable.class);
        verify(movieActors).saveAll(actorLinks.capture());
        MovieActor actorLink = (MovieActor) actorLinks.getValue().iterator().next();
        assertEquals("Hero", actorLink.getCharacterName());
        assertEquals(2, actorLink.getCastOrder());
    }

    @Test
    void unknownCreditIdsAreRejectedBeforeExistingLinksAreDeleted() throws Exception {
        Movie existing = new Movie();
        ReflectionTestUtils.setField(existing, "id", 42L);
        when(movies.findById(42L)).thenReturn(Optional.of(existing));
        when(movies.save(any(Movie.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(actors.findAllById(anyIterable())).thenReturn(java.util.List.of());
        UpdateMovieRequest request = objectMapper.readValue("{\"actorCredits\":[{\"actorId\":3}]}", UpdateMovieRequest.class);

        assertThrows(IllegalArgumentException.class, () -> service.update(42L, request));
        verify(movieActors, never()).deleteByIdMovieId(42L);
    }

    @Test
    void explicitNullCreditArrayIsRejectedInsteadOfBeingTreatedAsOmitted() throws Exception {
        CreateMovieRequest request = objectMapper.readValue("{\"title\":\"Example\",\"actorCredits\":null}", CreateMovieRequest.class);

        assertThrows(IllegalArgumentException.class, () -> service.create(request));
        verify(movies, never()).save(any(Movie.class));
    }

    @Test
    void explicitOriginalLanguageUpdatesAndNullClearsWithoutTouchingOmittedValue() throws Exception {
        Movie existing = new Movie();
        existing.setTitle("Language movie");
        existing.setOriginalLanguage("ja");
        when(movies.findById(42L)).thenReturn(Optional.of(existing));
        when(movies.save(any(Movie.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateMovieRequest partial = objectMapper.readValue("{\"title\":\"Renamed\"}", UpdateMovieRequest.class);
        service.update(42L, partial);
        assertEquals("ja", existing.getOriginalLanguage());

        UpdateMovieRequest update = objectMapper.readValue("{\"originalLanguage\":\"EN\"}", UpdateMovieRequest.class);
        service.update(42L, update);
        assertEquals("en", existing.getOriginalLanguage());

        UpdateMovieRequest clear = objectMapper.readValue("{\"originalLanguage\":null}", UpdateMovieRequest.class);
        service.update(42L, clear);
        assertNull(existing.getOriginalLanguage());
    }
}
