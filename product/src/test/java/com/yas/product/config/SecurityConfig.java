package com.yas.product.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.web.SecurityFilterChain;

@TestConfiguration
public class SecurityConfig {

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.ignoring()
                .requestMatchers(HttpMethod.POST, "/backoffice/**")
                .requestMatchers(HttpMethod.PUT, "/backoffice/**")
                .requestMatchers(HttpMethod.GET, "/backoffice/**");
    }
}
