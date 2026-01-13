import React, { useState, useEffect, useRef, useMemo } from "react";
import Globe from "react-globe.gl";
import WarningPanel from "./WarningPanel";

const GlobeComponent = Globe as unknown as React.ComponentType<any>;

// Eye icon component
const EyeIcon: React.FC<{ visible: boolean }> = ({ visible }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ opacity: visible ? 1 : 0.5 }}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
    {!visible && <line x1="1" y1="1" x2="23" y2="23" />}
  </svg>
);

type Warning = {
  object: string;
  type: string;
  distance: number;
  timeOfApproach: string;
  hoursFromNow: number;
};

interface Props {
  token: string;
  warnings: Warning[];
  onSelectSatellite?: (sat: any) => void;
  onClearSelection?: () => void;
}

type Satellite = {
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  type: string;
};

type ProcessedSatellite = {
  id?: number | string;
  name: string;
  lat: number;
  lng: number;
  alt: number;
  color: string;
  type: string;
  velocity_km_s?: number;
};

const OrbitalViewer: React.FC<Props> = ({
  token,
  warnings,
  onSelectSatellite,
}) => {
  const globeEl = useRef<any>(null);
  const [satellites, setSatellites] = useState<ProcessedSatellite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set([]));
  const [selectedPath, setSelectedPath] = useState<any[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<any | null>(null);
  const [isWarningPath, setIsWarningPath] = useState<boolean>(false);
  const [isIsolationMode, setIsIsolationMode] = useState<boolean>(false);
  // UI state for accordion, search, modal and debris toggle
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [showDebris, setShowDebris] = useState<boolean>(true);
  // default to showing all so the globe is never empty
  const [showAllSatellites, setShowAllSatellites] = useState<boolean>(true);

  // Creating O(1) lookup set for danger objects
  const dangerSet = useMemo(() => {
    return new Set(warnings.map((w) => w.object));
  }, [warnings]);

  // Hero satellites - always shown when showAllSatellites is false
  const heroSatelliteNames = useMemo(() => {
    return new Set([
      "ISS (ZARYA)",
      "HUBBLE SPACE TELESCOPE",
      "TIANGONG",
      "STARLINK-1007",
      "IRIDIUM 33 DEB", // Famous collision debris
      "COSMOS 2251 DEB", // Famous collision debris
      "FENGYUN 1C DEB", // Chinese ASAT test debris
    ]);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        console.log("Fetching satellites...");

        const res = await fetch("http://localhost:8080/api/satellites", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Authorisation failed: ${res.status}`);
        }

        const data: Satellite[] = await res.json();
        console.log(`Loaded ${data.length} satellites`);

        if (data.length === 0) {
          setError(
            "No satellites found. Click 'SYNC DATA' to download satellite data."
          );
          setSatellites([]);
          return;
        }

        // Processing satellite positions with colour coding
        const EARTH_RADIUS_KM = 6371;
        const processedData = data.map((sat: any) => {
          // Handle altitude in both meters and kilometers
          // If altitude > 1000, assume it's in meters; otherwise assume kilometers
          const altitudeKm =
            sat.altitude > 1000 ? sat.altitude / 1000 : sat.altitude;
          // Normalize altitude as fraction of Earth radius (like official demo)
          const normalizedAlt = altitudeKm / EARTH_RADIUS_KM;

          return {
            id: sat.id,
            name: sat.name,
            lat: sat.latitude,
            lng: sat.longitude,
            alt: normalizedAlt,
            type: sat.type || "UNKNOWN",
            velocity_km_s: sat.velocity_km_s || 0,
            color: dangerSet.has(sat.name) ? "#FF0000" : "#00FFFF",
          };
        });

        // Logging first satellite for debugging
        if (processedData.length > 0) {
          console.log("Sample satellite data:", processedData[0]);
        }
        console.log("Processed satellites:", processedData.length);
        setSatellites(processedData);
      } catch (err: any) {
        console.error("Satellite fetch error:", err);
        setError(err.message || "Failed to load satellites");
      } finally {
        setLoading(false);
      }
    };

    if (token) load();

    // Refreshing every 30 seconds
    const interval = setInterval(() => {
      if (token) load();
    }, 30000);

    return () => clearInterval(interval);
  }, [token, dangerSet]);

  // Configuring globe camera on mount
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 0, lng: 0, altitude: 2.5 });
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  // Grouping satellites by organisation
  const groupSatellites = (sats: ProcessedSatellite[]) => {
    const groups: { [key: string]: ProcessedSatellite[] } = {
      SPACEX: [],
      NASA: [],
      ESA: [],
      CHINA: [],
      RUSSIA: [],
      ISS: [],
      OTHER: [],
    };

    sats.forEach((sat) => {
      const name = sat.name.toUpperCase();
      if (name.includes("STARLINK") || name.includes("SPACEX")) {
        groups["SPACEX"].push(sat);
      } else if (name.includes("ISS") || name.includes("ZARYA")) {
        groups["ISS"].push(sat);
      } else if (
        name.includes("NASA") ||
        name.includes("TDRSS") ||
        name.includes("GOES")
      ) {
        groups["NASA"].push(sat);
      } else if (
        name.includes("ESA") ||
        name.includes("EUTELSAT") ||
        name.includes("GALILEO")
      ) {
        groups["ESA"].push(sat);
      } else if (
        name.includes("CZ-") ||
        name.includes("TIANHE") ||
        name.includes("CHINASAT")
      ) {
        groups["CHINA"].push(sat);
      } else if (
        name.includes("COSMOS") ||
        name.includes("MOLNIYA") ||
        name.includes("PROGRESS")
      ) {
        groups["RUSSIA"].push(sat);
      } else {
        groups["OTHER"].push(sat);
      }
    });

    return groups;
  };

  const satelliteGroups = useMemo(
    () => groupSatellites(satellites),
    [satellites]
  );

  // Filtering satellites based on visible groups, search and debris toggle
  const displayedSatellites = useMemo(() => {
    // start with a copy
    let base = satellites.slice();
    // ISOLATION MODE: If a satellite is selected, only show that one
    if (isIsolationMode && selectedSatellite) {
      return [selectedSatellite];
    }

    // HYBRID FILTER: If showAllSatellites is OFF, only show warned + hero satellites
    if (!showAllSatellites) {
      base = base.filter((sat) => {
        // Show if it has a warning
        if (dangerSet.has(sat.name)) return true;
        // Show if it's a hero satellite
        if (heroSatelliteNames.has(sat.name)) return true;
        // Also check partial matches for hero satellites (ISS, HUBBLE, etc.)
        const name = sat.name.toUpperCase();
        if (name.includes("ISS") || name.includes("ZARYA")) return true;
        if (name.includes("HUBBLE")) return true;
        if (name.includes("TIANGONG")) return true;
        return false;
      });
    }

    // apply group visibility filter (if none selected, show all)
    if (visibleGroups.size > 0) {
      base = base.filter((sat) => {
        const name = sat.name.toUpperCase();
        for (const group of visibleGroups) {
          if (
            group === "SPACEX" &&
            (name.includes("STARLINK") || name.includes("SPACEX"))
          )
            return true;
          if (
            group === "ISS" &&
            (name.includes("ISS") || name.includes("ZARYA"))
          )
            return true;
          if (
            group === "NASA" &&
            (name.includes("NASA") ||
              name.includes("TDRSS") ||
              name.includes("GOES"))
          )
            return true;
          if (
            group === "ESA" &&
            (name.includes("ESA") ||
              name.includes("EUTELSAT") ||
              name.includes("GALILEO"))
          )
            return true;
          if (
            group === "CHINA" &&
            (name.includes("CZ-") ||
              name.includes("TIANHE") ||
              name.includes("CHINASAT"))
          )
            return true;
          if (
            group === "RUSSIA" &&
            (name.includes("COSMOS") ||
              name.includes("MOLNIYA") ||
              name.includes("PROGRESS"))
          )
            return true;
          if (
            group === "OTHER" &&
            !name.includes("STARLINK") &&
            !name.includes("SPACEX") &&
            !name.includes("ISS") &&
            !name.includes("ZARYA") &&
            !name.includes("NASA") &&
            !name.includes("TDRSS") &&
            !name.includes("GOES") &&
            !name.includes("ESA") &&
            !name.includes("EUTELSAT") &&
            !name.includes("GALILEO") &&
            !name.includes("CZ-") &&
            !name.includes("TIANHE") &&
            !name.includes("CHINASAT") &&
            !name.includes("COSMOS") &&
            !name.includes("MOLNIYA") &&
            !name.includes("PROGRESS")
          )
            return true;
        }
        return false;
      });
    }

    // apply debounced search filter across names
    if (debouncedSearch && debouncedSearch.trim().length > 0) {
      const q = debouncedSearch.trim().toUpperCase();
      base = base.filter((s) => s.name.toUpperCase().includes(q));
    }

    // filter out debris if user toggled it off
    if (!showDebris) {
      base = base.filter((s) => !(s.type && s.type.toUpperCase() === "DEBRIS"));
    }

    return base;
  }, [
    satellites,
    visibleGroups,
    debouncedSearch,
    showDebris,
    showAllSatellites,
    dangerSet,
    heroSatelliteNames,
    isIsolationMode,
    selectedSatellite,
  ]);

  // Debounce search input to avoid lag on large arrays
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSatelliteClick = async (sat: ProcessedSatellite) => {
    try {
      // use local vars to avoid stale state
      const warning = dangerSet.has(sat.name);
      setSelectedSatellite(sat);
      setIsWarningPath(warning);
      setIsIsolationMode(true);

      if (globeEl.current) {
        globeEl.current.pointOfView(
          { lat: sat.lat, lng: sat.lng, altitude: 1.5 },
          1000
        );
      }

      if (typeof onSelectSatellite === "function") onSelectSatellite(sat);

      const res = await fetch(
        `http://localhost:8080/api/satellites/${sat.id}/path?hours=24`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        console.error("Failed to fetch path:", res.status);
        setSelectedPath([]);
        return;
      }
      const data = await res.json();
      const EARTH_RADIUS_KM = 6371;
      const formattedPath = [
        {
          name: sat.name ?? `sat-${sat.id}`,
          coords: data.map((p: any) => {
            const altitudeKm =
              p.altitude > 1000 ? p.altitude / 1000 : p.altitude;
            return {
              lat: p.latitude,
              lng: p.longitude,
              alt: altitudeKm / EARTH_RADIUS_KM,
            };
          }),
          color: warning ? "#ff0000" : "#00ffff",
        },
      ];
      setSelectedPath(formattedPath);
    } catch (err) {
      console.error("Failed to fetch path", err);
      setSelectedPath([]);
    }
  };

  const handlePointClick = async (d: any) => {
    // delegate to handleSatelliteClick to unify behavior
    await handleSatelliteClick(d);
  };

  const clearSelection = () => {
    setSelectedPath([]);
    setSelectedSatellite(null);
    setIsWarningPath(false);
    setIsIsolationMode(false);
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 800);
    }
  };

  const handleWarningClick = async (warningName: string) => {
    // Find the satellite by name
    const sat = satellites.find((s) => s.name === warningName);
    if (!sat) {
      console.warn("Warning satellite not found:", warningName);
      return;
    }

    // Zoom to satellite
    if (globeEl.current) {
      globeEl.current.pointOfView(
        { lat: sat.lat, lng: sat.lng, altitude: 1.2 },
        1000
      );
    }

    setSelectedSatellite(sat);
    setIsWarningPath(true); // always red for warnings
    setIsIsolationMode(true);

    // Notify parent
    if (typeof onSelectSatellite === "function") onSelectSatellite(sat);

    // Fetch orbit path
    try {
      const res = await fetch(
        `http://localhost:8080/api/satellites/${sat.id}/path?hours=24`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const EARTH_RADIUS_KM = 6371;
        const formattedPath = [
          {
            name: sat.name ?? `sat-${sat.id}`,
            coords: data.map((p: any) => {
              const altitudeKm =
                p.altitude > 1000 ? p.altitude / 1000 : p.altitude;
              return {
                lat: p.latitude,
                lng: p.longitude,
                alt: altitudeKm / EARTH_RADIUS_KM,
              };
            }),
            color: "#ff0000", // red for warnings
          },
        ];
        setSelectedPath(formattedPath);
      } else {
        setSelectedPath([]);
      }
    } catch (err) {
      console.error("Failed to fetch path for warning:", err);
      setSelectedPath([]);
    }
  };

  // Listen for global clearSelection event
  useEffect(() => {
    const handler = () => {
      setSelectedPath([]);
      setSelectedSatellite(null);
      setIsWarningPath(false);
      setIsIsolationMode(false);
      if (globeEl.current) {
        globeEl.current.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 800);
      }
    };
    window.addEventListener("clearSelection", handler);
    return () => window.removeEventListener("clearSelection", handler);
  }, []);

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

      {/* Collision Alert - replaced by WarningPanel */}
      {/* 
      {console.log("=== GLOBE RENDER ===")}
      {console.log("selectedPath:", selectedPath)}
      {console.log("selectedPath length:", selectedPath?.length)}
      {console.log("pathsData will be:", selectedPath ? [{ path: selectedPath }] : [])}
      {console.log("isWarningPath:", isWarningPath)} */}

      <GlobeComponent
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        particlesData={[displayedSatellites]} // ✅ FIX
        particleLabel="name"
        particleLat="lat"
        particleLng="lng"
        particleAltitude="alt"
        particlesColor={(d: any) => d.color}
        onParticleClick={handlePointClick}
        ringsData={selectedSatellite ? [selectedSatellite] : []}
        ringLat="lat"
        ringLng="lng"
        ringMaxRadius={3}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1500}
        ringColor={() => (isWarningPath ? "#ff0000" : "#00ffff")}
        pathsData={selectedPath || []}
        pathPoints="coords"
        pathPointLat="lat"
        pathPointLng="lng"
        pathPointAlt="alt"
        pathColor={(d: any) => d.color}
        pathStroke={2}
        pathDashLength={0.5}
        pathDashGap={0.1}
        pathDashAnimateTime={3000}
        pathResolution={4}
        pathTransitionDuration={0}
        showAtmosphere={true}
        atmosphereColor="#3a7ca5"
        atmosphereAltitude={0.15}
      />

      {/* Satellite list */}
      {satellites.length > 0 && (
        <div style={satelliteListStyle}>
          <div style={listHeaderStyle}>SATELLITES</div>

          {isIsolationMode && selectedSatellite && (
            <div
              style={{
                marginBottom: 12,
                padding: 8,
                backgroundColor: "rgba(0, 255, 255, 0.1)",
                borderRadius: 4,
                borderLeft: "3px solid #00ffff",
              }}
            >
              <div style={{ fontSize: 11, color: "#00ffff", marginBottom: 6 }}>
                TRACKING: {selectedSatellite.name}
              </div>
              <button
                onClick={clearSelection}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  backgroundColor: "rgba(255, 0, 0, 0.2)",
                  color: "#ff0000",
                  border: "1px solid #ff0000",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: "bold",
                }}
              >
                CLEAR SELECTION
              </button>
            </div>
          )}

          {/* Quick Search */}
          <div style={{ marginBottom: 8 }}>
            <input
              placeholder="Quick Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: 4,
                border: "1px solid rgba(0,255,255,0.12)",
                background: "transparent",
                color: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Legend / Controls */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <div
                style={{ color: "#00ffff", cursor: "pointer" }}
                onClick={() => setShowAllSatellites((s) => !s)}
              >
                {showAllSatellites ? "☑ Show All" : "☐ Show All"}
              </div>
              <div
                style={{ color: "#00ffff", cursor: "pointer" }}
                onClick={() => setShowDebris((s) => !s)}
              >
                {showDebris ? "☑ Debris" : "☐ Debris"}
              </div>
            </div>
            <div style={{ color: "#fff", opacity: 0.7, fontSize: 11 }}>
              {showAllSatellites
                ? `Showing ${displayedSatellites.length} satellites`
                : `Showing ${displayedSatellites.length} focused satellites (warnings + key assets)`}
            </div>
          </div>

          <div style={listContainerStyle}>
            {Object.entries(satelliteGroups).map(([org, sats]) => {
              if (sats.length === 0) return null;
              const isExpanded = expandedGroup === org;
              console.log(
                "Displayed sats:",
                displayedSatellites.length,
                displayedSatellites.slice(0, 3)
              );

              return (
                <div key={org} style={{ marginBottom: 16 }}>
                  {/* Group header - click to expand/collapse */}
                  <div
                    onClick={() =>
                      setExpandedGroup((prev) => (prev === org ? null : org))
                    }
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: "#00ffff",
                      fontWeight: isExpanded ? "bold" : "normal",
                    }}
                  >
                    <div style={{ flex: 1 }}>{org}</div>
                    <div>
                      <EyeIcon visible={isExpanded} />
                    </div>
                  </div>

                  {/* Expanded content - satellite list */}
                  {isExpanded && (
                    <div style={{ paddingLeft: 16, paddingTop: 8 }}>
                      {sats.map((sat) => (
                        <div
                          key={sat.id}
                          onClick={() => handleSatelliteClick(sat)}
                          style={{
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: 4,
                            transition: "background 0.2s",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            background:
                              selectedSatellite?.id === sat.id
                                ? "rgba(255,255,255,0.1)"
                                : "transparent",
                          }}
                        >
                          <div style={{ flex: 1 }}>{sat.name}</div>
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: sat.color,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning panel - always show if any warnings exist */}
      {warnings.length > 0 && (
        <WarningPanel warnings={warnings} onWarningClick={handleWarningClick} />
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
  color: "#00ffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  zIndex: 1000,
};

const loadingTextStyle: React.CSSProperties = {
  animation: "fadeIn 1.5s infinite",
};

const errorOverlayStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(255, 0, 0, 0.8)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  zIndex: 1000,
};

const errorTextStyle: React.CSSProperties = {
  animation: "shake 0.82s cubic-bezier(.36,.07,.19,.97) both",
};

const satelliteListStyle: React.CSSProperties = {
  position: "absolute",
  top: 20,
  right: 20,
  width: 300,
  maxHeight: "calc(100% - 40px)",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  color: "#00ffff",
  borderRadius: 8,
  overflowY: "auto",
  padding: 16,
  zIndex: 100,
  boxShadow: "0 4px 8px rgba(0, 255, 255, 0.2)",
};

const listHeaderStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: 12,
  borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
  paddingBottom: 8,
};

const listContainerStyle: React.CSSProperties = {
  maxHeight: 200,
  overflowY: "auto",
  paddingTop: 8,
  paddingBottom: 8,
};

export default OrbitalViewer;

const clearSelection = () => {
  setSelectedPath([]);
  setSelectedSatellite(null);
  setIsWarningPath(false);
  setIsIsolationMode(false);
  if (globeEl.current) {
    globeEl.current.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 800);
  }
};
