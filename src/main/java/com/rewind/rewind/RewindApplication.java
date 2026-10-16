package com.rewind.rewind;

import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class RewindApplication {

    public static void main(String[] args) {
        SpringApplication.run(RewindApplication.class, args);
    }

    @Bean
    CommandLineRunner testDb(UserRepository users) {
        return args -> {
            System.out.println("Users count = " + users.count());
        };
    }
}
