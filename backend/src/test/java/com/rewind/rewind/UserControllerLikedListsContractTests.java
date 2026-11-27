package com.rewind.rewind;

import com.rewind.rewind.list.dto.PublicListCardResponse;
import com.rewind.rewind.profile.service.ProfileService;
import com.rewind.rewind.user.controller.UserController;
import com.rewind.rewind.user.repo.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserControllerLikedListsContractTests {
    @Test
    void likedListsRouteReturnsSpringPageShapeAndPassesPagination() throws Exception {
        ProfileService profiles = mock(ProfileService.class);
        PublicListCardResponse card = new PublicListCardResponse(81L, "Liked collection", null, true,
                19L, "filmfan", null, List.of(), 12L, 5L, List.of());
        when(profiles.publicLikedLists(7L, 1, 12))
                .thenReturn(new PageImpl<>(List.of(card), PageRequest.of(1, 12), 13));
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new UserController(mock(UserRepository.class), profiles)).build();

        mvc.perform(get("/api/users/7/collections/liked-lists").param("page", "1").param("size", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(81))
                .andExpect(jsonPath("$.content[0].name").value("Liked collection"))
                .andExpect(jsonPath("$.content[0].ownerId").value(19))
                .andExpect(jsonPath("$.content[0].previewMovies").isArray())
                .andExpect(jsonPath("$.number").value(1))
                .andExpect(jsonPath("$.size").value(12))
                .andExpect(jsonPath("$.totalElements").value(13));

        verify(profiles).publicLikedLists(7L, 1, 12);
    }
}
