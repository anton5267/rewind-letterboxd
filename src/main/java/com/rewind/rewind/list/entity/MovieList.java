package com.rewind.rewind.list.entity;

import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.tag.entity.Tag;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "lists")
public class MovieList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "list_type", nullable = false)
    private ListType listType = ListType.CUSTOM;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = false;

    @ManyToMany
    @JoinTable(name = "list_tags", joinColumns = @JoinColumn(name = "list_id"), inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<Tag> tags = new LinkedHashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    // getters/setters
    public Long getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ListType getListType() { return listType; }
    public void setListType(ListType listType) { this.listType = listType; }

    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean aPublic) { isPublic = aPublic; }
    public Set<Tag> getTags() { return tags; }
    public Instant getUpdatedAt() { return updatedAt; }
}
