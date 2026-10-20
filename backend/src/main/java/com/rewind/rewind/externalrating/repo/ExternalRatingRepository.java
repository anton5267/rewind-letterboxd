package com.rewind.rewind.externalrating.repo;

import com.rewind.rewind.externalrating.entity.ExternalRating;
import com.rewind.rewind.externalrating.entity.ExternalRatingSource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExternalRatingRepository extends JpaRepository<ExternalRating, Long> {
    List<ExternalRating> findByMovieId(Long movieId);
    Optional<ExternalRating> findByMovieIdAndSource(Long movieId, ExternalRatingSource source);
}
