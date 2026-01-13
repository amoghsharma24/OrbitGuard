package com.orbital.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hipparchus.geometry.euclidean.threed.Vector3D;
import org.orekit.propagation.analytical.tle.TLE;
import org.orekit.propagation.analytical.tle.TLEPropagator;
import org.orekit.time.AbsoluteDate;
import org.orekit.time.TimeScalesFactory;
import org.springframework.stereotype.Service;

import com.orbital.backend.model.Satellite;
import com.orbital.backend.repository.SatelliteRepository;

@Service
public class CollisionDetectionService {

    private final SatelliteRepository repository;
    private final OrbitalMechanicsService orbitalService;
    
    private static final double COLLISION_THRESHOLD_KM = 50.0;
    private static final int PREDICTION_HOURS = 24;
    private static final int INTERVAL_MINUTES = 10;

    public CollisionDetectionService(SatelliteRepository repository, OrbitalMechanicsService orbitalService) {
        this.repository = repository;
        this.orbitalService = orbitalService;
    }

    // Professional Conjunction Analysis: 24-hour temporal prediction
    public List<Map<String, Object>> getIssConjunctions() {
        List<Map<String, Object>> warnings = new ArrayList<>();
        
        try {
            System.out.println("Starting ISS conjunction analysis (24-hour window)...");
            long startTime = System.currentTimeMillis();

            // Finding ISS (Zarya module)
            Satellite iss = repository.findAll().stream()
                .filter(sat -> sat.getName().toUpperCase().contains("ISS") || 
                              sat.getName().toUpperCase().contains("ZARYA"))
                .findFirst()
                .orElse(null);

            if (iss == null) {
                System.out.println("ISS not found in database");
                return warnings;
            }

            // Fetching all debris and active satellites
            List<Satellite> allObjects = repository.findAll();
            System.out.println("Checking " + allObjects.size() + " objects against ISS trajectory...");

            // Time step: 10 minutes = 600 seconds
            int totalSteps = (PREDICTION_HOURS * 60) / INTERVAL_MINUTES; // 144 steps for 24 hours
            int intervalSeconds = INTERVAL_MINUTES * 60;

            // O(n) optimization: ISS vs Everything (not Everything vs Everything)
            for (int step = 0; step < totalSteps; step++) {
                double secondsFromNow = step * intervalSeconds;

                // Propagate ISS position to future timestamp
                Map<String, Object> issData = orbitalService.getFuturePosition(iss, secondsFromNow);
                if (issData == null) continue;

                Vector3D issPosition = (Vector3D) issData.get("position");
                String timestamp = (String) issData.get("timestamp");

                // Checking all objects at this timestamp
                for (Satellite obj : allObjects) {
                    // Skipping if it's the same physical satellite
                    if (obj.getId().equals(iss.getId())) continue;

                    Map<String, Object> objData = orbitalService.getFuturePosition(obj, secondsFromNow);
                    if (objData == null) continue;

                    Vector3D objPosition = (Vector3D) objData.get("position");
                    double distance = Vector3D.distance(issPosition, objPosition) / 1000.0; // km

                    // Filtering out zero distance and applying threshold
                    if (distance > 0.1 && distance <= COLLISION_THRESHOLD_KM) {
                        Map<String, Object> warning = new HashMap<>();
                        warning.put("object", obj.getName());
                        warning.put("type", obj.getType());
                        warning.put("distance", Math.round(distance * 100.0) / 100.0);
                        warning.put("timeOfApproach", timestamp);
                        warning.put("hoursFromNow", Math.round((secondsFromNow / 3600.0) * 10.0) / 10.0);
                        warnings.add(warning);
                    }
                }
            }

            long duration = System.currentTimeMillis() - startTime;
            System.out.println("Conjunction analysis complete: " + warnings.size() + 
                             " warnings found (" + duration + "ms)");

            if (!warnings.isEmpty()) {
                System.out.println("COLLISION WARNING: ISS has " + warnings.size() + 
                                 " close approaches within 50km over next 24h");
            }

        } catch (Exception e) {
            System.err.println("Error in conjunction analysis: " + e.getMessage());
            e.printStackTrace();
        }

        return warnings;
    }

    // Legacy method for real-time checks
    public List<Map<String, Object>> checkISSCollisions() {
        List<Map<String, Object>> threats = new ArrayList<>();
        
        try {
            Satellite iss = repository.findAll().stream()
                .filter(sat -> sat.getName().toUpperCase().contains("ISS"))
                .findFirst()
                .orElse(null);

            if (iss == null) return threats;

            Vector3D issPosition = getPosition(iss);
            if (issPosition == null) return threats;

            List<Satellite> allObjects = repository.findAll();
            AbsoluteDate currentDate = new AbsoluteDate(new java.util.Date(), TimeScalesFactory.getUTC());

            for (Satellite obj : allObjects) {
                // Skipping if it's the same physical satellite\n                
                // if (obj.getId().equals(iss.getId())) continue;


                Vector3D objPosition = getPosition(obj);
                if (objPosition == null) continue;

                double distance = Vector3D.distance(issPosition, objPosition) / 1000.0;

                // Filtering out zero distance and applying threshold
                if (distance > 0.1 && distance <= COLLISION_THRESHOLD_KM) {
                    Map<String, Object> threat = new HashMap<>();
                    threat.put("name", obj.getName());
                    threat.put("type", obj.getType());
                    threat.put("distance", Math.round(distance * 100.0) / 100.0);
                    threat.put("timestamp", currentDate.toString());
                    threats.add(threat);
                }
            }

        } catch (Exception e) {
            System.err.println("Error in collision detection: " + e.getMessage());
        }

        return threats;
    }

    private Vector3D getPosition(Satellite sat) {
        try {
            TLE tle = new TLE(sat.getLine1(), sat.getLine2());
            TLEPropagator propagator = TLEPropagator.selectExtrapolator(tle);
            AbsoluteDate currentDate = new AbsoluteDate(new java.util.Date(), TimeScalesFactory.getUTC());
            return propagator.getPVCoordinates(currentDate).getPosition();
        } catch (Exception e) {
            return null;
        }
    }
}
