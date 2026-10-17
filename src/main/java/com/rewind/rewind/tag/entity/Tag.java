package com.rewind.rewind.tag.entity;

import com.rewind.rewind.list.entity.MovieList;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "tags")
public class Tag {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 50) private String name;
    @Column(nullable = false, unique = true, length = 60) private String slug;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @ManyToMany(mappedBy = "tags") private Set<MovieList> lists = new LinkedHashSet<>();

    @PrePersist void onCreate() { createdAt = Instant.now(); }
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public Set<MovieList> getLists() { return lists; }
}
