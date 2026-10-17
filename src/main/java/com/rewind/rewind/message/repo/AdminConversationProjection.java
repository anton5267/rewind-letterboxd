package com.rewind.rewind.message.repo;

import java.time.Instant;

public interface AdminConversationProjection {
    Long getId();
    Long getUserOneId();
    Long getUserTwoId();
    long getMessageCount();
    Instant getCreatedAt();
    Instant getUpdatedAt();
    Instant getLastMessageAt();
}
