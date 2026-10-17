package com.rewind.rewind.message.repo;

import com.rewind.rewind.message.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByUserOneIdAndUserTwoId(Long userOneId, Long userTwoId);
    Page<Conversation> findAllByUserOneIdOrUserTwoIdOrderByUpdatedAtDesc(Long userOneId, Long userTwoId, Pageable pageable);
}
