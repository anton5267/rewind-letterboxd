package com.rewind.rewind.producer.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "producers")
public class Producer {
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
    public Long getTmdbId() { return tmdbId; }
    public String getPhotoUrl() { return photoUrl; }
    public void setName(String name) { this.name = name; }
    public void setTmdbId(Long tmdbId) { this.tmdbId = tmdbId; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
}
