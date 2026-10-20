package com.rewind.rewind.admin.repo;

import com.rewind.rewind.admin.dto.AdminModerationQueueItem;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Types;

@Repository
public class AdminModerationQueueRepository {
    // Merge before applying LIMIT/OFFSET so both types share one stable order.
    private static final String CANDIDATES = """
            SELECT 'REVIEW' AS item_type, r.id, NULL AS parent_id, r.movie_id,
                   m.title AS subject, r.user_id, u.username, r.content, r.created_at
            FROM reviews r JOIN users u ON u.id = r.user_id JOIN movies m ON m.id = r.movie_id
            WHERE r.moderated_at IS NULL AND (:type IS NULL OR :type = 'REVIEW')
              AND (:query IS NULL OR LOWER(r.content) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')))
            UNION ALL
            SELECT 'COMMENT' AS item_type, c.id, c.review_id AS parent_id, NULL AS movie_id,
                   CONCAT('Review #', c.review_id) AS subject, c.user_id, u.username, c.content, c.created_at
            FROM comments c JOIN users u ON u.id = c.user_id
            WHERE c.moderated_at IS NULL AND (:type IS NULL OR :type = 'COMMENT')
              AND (:query IS NULL OR LOWER(c.content) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')))
            """;

    private final NamedParameterJdbcTemplate jdbc;
    private final EntityManager entityManager;

    public AdminModerationQueueRepository(NamedParameterJdbcTemplate jdbc, EntityManager entityManager) {
        this.jdbc = jdbc;
        this.entityManager = entityManager;
    }

    public Page<AdminModerationQueueItem> findQueue(String type, String query, Pageable pageable) {
        // JDBC shares the JPA transaction but does not trigger JPA's automatic flush.
        // Include any moderation changes made earlier in that same transaction.
        entityManager.flush();
        var parameters = new MapSqlParameterSource()
                .addValue("type", type, Types.VARCHAR)
                .addValue("query", query, Types.VARCHAR)
                .addValue("limit", pageable.getPageSize())
                .addValue("offset", pageable.getOffset());
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM (" + CANDIDATES + ") queue_items", parameters, Long.class);
        var items = jdbc.query("SELECT * FROM (" + CANDIDATES + ") queue_items "
                        + "ORDER BY created_at, item_type, id LIMIT :limit OFFSET :offset", parameters,
                (row, index) -> new AdminModerationQueueItem(
                        row.getString("item_type"), row.getLong("id"),
                        row.getObject("parent_id", Long.class), row.getObject("movie_id", Long.class),
                        row.getString("subject"), row.getLong("user_id"), row.getString("username"),
                        row.getString("content"), row.getTimestamp("created_at").toInstant()));
        return new PageImpl<>(items, pageable, total == null ? 0L : total);
    }
}
