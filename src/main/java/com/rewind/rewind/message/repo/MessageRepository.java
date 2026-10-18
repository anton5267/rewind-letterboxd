package com.rewind.rewind.message.repo;

import com.rewind.rewind.message.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    Page<Message> findAllByConversationIdOrderByCreatedAtDescIdDesc(Long conversationId, Pageable pageable);
    Optional<Message> findTopByConversationIdOrderByCreatedAtDescIdDesc(Long conversationId);

    @Query("select count(m) from Message m, Conversation c where m.conversationId = c.id and (c.userOneId = :userId or c.userTwoId = :userId) and m.senderId <> :userId and m.readAt is null")
    long countUnreadForUser(Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Message m set m.readAt = CURRENT_TIMESTAMP where m.conversationId = :conversationId and m.senderId <> :readerId and m.readAt is null")
    int markUnreadAsRead(Long conversationId, Long readerId);
}
