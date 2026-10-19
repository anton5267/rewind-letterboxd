package com.rewind.rewind.search.service;

import com.rewind.rewind.actor.repo.ActorRepository;
import com.rewind.rewind.director.repo.DirectorRepository;
import com.rewind.rewind.journal.entity.JournalArticle;
import com.rewind.rewind.journal.repo.JournalArticleRepository;
import com.rewind.rewind.list.dto.PublicListCardResponse;
import com.rewind.rewind.list.service.MovieListService;
import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.movie.service.search.MovieSearchService;
import com.rewind.rewind.search.dto.GlobalSearchArticleResponse;
import com.rewind.rewind.search.dto.GlobalSearchPersonResponse;
import com.rewind.rewind.search.dto.GlobalSearchResponse;
import com.rewind.rewind.tag.dto.TagResponse;
import com.rewind.rewind.tag.entity.Tag;
import com.rewind.rewind.tag.repo.TagRepository;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.user.dto.PublicUserResponse;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.producer.repo.ProducerRepository;
import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.review.repo.ReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;

@Service
public class GlobalSearchService {
    private final MovieSearchService movies;
    private final UserRepository users;
    private final MovieListService lists;
    private final TagRepository tags;
    private final JournalArticleRepository articles;
    private final ActorRepository actors;
    private final DirectorRepository directors;
    private final ProducerRepository producers;
    private final ReviewRepository reviews;

    public GlobalSearchService(MovieSearchService movies, UserRepository users, MovieListService lists,
                               TagRepository tags, JournalArticleRepository articles, ActorRepository actors,
                               DirectorRepository directors, ProducerRepository producers, ReviewRepository reviews) {
        this.movies = movies;
        this.users = users;
        this.lists = lists;
        this.tags = tags;
        this.articles = articles;
        this.actors = actors;
        this.directors = directors;
        this.producers = producers;
        this.reviews = reviews;
    }

    @Transactional(readOnly = true)
    public GlobalSearchResponse search(String query, String language, int size) {
        String q = query == null ? "" : query.trim();
        int resultSize = Math.max(1, Math.min(size, 12));
        Pageable pageable = PageRequest.of(0, resultSize, Sort.by(Sort.Order.asc("username"), Sort.Order.asc("id")));

        Page<MovieCardResponse> filmResults = movies.search(q, null, null, null, null, "title_asc", 0, resultSize);
        Page<PublicUserResponse> userResults = users.searchPublicDirectory(q.isBlank() ? null : q, pageable)
                .map(user -> toUser(user));
        Page<PublicListCardResponse> listResults = lists.publicLists(null, q, 0, resultSize);
        List<TagResponse> tagResults = q.isBlank()
                ? List.of()
                : tags.searchPublic(q, ListType.CUSTOM, PageRequest.of(0, resultSize, Sort.by(Sort.Order.asc("name"))))
                    .map(tag -> toTag(tag)).getContent();
        List<GlobalSearchPersonResponse> peopleResults = people(q, resultSize);
        var reviewResults = reviews.searchVisible(q, PageRequest.of(0, resultSize))
                .map(review -> toReview(review));

        String lang = "en".equals(language) ? "en" : "uk";
        Page<GlobalSearchArticleResponse> journalResults = articles
                .searchPublishedWithFallback(lang, "en".equals(lang) ? "uk" : "en", q,
                        PageRequest.of(0, resultSize))
                .map(article -> toArticle(article));

        return new GlobalSearchResponse(filmResults, userResults, listResults, tagResults,
                peopleResults, reviewResults, journalResults);
    }

    private PublicUserResponse toUser(User user) {
        return new PublicUserResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getAvatarUrl());
    }

    private TagResponse toTag(Tag tag) {
        return new TagResponse(tag.getId(), tag.getName(), tag.getSlug());
    }

    private GlobalSearchArticleResponse toArticle(JournalArticle article) {
        return new GlobalSearchArticleResponse(article.getId(), article.getSlug(), article.getCategory(),
                article.getTitle(), article.getExcerpt(), article.getCoverUrl(), article.getPublishedAt());
    }

    private List<GlobalSearchPersonResponse> people(String q, int size) {
        if (q.isBlank()) return List.of();
        Pageable pageable = PageRequest.of(0, size, Sort.by(Sort.Order.asc("name"), Sort.Order.asc("id")));
        List<GlobalSearchPersonResponse> result = new ArrayList<>();
        actors.findByNameContainingIgnoreCase(q, pageable).forEach(actor -> result.add(new GlobalSearchPersonResponse(actor.getId(), actor.getName(), actor.getPhotoUrl(), "ACTOR")));
        directors.findByNameContainingIgnoreCase(q, pageable).forEach(director -> result.add(new GlobalSearchPersonResponse(director.getId(), director.getName(), director.getPhotoUrl(), "DIRECTOR")));
        producers.findByNameContainingIgnoreCase(q, pageable).forEach(producer -> result.add(new GlobalSearchPersonResponse(producer.getId(), producer.getName(), producer.getPhotoUrl(), "PRODUCER")));
        result.sort((left, right) -> {
            int byName = String.CASE_INSENSITIVE_ORDER.compare(left.name(), right.name());
            return byName != 0 ? byName : left.type().compareTo(right.type());
        });
        return result.size() <= size ? List.copyOf(result) : List.copyOf(result.subList(0, size));
    }

    private com.rewind.rewind.review.dto.RecentReviewResponse toReview(Review review) {
        return new com.rewind.rewind.review.dto.RecentReviewResponse(review.getId(), review.getMovie().getId(),
                review.getMovie().getTitle(), review.getUser().getId(), review.getUser().getUsername(),
                review.getContent(), review.getRating() == null ? null : review.getRating().intValue(), review.getCreatedAt(),
                review.getMovie().getPhotoUrl(), review.getUser().getAvatarUrl());
    }
}
