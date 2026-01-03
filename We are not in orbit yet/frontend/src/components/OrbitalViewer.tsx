import React, { useState, useEffect, useRef } from "react";
import Globe from "react-globe.gl";

const GlobeComponent = Globe as unknown as React.ComponentType<any>;

type Satellite = {
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
};

type ProcessedSatellite = {
  name: string;
  lat: number;
  lng: number;
  alt: number;
  color: string;
};

const OrbitalViewer: React.FC = () => {
  const globeEl = useRef<unknown | null>(null);
  const [satellites, setSatellites] = useState<ProcessedSatellite[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/satellites");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Satellite[] = await res.json();

        console.log(`Loaded ${data.length} satellites for rendering.`);

        const processedData: ProcessedSatellite[] = data.map((sat) => ({
          name: sat.name,
          lat: sat.latitude,
          lng: sat.longitude,
          // keep altitude as a relative small value but we'll render as surface dot
          alt: Math.max((sat.altitude ?? 0) / 6371, 0.01),
          color: "#ff0000",
        }));

        if (
          processedData.length === 0 &&
          import.meta.env.MODE === "development"
        ) {
          // Development fallback so you can verify rendering without backend
          const fallback: ProcessedSatellite[] = [
            { name: "Test-1", lat: 0, lng: 0, alt: 0.02, color: "#00ff00" },
            {
              name: "Test-2",
              lat: 51.6,
              lng: -0.1,
              alt: 0.02,
              color: "#ff00ff",
            },
          ];
          console.info("No satellites returned; using fallback test points.");
          setSatellites(fallback);
        } else {
          setSatellites(processedData);
        }
        setFetchError(null);
      } catch (err: any) {
        console.error(err);
        setFetchError(err?.message ? String(err.message) : String(err));
      }
    };
    load();
  }, []);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <GlobeComponent
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        pointsData={satellites}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={0.01}
        pointLabel="name"
        pointColor={(d: ProcessedSatellite) =>
          selectedIndex !== null && satellites[selectedIndex]?.name === d.name
            ? "#ffff00"
            : "#ff0000"
        }
        pointRadius={0.5}
        atmosphereColor="#3a228a"
        atmosphereAltitude={0.25}
      />
      <div style={{ position: "absolute", top: 12, right: 12, width: 260 }}>
        <div
          style={{
            maxHeight: 320,
            overflowY: "auto",
            padding: 8,
            background: "rgba(0,0,0,0.55)",
            borderRadius: 8,
            color: "white",
            fontSize: 13,
          }}
        >
          <div style={{ marginBottom: 6, fontWeight: 600 }}>
            Satellites ({satellites.length})
          </div>
          {satellites.length === 0 && !fetchError && (
            <div style={{ opacity: 0.85 }}>Loading…</div>
          )}
          {satellites.map((s, i) => (
            <div
              key={s.name + i}
              onClick={() => {
                const globe: any = globeEl.current;
                if (globe && typeof globe.pointOfView === "function") {
                  try {
                    globe.pointOfView(
                      { lat: s.lat, lng: s.lng, altitude: 2 },
                      800
                    );
                  } catch (e) {
                    // ignore
                  }
                }
                setSelectedIndex(i);
              }}
              style={{
                padding: "6px 8px",
                borderRadius: 6,
                cursor: "pointer",
                background:
                  selectedIndex === i
                    ? "rgba(255,255,255,0.06)"
                    : "transparent",
                marginBottom: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13 }}>{s.name}</div>
                <div style={{ color: "#ff8080", fontSize: 12 }}>
                  {/* placeholder for status */}
                </div>
              </div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>
                {s.lat.toFixed(2)}, {s.lng.toFixed(2)}
              </div>
            </div>
          ))}
          {fetchError && (
            <div style={{ color: "#ff8080", marginTop: 8 }}>
              Error: {fetchError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrbitalViewer;
