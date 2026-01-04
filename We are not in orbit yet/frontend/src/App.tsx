import { useState } from "react";
import axios from "axios";
import OrbitalViewer from "./components/OrbitalViewer";
import Login from "./components/Login";
import "./App.css";

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("jwt_token")
  );
  const [syncing, setSyncing] = useState(false);

  const handleLogin = (newToken: string) => {
    localStorage.setItem("jwt_token", newToken);
    setToken(newToken);
  };

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
        <OrbitalViewer token={token} />
      </div>

      {/* Bottom status bar */}
      <div style={bottomBarStyle}>
        <div style={statusItemStyle}>
          <span style={statusLabelStyle}>SYSTEM</span>
          <span style={statusValueStyle}>OPERATIONAL</span>
        </div>
        <div style={statusItemStyle}>
          <span style={statusLabelStyle}>COVERAGE</span>
          <span style={statusValueStyle}>GLOBAL</span>
        </div>
        <div style={statusItemStyle}>
          <span style={statusLabelStyle}>MODE</span>
          <span style={statusValueStyle}>REAL-TIME</span>
        </div>
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
  fontFamily: "'Courier New', monospace",
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
