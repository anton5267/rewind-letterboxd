package com.rewind.rewind.director.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "directors")
public class Director {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "tmdb_id", unique = true)
    private Long tmdbId;

    @Column(name = "photo_url")
    private String photoUrl;

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getPhotoUrl() { return photoUrl; }
    public Long getTmdbId() { return tmdbId; }
    public void setTmdbId(Long tmdbId) { this.tmdbId = tmdbId; }
    public void setName(String name) { this.name = name; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
}
