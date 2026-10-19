package com.rewind.rewind;

import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.producer.entity.MovieProducer;
import com.rewind.rewind.producer.entity.Producer;
import com.rewind.rewind.producer.repo.MovieProducerRepository;
import com.rewind.rewind.producer.repo.ProducerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ProducerIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired MovieRepository movies;
    @Autowired ProducerRepository producers;
    @Autowired MovieProducerRepository movieProducers;

    @Test
    @Transactional
    void guestCanOpenProducerFromMovieAndFilterFilmography() throws Exception {
        Movie movie = new Movie();
        movie.setTitle("Producer fixture film");
        movie.setReleaseDate(LocalDate.of(2026, 10, 18));
        movie = movies.saveAndFlush(movie);

        Producer producer = new Producer();
        producer.setName("Producer Fixture");
        producer.setTmdbId(990001L);
        producer.setPhotoUrl("https://image.tmdb.org/t/p/w185/producer-fixture.jpg");
        producer = producers.saveAndFlush(producer);
        movieProducers.saveAndFlush(new MovieProducer(movie, producer));

        mockMvc.perform(get("/api/movies/{id}/details", movie.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.producers[0].id").value(producer.getId()))
                .andExpect(jsonPath("$.producers[0].name").value("Producer Fixture"));

        mockMvc.perform(get("/api/producers/{id}", producer.getId()).param("sort", "oldest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("PRODUCER"))
                .andExpect(jsonPath("$.name").value("Producer Fixture"))
                .andExpect(jsonPath("$.films[0].id").value(movie.getId()))
                .andExpect(jsonPath("$.films[0].title").value("Producer fixture film"));

        mockMvc.perform(get("/api/producers/{id}", producer.getId()).param("genreId", "999999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.films").isEmpty());
    }
}
