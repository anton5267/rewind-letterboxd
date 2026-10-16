package com.rewind.rewind.actor.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "actors")
public class Actor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "photo_url")
    private String photoUrl;

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getPhotoUrl() { return photoUrl; }
}
