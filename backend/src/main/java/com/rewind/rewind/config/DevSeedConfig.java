package com.rewind.rewind.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import javax.sql.DataSource;

@Configuration
@Profile("dev")
public class DevSeedConfig {

    @Bean
    CommandLineRunner seedDemoMovies(DataSource dataSource, JdbcTemplate jdbc) {
        return args -> {
            Long count = jdbc.queryForObject("SELECT COUNT(*) FROM movies", Long.class);
            if (count != null && count > 0) return;

            ResourceDatabasePopulator populator = new ResourceDatabasePopulator(
                    new ClassPathResource("seed_50_real.sql"));
            populator.execute(dataSource);
        };
    }
}
