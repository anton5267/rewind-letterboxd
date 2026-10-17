package com.rewind.rewind;

import com.rewind.rewind.person.service.PersonService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PersonFilmographyIntegrationTests {
    @Autowired PersonService people;

    @Test
    void exposesSeededActorAndDirectorFilmographyForGuests() {
        var actor = people.actor(1L, null, "newest");
        assertEquals("ACTOR", actor.type());
        assertFalse(actor.films().isEmpty());
        var director = people.director(1L, null, "rating");
        assertEquals("DIRECTOR", director.type());
        assertFalse(director.films().isEmpty());
    }
}
