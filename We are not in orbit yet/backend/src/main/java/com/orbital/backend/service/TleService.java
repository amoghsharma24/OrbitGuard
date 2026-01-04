package com.orbital.backend.service;

import com.orbital.backend.model.Satellite;
import com.orbital.backend.repository.SatelliteRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class TleService {

    private final SatelliteRepository repository;
    private final RestTemplate restTemplate;

    // Fetch both stations and debris
    private final String STATIONS_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle";
    private final String DEBRIS_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=debris&FORMAT=tle";

    public TleService(SatelliteRepository repository) {
        this.repository = repository;
        this.restTemplate = new RestTemplate();
    }

    public void fetchAndSaveTles() {
        System.out.println("⏳ Connecting to CelesTrak...");
        
        int count = 0;
        
        // Fetch stations
        System.out.println("📡 Fetching active satellites/stations...");
        count += fetchFromUrl(STATIONS_URL);
        
        // Fetch debris
        System.out.println("💥 Fetching space debris...");
        count += fetchFromUrl(DEBRIS_URL);
        
        System.out.println("✅ Database updated! Added " + count + " new objects.");
    }
    
    private int fetchFromUrl(String url) {
        try {
            String rawData = restTemplate.getForObject(url, String.class);
            if (rawData == null) return 0;
            
            String[] lines = rawData.split("\\r?\\n");
            int count = 0;
            
            // TLEs come in groups of 3 lines: Name, Line 1, Line 2
            for (int i = 0; i < lines.length; i += 3) {
                if (i + 2 >= lines.length) break;
                
                String name = lines[i].trim();
                String l1 = lines[i+1].trim();
                String l2 = lines[i+2].trim();
                
                // Prevent duplicates
                if (!repository.existsByName(name)) {
                    Satellite sat = new Satellite();
                    sat.setName(name);
                    sat.setLine1(l1);
                    sat.setLine2(l2);
                    repository.save(sat);
                    count++;
                }
            }
            return count;
        } catch (Exception e) {
            System.err.println("Error fetching from " + url + ": " + e.getMessage());
            return 0;
        }
    }
}