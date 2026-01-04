package com.orbital.backend;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.orbital.backend.model.Satellite;
import com.orbital.backend.repository.SatelliteRepository;
import com.orbital.backend.service.OrbitalMechanicsService;
import com.orbital.backend.service.TleService;

@RestController
@RequestMapping("/api")
public class SpaceController {

    private final TleService tleService;
    private final SatelliteRepository satelliteRepository;
    private final OrbitalMechanicsService mechanicsService;

    public SpaceController(TleService tleService, SatelliteRepository satelliteRepository,
                            OrbitalMechanicsService mechanicsService)
    {
        this.tleService = tleService;
        this.satelliteRepository = satelliteRepository;
        this.mechanicsService = mechanicsService;
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
                livePositions.add(pos);
            }
        }
        return livePositions;
    }

}