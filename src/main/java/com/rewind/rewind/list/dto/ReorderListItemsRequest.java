package com.rewind.rewind.list.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class ReorderListItemsRequest {

    @NotEmpty
    private List<Long> orderedItemIds;

    public List<Long> getOrderedItemIds() { return orderedItemIds; }
    public void setOrderedItemIds(List<Long> orderedItemIds) { this.orderedItemIds = orderedItemIds; }
}
