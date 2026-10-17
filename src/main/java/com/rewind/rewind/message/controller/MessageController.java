package com.rewind.rewind.message.controller;

import com.rewind.rewind.message.dto.*;
import com.rewind.rewind.message.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/conversations")
public class MessageController {
    private final MessageService messages;
    public MessageController(MessageService messages) { this.messages = messages; }

    @GetMapping
    public Page<ConversationResponse> mine(Authentication auth, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) { return messages.mine(auth.getName(), page, size); }

    @PostMapping
    public ConversationResponse start(Authentication auth, @Valid @RequestBody CreateConversationRequest request) { return messages.start(auth.getName(), request.userId()); }

    @GetMapping("/{id}/messages")
    public Page<MessageResponse> messages(Authentication auth, @PathVariable Long id, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return messages.messages(auth.getName(), id, page, size); }

    @PostMapping("/{id}/messages")
    public MessageResponse send(Authentication auth, @PathVariable Long id, @Valid @RequestBody SendMessageRequest request) { return messages.send(auth.getName(), id, request); }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(Authentication auth, @PathVariable Long id) { messages.markRead(auth.getName(), id); return ResponseEntity.noContent().build(); }
}
