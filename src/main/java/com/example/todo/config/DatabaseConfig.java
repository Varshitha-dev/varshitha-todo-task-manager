package com.example.todo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;
import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
public class DatabaseConfig {
    @Bean
    public DataSource dataSource() throws Exception {
        // Ensure the parent folder exists before Spring runs schema.sql.
        Files.createDirectories(Path.of("data"));
        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setDriverClassName("org.sqlite.JDBC");
        ds.setUrl("jdbc:sqlite:./data/tasks.db");
        return ds;
    }
}
