package com.rewind.rewind.tmdb;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class TmdbClient {
    private static final String IMAGE_BASE = "https://image.tmdb.org/t/p/";

    private final RestClient client;
    private final String apiKey;
    private final boolean enabled;

    public TmdbClient(
            @Value("${app.tmdb.base-url:https://api.themoviedb.org/3}") String baseUrl,
            @Value("${app.tmdb.api-key:}") String apiKey,
            @Value("${app.tmdb.enabled:false}") boolean enabled
    ) {
        this.client = RestClient.builder().baseUrl(baseUrl).build();
        this.apiKey = apiKey;
        this.enabled = enabled;
    }

    public MovieData fetchMovie(long tmdbId) {
        if (!enabled || apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "TMDB integration is disabled");
        }
        try {
            JsonNode body = client.get()
                    .uri(uri -> uri.path("/movie/{id}")
                            .queryParam("api_key", apiKey)
                            .queryParam("language", "en-US")
                            .queryParam("append_to_response", "credits,videos,similar,external_ids")
                            .build(tmdbId))
                    .retrieve()
                    .body(JsonNode.class);
            if (body == null || body.path("id").isMissingNode()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "TMDB returned an empty movie");
            }
            return map(body, tmdbId);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "TMDB movie not found");
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "TMDB request failed");
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "TMDB request failed");
        }
    }

    public DiscoveryPage discoverMovies(int page, Integer year, Long genreId,
                                        BigDecimal minRating, int limit) {
        if (!enabled || apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "TMDB integration is disabled");
        }
        try {
            JsonNode body = client.get()
                    .uri(uri -> {
                        var builder = uri.path("/discover/movie")
                                .queryParam("api_key", apiKey)
                                .queryParam("language", "en-US")
                                .queryParam("page", page)
                                .queryParam("sort_by", "popularity.desc")
                                .queryParam("include_adult", false);
                        if (year != null) builder.queryParam("primary_release_year", year);
                        if (genreId != null) builder.queryParam("with_genres", genreId);
                        if (minRating != null) builder.queryParam("vote_average.gte", minRating);
                        return builder.build();
                    })
                    .retrieve()
                    .body(JsonNode.class);
            if (body == null || !body.has("results")) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "TMDB returned an empty discovery page");
            }
            List<Long> ids = new ArrayList<>();
            for (JsonNode node : body.path("results")) {
                Long id = longValue(node, "id");
                if (id != null && !ids.contains(id)) {
                    ids.add(id);
                    if (ids.size() >= limit) break;
                }
            }
            return new DiscoveryPage(page, body.path("total_pages").asInt(page),
                    body.path("total_results").asInt(ids.size()), List.copyOf(ids));
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "TMDB discovery page not found");
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "TMDB discovery request failed");
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "TMDB discovery request failed");
        }
    }

    private MovieData map(JsonNode body, long requestedId) {
        Long id = longValue(body, "id");
        if (id == null) id = requestedId;
        String release = text(body, "release_date");
        LocalDate releaseDate = release == null || release.isBlank() ? null : LocalDate.parse(release);

        List<GenreData> genres = new ArrayList<>();
        for (JsonNode node : body.path("genres")) {
            Long genreId = longValue(node, "id");
            String name = text(node, "name");
            if (genreId != null && name != null && !name.isBlank()) genres.add(new GenreData(genreId, name));
        }

        List<CastData> cast = new ArrayList<>();
        for (JsonNode node : body.path("credits").path("cast")) {
            Long personId = longValue(node, "id");
            String name = text(node, "name");
            if (personId == null || name == null || name.isBlank()) continue;
            cast.add(new CastData(personId, name, imageUrl(text(node, "profile_path"), "w185"),
                    text(node, "character"), integerValue(node, "order")));
            if (cast.size() >= 20) break;
        }

        List<CrewData> directors = new ArrayList<>();
        for (JsonNode node : body.path("credits").path("crew")) {
            if (!"Director".equalsIgnoreCase(text(node, "job"))) continue;
            Long personId = longValue(node, "id");
            String name = text(node, "name");
            if (personId == null || name == null || name.isBlank()) continue;
            directors.add(new CrewData(personId, name, imageUrl(text(node, "profile_path"), "w185")));
        }

        String trailerUrl = null;
        for (JsonNode node : body.path("videos").path("results")) {
            if ("YouTube".equalsIgnoreCase(text(node, "site"))
                    && "Trailer".equalsIgnoreCase(text(node, "type"))) {
                String key = text(node, "key");
                if (key != null && !key.isBlank()) {
                    trailerUrl = "https://www.youtube.com/watch?v=" + key;
                    if (node.path("official").asBoolean(false)) break;
                }
            }
        }

        List<Long> similarIds = new ArrayList<>();
        for (JsonNode node : body.path("similar").path("results")) {
            Long similarId = longValue(node, "id");
            if (similarId != null && !similarId.equals(id) && similarIds.size() < 20) similarIds.add(similarId);
        }

        String imdbId = text(body.path("external_ids"), "imdb_id");
        return new MovieData(id, imdbId, text(body, "title"), integerValue(body, "runtime"), releaseDate,
                text(body, "overview"), imageUrl(text(body, "poster_path"), "w500"),
                imageUrl(text(body, "backdrop_path"), "original"), trailerUrl,
                decimalValue(body, "vote_average"), integerValue(body, "vote_count"),
                genres, cast, directors, similarIds);
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private static Long longValue(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() || !value.canConvertToLong() ? null : value.asLong();
    }

    private static Integer integerValue(JsonNode node, String field) {
        Long value = longValue(node, field);
        return value == null ? null : value.intValue();
    }

    private static BigDecimal decimalValue(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() || !value.isNumber() ? null : value.decimalValue();
    }

    private static String imageUrl(String path, String size) {
        return path == null || path.isBlank() ? null : IMAGE_BASE + size + path;
    }

    public record MovieData(
            Long tmdbId,
            String imdbId,
            String title,
            Integer runtime,
            LocalDate releaseDate,
            String overview,
            String posterUrl,
            String backdropUrl,
            String trailerUrl,
            BigDecimal voteAverage,
            Integer voteCount,
            List<GenreData> genres,
            List<CastData> cast,
            List<CrewData> directors,
            List<Long> similarTmdbIds
    ) {}

    public record DiscoveryPage(int page, int totalPages, int totalResults, List<Long> tmdbIds) {}

    public record GenreData(Long tmdbId, String name) {}
    public record CastData(Long tmdbId, String name, String photoUrl, String characterName, Integer castOrder) {}
    public record CrewData(Long tmdbId, String name, String photoUrl) {}
}
