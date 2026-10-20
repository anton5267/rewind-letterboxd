package com.rewind.rewind.admin.dto;

import jakarta.validation.constraints.NotNull;

public record AdminHqRequest(@NotNull Boolean hq) {}
