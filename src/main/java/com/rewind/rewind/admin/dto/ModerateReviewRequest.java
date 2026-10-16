package com.rewind.rewind.admin.dto;

import jakarta.validation.constraints.Size;

public class ModerateReviewRequest {

    @Size(max = 255)
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
