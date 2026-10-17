package com.rewind.rewind.journal.entity;

import com.rewind.rewind.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "journal_articles", uniqueConstraints = @UniqueConstraint(name = "uq_journal_articles_slug_language", columnNames = {"slug", "language"}))
public class JournalArticle {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 180) private String slug;
    @Column(nullable = false, length = 2) private String language;
    @Column(nullable = false, length = 80) private String category;
    @Column(nullable = false) private String title;
    @Column(length = 500) private String excerpt;
    @Column(nullable = false, columnDefinition = "TEXT") private String content;
    @Column(name = "cover_url", length = 500) private String coverUrl;
    @Column(name = "is_published", nullable = false) private Boolean isPublished = false;
    @Column(name = "published_at") private Instant publishedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "author_id") private User author;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @PrePersist void onCreate() { Instant now = Instant.now(); createdAt = now; updatedAt = now; }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }
    public Long getId() { return id; }
    public String getSlug() { return slug; } public void setSlug(String value) { slug = value; }
    public String getLanguage() { return language; } public void setLanguage(String value) { language = value; }
    public String getCategory() { return category; } public void setCategory(String value) { category = value; }
    public String getTitle() { return title; } public void setTitle(String value) { title = value; }
    public String getExcerpt() { return excerpt; } public void setExcerpt(String value) { excerpt = value; }
    public String getContent() { return content; } public void setContent(String value) { content = value; }
    public String getCoverUrl() { return coverUrl; } public void setCoverUrl(String value) { coverUrl = value; }
    public Boolean getIsPublished() { return isPublished; } public void setIsPublished(Boolean value) { isPublished = value; }
    public Instant getPublishedAt() { return publishedAt; } public void setPublishedAt(Instant value) { publishedAt = value; }
    public User getAuthor() { return author; } public void setAuthor(User value) { author = value; }
    public Instant getCreatedAt() { return createdAt; } public Instant getUpdatedAt() { return updatedAt; }
}
