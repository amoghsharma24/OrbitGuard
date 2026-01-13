package com.orbital.backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.orbital.backend.model.Satellite;
import com.orbital.backend.repository.SatelliteRepository;

@Service
public class TleService {

    private final SatelliteRepository repository;
    private final RestTemplate restTemplate;

    // Professional Space Situational Awareness URLs
    private final String ACTIVE_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle";
    private final String DEBRIS_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=debris&FORMAT=tle";

    public TleService(SatelliteRepository repository) {
        this.repository = repository;
        this.restTemplate = new RestTemplate();
    }

    public void fetchAndSaveTles() {
        System.out.println("COLLISION PREDICTION ENGINE: Starting ETL pipeline...");
        long startTime = System.currentTimeMillis();
        
        int activeCount = fetchFromUrl(ACTIVE_URL, "STATION");
        System.out.println("Active satellites: " + activeCount + " objects");
        
        int debrisCount = fetchFromUrl(DEBRIS_URL, "DEBRIS");
        System.out.println("Debris objects: " + debrisCount + " objects");
        
        long duration = (System.currentTimeMillis() - startTime) / 1000;
        System.out.println("Total tracking: " + repository.count() + " objects (completed in " + duration + "s)");
    }

    private int fetchFromUrl(String url, String type) {
        try {
            System.out.println("Fetching " + type + " data from CelesTrak...");
            String rawData = restTemplate.getForObject(url, String.class);
            if (rawData == null) return 0;

            String[] lines = rawData.split("\\r?\\n");
            List<Satellite> batch = new ArrayList<>();

            // Parse TLE data into batch
            for (int i = 0; i < lines.length; i += 3) {
                if (i + 2 >= lines.length) break;

                String name = lines[i].trim();
                String l1 = lines[i+1].trim();
                String l2 = lines[i+2].trim();

                // Check if satellite already exists
                Satellite existing = repository.findByName(name);
                if (existing != null) {
                    // Update existing record
                    existing.setLine1(l1);
                    existing.setLine2(l2);
                    existing.setType(type);
                    batch.add(existing);
                } else {
                    // Create new record
                    Satellite sat = new Satellite();
                    sat.setName(name);
                    sat.setLine1(l1);
                    sat.setLine2(l2);
                    sat.setType(type);
                    batch.add(sat);
                }
            }

            // Batch save (O(1) database call instead of O(n))
            if (!batch.isEmpty()) {
                repository.saveAll(batch);
                System.out.println("Batch saved " + batch.size() + " " + type + " objects");
            }

            return batch.size();
        } catch (Exception e) {
            System.err.println("Failed to fetch " + type + ": " + e.getMessage());
            return 0;
        }
    }
}