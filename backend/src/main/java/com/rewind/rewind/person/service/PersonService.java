package com.rewind.rewind.person.service;

import com.rewind.rewind.actor.repo.ActorRepository;
import com.rewind.rewind.actor.repo.MovieActorRepository;
import com.rewind.rewind.director.repo.DirectorRepository;
import com.rewind.rewind.director.repo.MovieDirectorRepository;
import com.rewind.rewind.person.dto.PersonDetailsResponse;
import com.rewind.rewind.producer.repo.MovieProducerRepository;
import com.rewind.rewind.producer.repo.ProducerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.Comparator;

@Service
public class PersonService {
    private final ActorRepository actors;
    private final DirectorRepository directors;
    private final MovieActorRepository movieActors;
    private final MovieDirectorRepository movieDirectors;
    private final ProducerRepository producers;
    private final MovieProducerRepository movieProducers;

    public PersonService(ActorRepository actors, DirectorRepository directors, MovieActorRepository movieActors,
                         MovieDirectorRepository movieDirectors, ProducerRepository producers,
                         MovieProducerRepository movieProducers) {
        this.actors = actors; this.directors = directors; this.movieActors = movieActors; this.movieDirectors = movieDirectors;
        this.producers = producers; this.movieProducers = movieProducers;
    }

    @Transactional(readOnly = true)
    public PersonDetailsResponse actor(Long id, Long genreId, String sort) {
        var actor = actors.findById(id).orElseThrow(() -> notFound("Actor"));
        var films = movieActors.findById_ActorId(id).stream()
                .filter(link -> hasGenre(link.getMovie(), genreId))
                .map(link -> film(link.getMovie(), link.getCharacterName())).toList();
        return new PersonDetailsResponse(actor.getId(), actor.getName(), actor.getPhotoUrl(), "ACTOR", sorted(films, sort));
    }

    @Transactional(readOnly = true)
    public PersonDetailsResponse director(Long id, Long genreId, String sort) {
        var director = directors.findById(id).orElseThrow(() -> notFound("Director"));
        var films = movieDirectors.findById_DirectorId(id).stream()
                .filter(link -> hasGenre(link.getMovie(), genreId))
                .map(link -> film(link.getMovie(), null)).toList();
        return new PersonDetailsResponse(director.getId(), director.getName(), director.getPhotoUrl(), "DIRECTOR", sorted(films, sort));
    }

    @Transactional(readOnly = true)
    public PersonDetailsResponse producer(Long id, Long genreId, String sort) {
        var producer = producers.findById(id).orElseThrow(() -> notFound("Producer"));
        var films = movieProducers.findById_ProducerId(id).stream()
                .filter(link -> hasGenre(link.getMovie(), genreId))
                .map(link -> film(link.getMovie(), null)).toList();
        return new PersonDetailsResponse(producer.getId(), producer.getName(), producer.getPhotoUrl(), "PRODUCER", sorted(films, sort));
    }

    private boolean hasGenre(com.rewind.rewind.movie.entity.Movie movie, Long genreId) {
        return genreId == null || movie.getGenres().stream().anyMatch(genre -> genre.getId().equals(genreId));
    }
    private PersonDetailsResponse.Film film(com.rewind.rewind.movie.entity.Movie movie, String characterName) {
        return new PersonDetailsResponse.Film(movie.getId(), movie.getTitle(), movie.getReleaseDate(), movie.getRating(), movie.getPhotoUrl(), characterName);
    }
    private java.util.List<PersonDetailsResponse.Film> sorted(java.util.List<PersonDetailsResponse.Film> films, String sort) {
        Comparator<PersonDetailsResponse.Film> comparator = switch (sort == null ? "newest" : sort) {
            case "oldest" -> Comparator.comparing((PersonDetailsResponse.Film film) -> film.releaseDate(), Comparator.nullsLast(Comparator.naturalOrder()));
            case "title" -> Comparator.comparing((PersonDetailsResponse.Film film) -> film.title(), String.CASE_INSENSITIVE_ORDER);
            case "rating" -> Comparator.comparing((PersonDetailsResponse.Film film) -> film.rating(), Comparator.nullsLast(Comparator.reverseOrder()));
            default -> Comparator.comparing((PersonDetailsResponse.Film film) -> film.releaseDate(), Comparator.nullsLast(Comparator.reverseOrder()));
        };
        Comparator<PersonDetailsResponse.Film> idComparator = new Comparator<PersonDetailsResponse.Film>() {
            @Override
            public int compare(PersonDetailsResponse.Film left, PersonDetailsResponse.Film right) {
                return Long.compare(left.id(), right.id());
            }
        };
        return films.stream().sorted(comparator.thenComparing(idComparator)).toList();
    }
    private ResponseStatusException notFound(String type) { return new ResponseStatusException(HttpStatus.NOT_FOUND, type + " not found"); }
}
