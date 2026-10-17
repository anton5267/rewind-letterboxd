package com.rewind.rewind.newsletter.service;

import com.rewind.rewind.newsletter.entity.NewsletterDeliveryStatus;
import com.rewind.rewind.newsletter.repo.NewsletterDeliveryRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class NewsletterDeliveryWorker {
    private static final Logger log = LoggerFactory.getLogger(NewsletterDeliveryWorker.class);
    private final NewsletterDeliveryRepository deliveries;
    private final NewsletterDeliveryProcessor processor;
    private final JavaMailSender mail;
    private final int batchSize;
    private final int maxAttempts;

    public NewsletterDeliveryWorker(NewsletterDeliveryRepository deliveries,
                                    NewsletterDeliveryProcessor processor,
                                    JavaMailSender mail,
                                    @Value("${app.newsletter.delivery-batch-size:50}") int batchSize,
                                    @Value("${app.newsletter.max-attempts:5}") int maxAttempts) {
        this.deliveries = deliveries;
        this.processor = processor;
        this.mail = mail;
        this.batchSize = Math.max(1, Math.min(batchSize, 500));
        this.maxAttempts = Math.max(1, Math.min(maxAttempts, 20));
    }

    @Scheduled(fixedDelayString = "${app.newsletter.delivery-interval-ms:30000}")
    public void scheduledDelivery() { processPending(); }

    public int processPending() {
        List<Long> ids = deliveries.findReadyIds(NewsletterDeliveryStatus.PENDING,
                NewsletterDeliveryStatus.FAILED, maxAttempts, PageRequest.of(0, batchSize));
        int processed = 0;
        for (Long id : ids) {
            if (processOne(id)) processed++;
        }
        return processed;
    }

    public boolean processOne(Long id) {
        var message = processor.claim(id);
        if (message.isEmpty()) return true;
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setTo(message.get().recipient());
            mailMessage.setSubject(message.get().subject());
            mailMessage.setText(message.get().body());
            mail.send(mailMessage);
            processor.markSent(message.get().id());
        } catch (MailException exception) {
            processor.markFailed(message.get().id(), exception);
            log.warn("Newsletter delivery {} failed", message.get().id(), exception);
        }
        return true;
    }
}
