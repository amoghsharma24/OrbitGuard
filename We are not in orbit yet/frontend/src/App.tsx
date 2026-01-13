import { useState, useEffect } from "react";
import axios from "axios";
import OrbitalViewer from "./components/OrbitalViewer";
import Login from "./components/Login";
import "./App.css";

// Warning data type
type Warning = {
  object: string;
  type: string;
  distance: number;
  timeOfApproach: string;
  hoursFromNow: number;
};

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("jwt_token")
  );
  const [syncing, setSyncing] = useState(false);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<any | null>(null);

  const handleLogin = (newToken: string) => {
    localStorage.setItem("jwt_token", newToken);
    setToken(newToken);
  };

  // Fetching warnings data from backend
  useEffect(() => {
    if (!token) return;

    const fetchWarnings = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/warnings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWarnings(res.data.conjunctions || []);
        console.log("Loaded", res.data.warningCount, "conjunction warnings");
      } catch (err) {
        console.error("Failed to fetch warnings:", err);
      }
    };

    fetchWarnings();
    // Refreshing warnings every 60 seconds
    const interval = setInterval(fetchWarnings, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    setToken(null);
  };

  const handleSync = async () => {
    if (!token || syncing) return;

    setSyncing(true);
    try {
      console.log("🚀 Initiating satellite data sync...");
      await axios.get("http://localhost:8080/api/sync", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Sync completed, reloading...");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      console.error("💥 Sync failed:", err);
      alert(err.response?.data || "Sync failed. Check console for details.");
      setSyncing(false);
    }
  };

  if (!token) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <div style={containerStyle}>
      {/* Top bar */}
      <div style={topBarStyle}>
        <div style={logoSectionStyle}>
          <div style={logoStyle}>⬡</div>
          <div>
            <div style={titleStyle}>ORBITALGUARD</div>
            <div style={statusStyle}>● SYSTEM ACTIVE</div>
          </div>
        </div>

        <div style={controlsStyle}>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              ...buttonStyle,
              opacity: syncing ? 0.6 : 1,
              cursor: syncing ? "not-allowed" : "pointer",
            }}
          >
            {syncing ? "⟳ SYNCING..." : "⟳ SYNC DATA"}
          </button>

          <button onClick={handleLogout} style={logoutButtonStyle}>
            ⏻ LOGOUT
          </button>
        </div>
      </div>

      {/* Globe viewer */}
      <div style={viewerContainerStyle}>
        <OrbitalViewer
          token={token}
          warnings={warnings}
          onSelectSatellite={(sat) => setSelectedSatellite(sat)}
        />

        {/* Status HUD */}
        {selectedSatellite && (
          <div style={hudStyle}>
            <div style={{ fontWeight: "bold", marginBottom: 6 }}>{selectedSatellite.name}</div>
            <div>Velocity: {(selectedSatellite.velocity_km_s || 0).toFixed(3)} km/s</div>
            <div>Altitude: {(selectedSatellite.alt || 0).toFixed(2)} km</div>
            <button
              onClick={() => {
                setSelectedSatellite(null);
                // notify globe to clear selection and zoom out
                window.dispatchEvent(new Event("clearSelection"));
              }}
              style={hudCloseStyle}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Futuristic minimalistic styles
const containerStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  height: "100vh",
  width: "100vw",
  backgroundColor: "#000000",
  display: "flex",
  flexDirection: "column",
  fontFamily: "'Courier New', monospace",
  overflow: "hidden",
};

const topBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "15px 25px",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  zIndex: 1000,
};

const logoSectionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
};

const logoStyle: React.CSSProperties = {
  fontSize: "24px",
  color: "#00ffff",
};

const titleStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "normal",
  letterSpacing: "2px",
  color: "#00ffff",
  margin: 0,
};

const statusStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "#00ff88",
  letterSpacing: "2px",
  marginTop: "2px",
};

const controlsStyle: React.CSSProperties = {
  display: "flex",
  gap: "15px",
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "transparent",
  color: "#00ffff",
  border: "1px solid #00ffff",
  borderRadius: "2px",
  cursor: "pointer",
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: "11px",
  letterSpacing: "1px",
};

const logoutButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  color: "#ff0055",
  border: "1px solid #ff0055",
};

const viewerContainerStyle: React.CSSProperties = {
  flex: 1,
  position: "relative",
  overflow: "hidden",
};

const hudStyle: React.CSSProperties = {
  position: "fixed",
  right: "20px",
  top: "90px",
  backgroundColor: "rgba(0,0,0,0.8)",
  color: "#fff",
  padding: "12px",
  border: "1px solid rgba(0,255,255,0.15)",
  borderRadius: "4px",
  zIndex: 1200,
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: "12px",
};

const hudCloseStyle: React.CSSProperties = {
  marginTop: "8px",
  padding: "6px 8px",
  background: "transparent",
  border: "1px solid #00ffff",
  color: "#00ffff",
  cursor: "pointer",
};

const bottomBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "40px",
  padding: "12px",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  zIndex: 1000,
};

const statusItemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "5px",
};

const statusLabelStyle: React.CSSProperties = {
  fontSize: "9px",
  color: "#666",
  letterSpacing: "1px",
};

const statusValueStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "#00ffff",
  letterSpacing: "1px",
};

export default App;
