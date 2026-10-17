package com.rewind.rewind.message.repo;

import com.rewind.rewind.message.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    Page<Message> findAllByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);
    Optional<Message> findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);
}
