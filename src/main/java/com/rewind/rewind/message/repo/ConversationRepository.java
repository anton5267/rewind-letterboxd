package com.rewind.rewind.message.repo;

import com.rewind.rewind.message.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByUserOneIdAndUserTwoId(Long userOneId, Long userTwoId);
    Page<Conversation> findAllByUserOneIdOrUserTwoIdOrderByUpdatedAtDesc(Long userOneId, Long userTwoId, Pageable pageable);

    @Query(value = "select c.id as id, c.userOneId as userOneId, c.userTwoId as userTwoId, count(m.id) as messageCount, c.createdAt as createdAt, c.updatedAt as updatedAt, max(m.createdAt) as lastMessageAt from Conversation c left join Message m on m.conversationId = c.id group by c.id, c.userOneId, c.userTwoId, c.createdAt, c.updatedAt order by c.updatedAt desc",
            countQuery = "select count(c) from Conversation c")
    Page<AdminConversationProjection> findAdminRows(Pageable pageable);
}
