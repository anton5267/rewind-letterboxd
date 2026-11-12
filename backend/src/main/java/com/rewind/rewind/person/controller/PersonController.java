package com.rewind.rewind.person.controller;

import com.rewind.rewind.person.dto.PersonDetailsResponse;
import com.rewind.rewind.person.dto.PersonSearchResponse;
import com.rewind.rewind.person.service.PersonService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class PersonController {
    private final PersonService people;
    public PersonController(PersonService people) { this.people = people; }
    @GetMapping("/actors/{id}")
    public PersonDetailsResponse actor(@PathVariable Long id, @RequestParam(required = false) Long genreId, @RequestParam(defaultValue = "newest") String sort) { return people.actor(id, genreId, sort); }
    @GetMapping("/directors/{id}")
    public PersonDetailsResponse director(@PathVariable Long id, @RequestParam(required = false) Long genreId, @RequestParam(defaultValue = "newest") String sort) { return people.director(id, genreId, sort); }
    @GetMapping("/producers/{id}")
    public PersonDetailsResponse producer(@PathVariable Long id, @RequestParam(required = false) Long genreId, @RequestParam(defaultValue = "newest") String sort) { return people.producer(id, genreId, sort); }

    @GetMapping("/people/search")
    public PersonSearchResponse search(@RequestParam String type, @RequestParam(required = false) String q,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        return people.search(type, q, page, size);
    }
}
