package com.rewind.rewind;

import com.rewind.rewind.actor.entity.Actor;
import com.rewind.rewind.actor.entity.MovieActor;
import com.rewind.rewind.actor.repo.ActorRepository;
import com.rewind.rewind.actor.repo.MovieActorRepository;
import com.rewind.rewind.director.entity.Director;
import com.rewind.rewind.director.entity.MovieDirector;
import com.rewind.rewind.director.repo.DirectorRepository;
import com.rewind.rewind.director.repo.MovieDirectorRepository;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.person.service.PersonService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PersonFilmographyIntegrationTests {
    @Autowired PersonService people;
    @Autowired MovieRepository movies;
    @Autowired ActorRepository actors;
    @Autowired DirectorRepository directors;
    @Autowired MovieActorRepository movieActors;
    @Autowired MovieDirectorRepository movieDirectors;

    @Test
    @Transactional
    void exposesActorAndDirectorFilmographyForGuests() {
        Movie movie = new Movie();
        movie.setTitle("Person filmography fixture");
        movie = movies.saveAndFlush(movie);

        Actor actorFixture = new Actor();
        actorFixture.setName("Actor Fixture");
        actorFixture = actors.saveAndFlush(actorFixture);
        movieActors.saveAndFlush(new MovieActor(movie, actorFixture, "Fixture Character", 0));

        Director directorFixture = new Director();
        directorFixture.setName("Director Fixture");
        directorFixture = directors.saveAndFlush(directorFixture);
        movieDirectors.saveAndFlush(new MovieDirector(movie, directorFixture));

        var actor = people.actor(actorFixture.getId(), null, "newest");
        assertEquals("ACTOR", actor.type());
        assertEquals(1, actor.films().size());
        assertEquals(movie.getId(), actor.films().get(0).id());
        assertEquals("Fixture Character", actor.films().get(0).characterName());
        var director = people.director(directorFixture.getId(), null, "rating");
        assertEquals("DIRECTOR", director.type());
        assertEquals(1, director.films().size());
        assertEquals(movie.getId(), director.films().get(0).id());
    }
}
