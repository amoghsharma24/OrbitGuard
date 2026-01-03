package com.orbital.backend.service;

import com.orbital.backend.model.Satellite;
import com.orbital.backend.repository.SatelliteRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class TleService {

    private final SatelliteRepository repository;
    private final RestTemplate restTemplate;

    // We start with just Space Stations (ISS) to keep it fast
    private final String CELESTRAK_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle";

    public TleService(SatelliteRepository repository) {
        this.repository = repository;
        this.restTemplate = new RestTemplate();
    }

    public void fetchAndSaveTles() {
        System.out.println("⏳ Connecting to CelesTrak...");
        String rawData = restTemplate.getForObject(CELESTRAK_URL, String.class);

        if (rawData == null) return;

        String[] lines = rawData.split("\\r?\\n");
        int count = 0;

        // TLEs come in groups of 3 lines so it should find it as Name, Line 1, Line 2
        for (int i = 0; i < lines.length; i += 3) {
            if (i + 2 >= lines.length) break;

            String name = lines[i].trim();
            String l1 = lines[i+1].trim();
            String l2 = lines[i+2].trim();

            // Prevents duplicates
            if (!repository.existsByName(name)) {
                Satellite sat = new Satellite();
                sat.setName(name);
                sat.setLine1(l1);
                sat.setLine2(l2);
                repository.save(sat);
                count++;
            }
        }
        System.out.println("Database updated! Added " + count + " new satellites.");
    }
}