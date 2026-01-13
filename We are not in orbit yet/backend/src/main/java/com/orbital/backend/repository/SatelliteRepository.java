package com.orbital.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.orbital.backend.model.Satellite;

@Repository
public interface SatelliteRepository extends JpaRepository<Satellite, Long> {
    boolean existsByName(String name);
    Satellite findByName(String name);
}