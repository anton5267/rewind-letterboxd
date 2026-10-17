package com.rewind.rewind.tag.service;

import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.entity.MovieList;
import com.rewind.rewind.tag.dto.TagResponse;
import com.rewind.rewind.tag.entity.Tag;
import com.rewind.rewind.tag.repo.TagRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TagService {
    private final TagRepository tags;
    public TagService(TagRepository tags) { this.tags = tags; }

    @Transactional
    @SuppressWarnings("null")
    public void replaceTags(MovieList list, List<String> values) {
        Map<String, String> normalized = normalize(values);
        Map<String, Tag> existing = tags.findAllBySlugIn(normalized.keySet()).stream()
                .collect(Collectors.toMap(Tag::getSlug, tag -> tag));
        Set<Tag> resolved = normalized.entrySet().stream().map(entry -> existing.computeIfAbsent(entry.getKey(), slug -> {
            Tag tag = new Tag();
            tag.setName(entry.getValue());
            tag.setSlug(slug);
            return tags.save(tag);
        })).collect(Collectors.toCollection(java.util.LinkedHashSet::new));
        list.getTags().clear();
        list.getTags().addAll(resolved);
    }

    @Transactional(readOnly = true)
    public List<TagResponse> popular(int size) {
        return tags.findPopular(ListType.CUSTOM, PageRequest.of(0, Math.max(1, Math.min(size, 30))))
                .stream().map(this::response).toList();
    }

    @SuppressWarnings("null")
    public List<TagResponse> responses(java.util.Collection<Tag> source) {
        return source.stream().map(this::response).toList();
    }

    private TagResponse response(Tag tag) { return new TagResponse(tag.getId(), tag.getName(), tag.getSlug()); }

    private Map<String, String> normalize(List<String> values) {
        if (values == null) return Map.of();
        if (values.size() > 10) throw new IllegalArgumentException("At most 10 tags are allowed");
        Map<String, String> result = new LinkedHashMap<>();
        for (String value : values) {
            if (value == null) continue;
            String name = value.trim().replaceAll("\\s+", " ");
            if (name.isEmpty()) continue;
            if (name.length() > 50) throw new IllegalArgumentException("Tag is too long");
            String slug = Normalizer.normalize(name, Normalizer.Form.NFKD).toLowerCase(Locale.ROOT)
                    .replaceAll("[^\\p{L}\\p{N}]+", "-").replaceAll("^-|-$", "");
            if (slug.isBlank() || slug.length() > 60) throw new IllegalArgumentException("Invalid tag");
            result.putIfAbsent(slug, name);
        }
        return result;
    }
}
