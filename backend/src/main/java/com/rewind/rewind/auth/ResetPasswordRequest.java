package com.rewind.rewind.auth;

import com.rewind.rewind.validation.MaxUtf8Bytes;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(@NotBlank String token, @NotBlank @Size(min = 8, max = 72) @MaxUtf8Bytes(72) String newPassword) {}
