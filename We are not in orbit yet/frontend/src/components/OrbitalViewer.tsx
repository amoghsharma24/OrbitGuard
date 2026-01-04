import React, { useState, useEffect, useRef } from "react";
import Globe from "react-globe.gl";

const GlobeComponent = Globe as unknown as React.ComponentType<any>;

interface Props {
  token: string;
}

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

const OrbitalViewer: React.FC<Props> = ({ token }) => {
  const globeEl = useRef<any>(null);
  const [satellites, setSatellites] = useState<ProcessedSatellite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        console.log("🔭 Fetching Satellites...");

        const res = await fetch("http://localhost:8080/api/satellites", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Auth Failed: ${res.status}`);
        }

        const data: Satellite[] = await res.json();
        console.log(`✅ Loaded ${data.length} satellites:`, data);

        if (data.length === 0) {
          setError(
            "No satellites found. Click 'SYNC DATA' to download satellite data."
          );
          setSatellites([]);
          return;
        }

        const processedData = data.map((sat) => ({
          name: sat.name,
          lat: sat.latitude,
          lng: sat.longitude,
          alt: 0.001, // Flat on Earth surface to see positions
          color: sat.name.toUpperCase().includes("ISS") ? "#00ffff" : "#ff0055",
        }));

        console.log("Processed satellites:", processedData);
        setSatellites(processedData);
      } catch (err: any) {
        console.error("❌ Satellite fetch error:", err);
        setError(err.message || "Failed to load satellites");
      } finally {
        setLoading(false);
      }
    };

    if (token) load();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      if (token) load();
    }, 30000);

    return () => clearInterval(interval);
  }, [token]);

  // Configure globe camera on mount
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 0, lng: 0, altitude: 2.5 });
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  const handleSatelliteClick = (sat: ProcessedSatellite) => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: sat.lat, lng: sat.lng, altitude: 1.5 }, 1000);
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {loading && (
        <div style={loadingOverlayStyle}>
          <div style={loadingTextStyle}>SCANNING ORBITAL SPACE...</div>
        </div>
      )}

      {error && !loading && (
        <div style={errorOverlayStyle}>
          <div style={errorTextStyle}>⚠ {error}</div>
        </div>
      )}

      <GlobeComponent
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        htmlElementsData={satellites}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude="alt"
        htmlElement={(d: any) => {
          const el = document.createElement("div");
          el.style.width = "8px";
          el.style.height = "8px";
          el.style.backgroundColor = d.color;
          el.style.borderRadius = "50%";
          el.style.pointerEvents = "auto";
          el.title = d.name;
          return el;
        }}
        
        atmosphereColor="#3a7ca5"
        atmosphereAltitude={0.15}
      />

      {/* Satellite count indicator */}
      {satellites.length > 0 && (
        <div style={counterStyle}>
          <div style={counterLabelStyle}>TRACKING</div>
          <div style={counterValueStyle}>{satellites.length}</div>
          <div style={counterLabelStyle}>OBJECTS</div>
        </div>
      )}

      {/* Satellite list */}
      {satellites.length > 0 && (
        <div style={satelliteListStyle}>
          <div style={listHeaderStyle}>SATELLITES</div>
          <div style={listContainerStyle}>
            {satellites.map((sat, idx) => (
              <div 
                key={idx} 
                style={listItemStyle}
                onClick={() => handleSatelliteClick(sat)}
              >
                <span style={{ ...dotStyle, backgroundColor: sat.color }} />
                <span style={satNameStyle}>{sat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const loadingOverlayStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 100,
};

const loadingTextStyle: React.CSSProperties = {
  color: "#00ffff",
  fontSize: "18px",
  fontFamily: "'Courier New', monospace",
  letterSpacing: "4px",
  animation: "pulse 1.5s ease-in-out infinite",
};

const errorOverlayStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "20px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 100,
};

const errorTextStyle: React.CSSProperties = {
  color: "#ff0055",
  fontSize: "14px",
  fontFamily: "'Courier New', monospace",
  letterSpacing: "2px",
  padding: "12px 24px",
  backgroundColor: "rgba(0, 0, 0, 0.9)",
  border: "1px solid rgba(255, 0, 85, 0.5)",
  borderRadius: "2px",
};

const counterStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "30px",
  right: "30px",
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  border: "1px solid rgba(0, 255, 255, 0.3)",
  padding: "12px 20px",
  borderRadius: "2px",
  textAlign: "center",
};

const counterLabelStyle: React.CSSProperties = {
  color: "#666",
  fontSize: "10px",
  fontFamily: "'Courier New', monospace",
  letterSpacing: "2px",
};

const counterValueStyle: React.CSSProperties = {
  color: "#00ffff",
  fontSize: "32px",
  fontFamily: "'Courier New', monospace",
  fontWeight: "bold",
  margin: "5px 0",
};

const satelliteListStyle: React.CSSProperties = {
  position: "absolute",
  top: "20px",
  right: "20px",
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  border: "1px solid rgba(0, 255, 255, 0.3)",
  borderRadius: "2px",
  padding: "10px",
  maxHeight: "calc(100vh - 200px)",
  overflowY: "auto",
  minWidth: "200px",
};

const listHeaderStyle: React.CSSProperties = {
  color: "#00ffff",
  fontSize: "10px",
  fontFamily: "'Courier New', monospace",
  letterSpacing: "2px",
  marginBottom: "10px",
  borderBottom: "1px solid rgba(0, 255, 255, 0.3)",
  paddingBottom: "5px",
};

const listContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const listItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  transition: "color 0.2s",
  fontSize: "10px",
  fontFamily: "'Courier New', monospace",
  color: "#aaa",
  padding: "3px 0",
};

const dotStyle: React.CSSProperties = {
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  flexShrink: 0,
};

const satNameStyle: React.CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export default OrbitalViewer;
