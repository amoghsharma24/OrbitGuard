package com.orbital.backend;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.orbital.backend.model.Satellite;
import com.orbital.backend.repository.SatelliteRepository;
import com.orbital.backend.service.CollisionDetectionService;
import com.orbital.backend.service.OrbitalMechanicsService;
import com.orbital.backend.service.TleService;

@RestController
@RequestMapping("/api")
public class SpaceController {

    private final TleService tleService;
    private final SatelliteRepository satelliteRepository;
    private final OrbitalMechanicsService mechanicsService;
    private final CollisionDetectionService collisionService;

    public SpaceController(TleService tleService, SatelliteRepository satelliteRepository,
                            OrbitalMechanicsService mechanicsService,
                            CollisionDetectionService collisionService)
    {
        this.tleService = tleService;
        this.satelliteRepository = satelliteRepository;
        this.mechanicsService = mechanicsService;
        this.collisionService = collisionService;
    }

    @GetMapping("/health")
    public String healthCheck() {
        long count = satelliteRepository.count();
        return "Systems online: Tracking " + count + " satellites.";
    }

    @GetMapping("/sync")
    public String syncData(){
        tleService.fetchAndSaveTles();
        return "Sync has been initiated. Check the console for more details.";
    }

    @GetMapping("/satellites")
    public List<Map<String, Object>> getSatellites() {
        List<Satellite> satellites = satelliteRepository.findAll();
        List<Map<String, Object>> livePositions = new ArrayList<>();

        for (Satellite sat : satellites) {
            Map<String, Object> pos = mechanicsService.getSatellitePosition(sat);
            if (pos != null) {
                pos.put("type", sat.getType()); // Add type to response
                livePositions.add(pos);
            }
        }
        return livePositions;
    }

    @GetMapping("/satellites/{id}/path")
    public List<Map<String, Double>> getSatellitePath(@PathVariable Long id) {
        Satellite sat = satelliteRepository.findById(id).orElse(null);
        if (sat == null) return new ArrayList<>();
        return mechanicsService.getOrbitPath(sat);
    }

    @GetMapping("/collision-check")
    public Map<String, Object> checkCollisions() {
        List<Map<String, Object>> threats = collisionService.checkISSCollisions();
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("threatCount", threats.size());
        response.put("threats", threats);
        response.put("alert", threats.size() > 0);
        return response;
    }

    // Professional Space Situational Awareness: 24-hour Conjunction Warnings
    @GetMapping("/warnings")
    public Map<String, Object> getConjunctionWarnings() {
        List<Map<String, Object>> warnings = collisionService.getIssConjunctions();
        
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("protectedAsset", "ISS (ZARYA)");
        response.put("predictionWindow", "24 hours");
        response.put("threshold", "50 km");
        response.put("warningCount", warnings.size());
        response.put("conjunctions", warnings);
        response.put("criticalAlert", warnings.size() > 0);
        
        return response;
    }

}