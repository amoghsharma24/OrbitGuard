package com.orbital.backend.controller;

import com.orbital.backend.model.Role;
import com.orbital.backend.model.User;
import com.orbital.backend.repository.UserRepository;
import com.orbital.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // End point for registering
    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        // Creating the user object
        User user = new User();
        user.setEmail(request.email());
        // Encrypting the password before saving!
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);

        // Saving to DB
        userRepository.save(user);

        // Generating a token immediately
        String jwtToken = jwtService.generateToken(user);
        return new AuthResponse(jwtToken);
    }

    // login endpoint
    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email()).orElseThrow();
        String jwtToken = jwtService.generateToken(user);

        return new AuthResponse(jwtToken);
    }
}

record RegisterRequest(String email, String password) {}
record LoginRequest(String email, String password) {}
record AuthResponse(String token) {}