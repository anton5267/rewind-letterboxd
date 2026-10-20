package com.rewind.rewind.social.controller;

import com.rewind.rewind.social.dto.BlockStatusResponse;
import com.rewind.rewind.social.service.BlockService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class BlockController {
    private final BlockService blocks;

    public BlockController(BlockService blocks) { this.blocks = blocks; }

    @GetMapping("/{id}/block-status")
    public BlockStatusResponse status(Authentication auth, @PathVariable Long id) {
        return blocks.status(auth.getName(), id);
    }

    @PostMapping("/{id}/block")
    public BlockStatusResponse block(Authentication auth, @PathVariable Long id) {
        return blocks.block(auth.getName(), id);
    }

    @DeleteMapping("/{id}/block")
    public BlockStatusResponse unblock(Authentication auth, @PathVariable Long id) {
        return blocks.unblock(auth.getName(), id);
    }
}
