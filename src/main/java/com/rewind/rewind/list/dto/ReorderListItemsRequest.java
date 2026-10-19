package com.rewind.rewind.list.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public class ReorderListItemsRequest {

    @NotEmpty
    @Size(max = 10000)
    private List<@NotNull @Positive Long> orderedItemIds;

    public List<Long> getOrderedItemIds() { return orderedItemIds; }
    public void setOrderedItemIds(List<Long> orderedItemIds) { this.orderedItemIds = orderedItemIds; }
}
