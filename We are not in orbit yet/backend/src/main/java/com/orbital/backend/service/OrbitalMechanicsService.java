package com.orbital.backend.service;

import com.orbital.backend.model.Satellite;
import org.hipparchus.geometry.euclidean.threed.Vector3D;
import org.orekit.bodies.BodyShape;
import org.orekit.bodies.GeodeticPoint;
import org.orekit.bodies.OneAxisEllipsoid;
import org.orekit.frames.Frame;
import org.orekit.frames.FramesFactory;
import org.orekit.propagation.analytical.tle.TLE;
import org.orekit.propagation.analytical.tle.TLEPropagator;
import org.orekit.time.AbsoluteDate;
import org.orekit.utils.Constants;
import org.orekit.utils.IERSConventions;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class OrbitalMechanicsService {

    // Calculating position for RIGHT NOW
    public Map<String, Object> getSatellitePosition(Satellite sat) {
        try {
            // Converting DB String to Orekit TLE object
            TLE tle = new TLE(sat.getLine1(), sat.getLine2());

            // Setting up the math engine
            TLEPropagator propagator = TLEPropagator.selectExtrapolator(tle);

            // Getting current time (UTC)
            AbsoluteDate currentDate = new AbsoluteDate();

            // Calculating 3D Position
            Vector3D position = propagator.getPVCoordinates(currentDate).getPosition();

            // Converting to Latitude/Longitude
            Frame earthFrame = FramesFactory.getITRF(IERSConventions.IERS_2010, true);
            BodyShape earth = new OneAxisEllipsoid(Constants.WGS84_EARTH_EQUATORIAL_RADIUS,
                    Constants.WGS84_EARTH_FLATTENING,
                    earthFrame);

            GeodeticPoint point = earth.transform(position, FramesFactory.getEME2000(), currentDate);

            // Packing into a Map for JSON
            Map<String, Object> data = new HashMap<>();
            data.put("id", sat.getId());
            data.put("name", sat.getName());
            data.put("latitude", Math.toDegrees(point.getLatitude()));
            data.put("longitude", Math.toDegrees(point.getLongitude()));
            data.put("altitude", point.getAltitude() / 1000.0); // Converting meters to km

            return data;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}