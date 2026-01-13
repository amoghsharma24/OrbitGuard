package com.orbital.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hipparchus.geometry.euclidean.threed.Vector3D;
import org.orekit.bodies.BodyShape;
import org.orekit.bodies.GeodeticPoint;
import org.orekit.bodies.OneAxisEllipsoid;
import org.orekit.frames.Frame;
import org.orekit.frames.FramesFactory;
import org.orekit.propagation.analytical.tle.TLE;
import org.orekit.propagation.analytical.tle.TLEPropagator;
import org.orekit.time.AbsoluteDate;
import org.orekit.time.TimeScalesFactory;
import org.orekit.utils.Constants;
import org.orekit.utils.IERSConventions;
import org.springframework.stereotype.Service;

import com.orbital.backend.model.Satellite;

@Service
public class OrbitalMechanicsService {

    // Calculating position for right now
    public Map<String, Object> getSatellitePosition(Satellite sat) {
        try {
            // Converting DB String to Orekit TLE object
            TLE tle = new TLE(sat.getLine1(), sat.getLine2());

            // Setting up the math engine
            TLEPropagator propagator = TLEPropagator.selectExtrapolator(tle);

            // Getting current time (UTC) using proper Orekit constructor
            AbsoluteDate currentDate = new AbsoluteDate(new java.util.Date(), TimeScalesFactory.getUTC());

            // Calculating 3D Position
            Vector3D position = propagator.getPVCoordinates(currentDate).getPosition();

            // Converting to Latitude/Longitude
            Frame earthFrame = FramesFactory.getITRF(IERSConventions.IERS_2010, true);
            BodyShape earth = new OneAxisEllipsoid(Constants.WGS84_EARTH_EQUATORIAL_RADIUS,
                    Constants.WGS84_EARTH_FLATTENING,
                    earthFrame);

            GeodeticPoint point = earth.transform(position, FramesFactory.getEME2000(), currentDate);

            // Packing into a Map for JSON
            // Calculate a very simple instantaneous velocity estimate (m/s)
            AbsoluteDate futureDate = currentDate.shiftedBy(1.0);
            Vector3D futurePosition = propagator.getPVCoordinates(futureDate).getPosition();
            double velocity_m_s = position.distance(futurePosition);

            Map<String, Object> data = new HashMap<>();
            data.put("id", sat.getId());
            data.put("name", sat.getName());
            data.put("latitude", Math.toDegrees(point.getLatitude()));
            data.put("longitude", Math.toDegrees(point.getLongitude()));
            data.put("altitude", point.getAltitude() / 1000.0);
            data.put("velocity_km_s", velocity_m_s / 1000.0);

            return data;

        } catch (Exception e) {
            System.err.println("Error calculating satellite position for: " + sat.getName());
            System.err.println("Error details: " + e.getMessage());
            return null;
        }
    }

    // Temporal Propagation: Predicting position at future timestamp
    public Map<String, Object> getFuturePosition(Satellite sat, double secondsFromNow) {
        try {
            TLE tle = new TLE(sat.getLine1(), sat.getLine2());
            TLEPropagator propagator = TLEPropagator.selectExtrapolator(tle);

            // Current time + offset
            AbsoluteDate currentDate = new AbsoluteDate(new java.util.Date(), TimeScalesFactory.getUTC());
            AbsoluteDate futureDate = currentDate.shiftedBy(secondsFromNow);

            // Calculate position at future timestamp
            Vector3D position = propagator.getPVCoordinates(futureDate).getPosition();

            // Convert to lat/lon/alt
            Frame earthFrame = FramesFactory.getITRF(IERSConventions.IERS_2010, true);
            BodyShape earth = new OneAxisEllipsoid(Constants.WGS84_EARTH_EQUATORIAL_RADIUS,
                    Constants.WGS84_EARTH_FLATTENING, earthFrame);
            GeodeticPoint point = earth.transform(position, FramesFactory.getEME2000(), futureDate);

            Map<String, Object> data = new HashMap<>();
            data.put("name", sat.getName());
            data.put("latitude", Math.toDegrees(point.getLatitude()));
            data.put("longitude", Math.toDegrees(point.getLongitude()));
            data.put("altitude", point.getAltitude() / 1000.0);
            data.put("timestamp", futureDate.toString());
            data.put("position", position);

            return data;
        } catch (Exception e) {
            return null;
        }
    }

    // Compute an orbit trace (100 sample points across one period)
    public List<Map<String, Double>> getOrbitPath(Satellite sat) {
        List<Map<String, Double>> path = new ArrayList<>();
        try {
            TLE tle = new TLE(sat.getLine1(), sat.getLine2());

            // Mean motion is given in revolutions per day in typical TLE fields
            double meanMotion = tle.getMeanMotion();
            if (meanMotion <= 0) meanMotion = 15.0; // fallback (approx)

            double periodSeconds = 86400.0 / meanMotion; // seconds per orbit
            int steps = 100;
            double stepSeconds = periodSeconds / steps;

            for (int i = 0; i < steps; i++) {
                double secondsFromNow = i * stepSeconds;
                Map<String, Object> pos = getFuturePosition(sat, secondsFromNow);
                if (pos != null) {
                    Object latObj = pos.get("latitude");
                    Object lonObj = pos.get("longitude");
                    Object altObj = pos.get("altitude");
                    if (latObj instanceof Double && lonObj instanceof Double && altObj instanceof Double) {
                        Map<String, Double> point = new HashMap<>();
                        point.put("latitude", (Double) latObj);
                        point.put("longitude", (Double) lonObj);
                        point.put("altitude", (Double) altObj);
                        path.add(point);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to generate orbit path for: " + sat.getName());
        }

        return path;
    }
}