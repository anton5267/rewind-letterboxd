package com.rewind.rewind.message.service;

import com.rewind.rewind.message.dto.*;
import com.rewind.rewind.message.entity.Conversation;
import com.rewind.rewind.message.entity.Message;
import com.rewind.rewind.message.repo.ConversationRepository;
import com.rewind.rewind.message.repo.MessageRepository;
import com.rewind.rewind.social.service.BlockService;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageService {
    private final ConversationRepository conversations;
    private final MessageRepository messages;
    private final UserRepository users;
    private final BlockService blocks;

    public MessageService(ConversationRepository conversations, MessageRepository messages, UserRepository users, BlockService blocks) {
        this.conversations = conversations;
        this.messages = messages;
        this.users = users;
        this.blocks = blocks;
    }

    @Transactional
    public ConversationResponse start(String email, Long targetUserId) {
        User current = users.findByEmail(email).orElseThrow();
        User target = users.findById(targetUserId)
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .orElseThrow();
        if (current.getId().equals(target.getId())) throw new IllegalArgumentException("You cannot message yourself");
        blocks.requireInteractionAllowed(current.getId(), target.getId());
        Long one = Math.min(current.getId(), target.getId());
        Long two = Math.max(current.getId(), target.getId());
        Conversation conversation = conversations.findByUserOneIdAndUserTwoId(one, two).orElseGet(() -> {
            Conversation created = new Conversation();
            created.setUserOneId(one);
            created.setUserTwoId(two);
            return conversations.save(created);
        });
        return response(conversation, current.getId());
    }

    @Transactional(readOnly = true)
    public Page<ConversationResponse> mine(String email, int page, int size) {
        User current = users.findByEmail(email).orElseThrow();
        return conversations.findVisibleByUserId(current.getId(), pageRequest(page, size))
                .map(conversation -> response(conversation, current.getId()));
    }

    @Transactional(readOnly = true)
    public long unreadCount(String email) {
        return messages.countUnreadForUser(users.findByEmail(email).orElseThrow().getId());
    }

    @Transactional(readOnly = true)
    public Page<MessageResponse> messages(String email, Long conversationId, int page, int size) {
        User current = users.findByEmail(email).orElseThrow();
        Conversation conversation = requireMember(conversationId, current.getId());
        blocks.requireInteractionAllowed(current.getId(), otherUserId(conversation, current.getId()));
        return messages.findAllByConversationIdOrderByCreatedAtDescIdDesc(conversationId, pageRequest(page, size)).map(this::messageResponse);
    }

    @Transactional
    public MessageResponse send(String email, Long conversationId, SendMessageRequest request) {
        User current = users.findByEmail(email).orElseThrow();
        Conversation conversation = requireMember(conversationId, current.getId());
        blocks.requireInteractionAllowed(current.getId(), otherUserId(conversation, current.getId()));
        Message message = new Message();
        message.setConversationId(conversation.getId());
        message.setSenderId(current.getId());
        message.setBody(request.body().trim());
        Message saved = messages.save(message);
        conversation.setUpdatedAt(java.time.Instant.now());
        conversations.save(conversation);
        return messageResponse(saved);
    }

    @Transactional
    public void markRead(String email, Long conversationId) {
        User current = users.findByEmail(email).orElseThrow();
        Conversation conversation = requireMember(conversationId, current.getId());
        blocks.requireInteractionAllowed(current.getId(), otherUserId(conversation, current.getId()));
        messages.markUnreadAsRead(conversationId, current.getId());
    }

    private Conversation requireMember(Long conversationId, Long userId) {
        Conversation conversation = conversations.findById(conversationId).orElseThrow();
        if (!userId.equals(conversation.getUserOneId()) && !userId.equals(conversation.getUserTwoId())) throw new IllegalArgumentException("Conversation not found");
        return conversation;
    }

    private Long otherUserId(Conversation conversation, Long currentUserId) {
        return currentUserId.equals(conversation.getUserOneId()) ? conversation.getUserTwoId() : conversation.getUserOneId();
    }

    private ConversationResponse response(Conversation conversation, Long currentUserId) {
        Long otherId = currentUserId.equals(conversation.getUserOneId()) ? conversation.getUserTwoId() : conversation.getUserOneId();
        User other = users.findById(otherId).orElseThrow();
        var last = messages.findTopByConversationIdOrderByCreatedAtDescIdDesc(conversation.getId()).map(message -> new ConversationResponse.MessageSummary(message.getId(), message.getSenderId(), message.getBody(), message.getCreatedAt(), message.getReadAt())).orElse(null);
        return new ConversationResponse(conversation.getId(), new ConversationResponse.PublicUser(other.getId(), other.getUsername(), other.getDisplayName(), other.getAvatarUrl()), conversation.getUpdatedAt(), last);
    }

    private MessageResponse messageResponse(Message message) { return new MessageResponse(message.getId(), message.getConversationId(), message.getSenderId(), message.getBody(), message.getCreatedAt(), message.getReadAt()); }
    private Pageable pageRequest(int page, int size) { return PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50))); }
}
