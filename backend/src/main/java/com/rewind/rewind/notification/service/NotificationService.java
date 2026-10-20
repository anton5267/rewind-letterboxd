package com.rewind.rewind.notification.service;

import com.rewind.rewind.notification.dto.NotificationResponse;
import com.rewind.rewind.notification.entity.Notification;
import com.rewind.rewind.notification.entity.NotificationType;
import com.rewind.rewind.notification.entity.NotificationPreference;
import com.rewind.rewind.notification.repo.NotificationRepository;
import com.rewind.rewind.notification.repo.NotificationPreferenceRepository;
import com.rewind.rewind.notification.dto.NotificationPreferencesResponse;
import com.rewind.rewind.notification.dto.UpdateNotificationPreferencesRequest;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.review.repo.ReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Service
public class NotificationService {
    private static final long SSE_TIMEOUT_MS = 30 * 60 * 1000L;
    private final NotificationRepository notifications;
    private final NotificationPreferenceRepository preferences;
    private final UserRepository users;
    private final ReviewRepository reviews;
    private final Map<Long, CopyOnWriteArraySet<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public NotificationService(NotificationRepository notifications, NotificationPreferenceRepository preferences,
                               UserRepository users, ReviewRepository reviews) {
        this.notifications = notifications;
        this.preferences = preferences;
        this.users = users;
        this.reviews = reviews;
    }

    @Transactional
    public void follow(User recipient, User actor) {
        if (recipient.getId().equals(actor.getId())) return;
        if (!preference(recipient.getId()).isFollowsEnabled()) return;
        Notification notification = new Notification();
        notification.setRecipientId(recipient.getId());
        notification.setActorId(actor.getId());
        notification.setRelatedUserId(actor.getId());
        notification.setType(NotificationType.FOLLOW);
        Notification saved = notifications.save(notification);
        publish(recipient.getId(), response(saved, actor));
    }

    @Transactional
    public void reviewLiked(Review review, User actor) {
        User recipient = review.getUser();
        if (recipient.getId().equals(actor.getId())) return;
        if (!preference(recipient.getId()).isReviewLikesEnabled()) return;
        Notification notification = new Notification();
        notification.setRecipientId(recipient.getId());
        notification.setActorId(actor.getId());
        notification.setReviewId(review.getId());
        notification.setType(NotificationType.REVIEW_LIKED);
        Notification saved = notifications.save(notification);
        publish(recipient.getId(), response(saved, actor));
    }

    @Transactional
    public NotificationResponse createAdmin(Long recipientId, NotificationType type, Long actorId, Long relatedUserId, Long reviewId) {
        User recipient = users.findById(recipientId).orElseThrow(() -> new IllegalArgumentException("Recipient not found"));
        User actor = actorId == null ? null : users.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Actor not found"));
        if (relatedUserId != null && !users.existsById(relatedUserId)) throw new IllegalArgumentException("Related user not found");
        if (reviewId != null && !reviews.existsById(reviewId)) throw new IllegalArgumentException("Review not found");
        Notification notification = new Notification();
        notification.setRecipientId(recipient.getId());
        notification.setActorId(actor == null ? null : actor.getId());
        notification.setRelatedUserId(relatedUserId);
        notification.setReviewId(reviewId);
        notification.setType(type);
        Notification saved = notifications.save(notification);
        NotificationResponse result = response(saved, actor);
        publish(recipient.getId(), result);
        return result;
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> mine(String email, int page, int size) {
        User user = users.findByEmail(email).orElseThrow();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)));
        return notifications.findAllByRecipientIdOrderByCreatedAtDescIdDesc(user.getId(), pageable).map(this::response);
    }

    @Transactional(readOnly = true)
    public long unreadCount(String email) {
        User user = users.findByEmail(email).orElseThrow();
        return notifications.countByRecipientIdAndReadAtIsNull(user.getId());
    }

    @Transactional
    public NotificationPreferencesResponse preferences(String email) {
        User user = users.findByEmail(email).orElseThrow();
        NotificationPreference preference = preference(user.getId());
        return new NotificationPreferencesResponse(preference.isFollowsEnabled(), preference.isReviewLikesEnabled());
    }

    @Transactional
    public NotificationPreferencesResponse updatePreferences(String email, UpdateNotificationPreferencesRequest request) {
        User user = users.findByEmail(email).orElseThrow();
        NotificationPreference preference = preference(user.getId());
        preference.setFollowsEnabled(request.followsEnabled());
        preference.setReviewLikesEnabled(request.reviewLikesEnabled());
        preferences.save(preference);
        return new NotificationPreferencesResponse(preference.isFollowsEnabled(), preference.isReviewLikesEnabled());
    }

    private NotificationPreference preference(Long userId) {
        return preferences.findById(userId).orElseGet(() -> {
            preferences.insertIgnore(userId);
            return preferences.findForUpdate(userId)
                    .orElseThrow(() -> new IllegalStateException("Notification preference was not persisted"));
        });
    }

    @Transactional
    public void markRead(String email, Long id) {
        User user = users.findByEmail(email).orElseThrow();
        Notification notification = notifications.findByIdAndRecipientId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (notification.getReadAt() == null) notification.setReadAt(Instant.now());
    }

    @Transactional
    public void markAllRead(String email) {
        User user = users.findByEmail(email).orElseThrow();
        notifications.markAllRead(user.getId(), Instant.now());
    }

    public SseEmitter subscribe(String email) {
        Long userId = users.findByEmail(email).orElseThrow().getId();
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        emitters.computeIfAbsent(userId, ignored -> new CopyOnWriteArraySet<>()).add(emitter);
        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> remove(userId, emitter));
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok", MediaType.TEXT_PLAIN));
        } catch (IOException exception) {
            remove(userId, emitter);
        }
        return emitter;
    }

    private void publish(Long recipientId, NotificationResponse response) {
        for (SseEmitter emitter : emitters.getOrDefault(recipientId, new CopyOnWriteArraySet<>())) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(response));
            } catch (IOException exception) {
                remove(recipientId, emitter);
            }
        }
    }

    private void remove(Long userId, SseEmitter emitter) {
        var userEmitters = emitters.get(userId);
        if (userEmitters == null) return;
        userEmitters.remove(emitter);
        if (userEmitters.isEmpty()) emitters.remove(userId, userEmitters);
    }

    private NotificationResponse response(Notification notification) {
        User actor = notification.getActorId() == null ? null : users.findById(notification.getActorId()).orElse(null);
        return response(notification, actor);
    }

    private NotificationResponse response(Notification notification, User actor) {
        User visibleActor = actor != null && Boolean.TRUE.equals(actor.getIsActive()) ? actor : null;
        return new NotificationResponse(notification.getId(), notification.getType(), notification.getCreatedAt(), notification.getReadAt(),
                visibleActor == null ? null : new NotificationResponse.Actor(visibleActor.getId(), visibleActor.getUsername(), visibleActor.getDisplayName(), visibleActor.getAvatarUrl()),
                notification.getRelatedUserId(), notification.getReviewId());
    }
}
