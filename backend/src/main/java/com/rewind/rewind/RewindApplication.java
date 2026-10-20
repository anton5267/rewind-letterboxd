package com.rewind.rewind;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RewindApplication {

    public static void main(String[] args) {
        SpringApplication.run(RewindApplication.class, args);
    }

}
