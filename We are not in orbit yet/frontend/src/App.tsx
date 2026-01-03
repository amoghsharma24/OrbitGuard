import { useState, useEffect } from "react";

function App() {
  const [status, setStatus] = useState("Connecting to Mission Control...");

  useEffect(() => {
    // This fetches data from your Java Backend
    fetch("http://localhost:8080/api/health")
      .then((response) => response.text())
      .then((data) => setStatus(data))
      .catch((error) => setStatus("Connection Failed: " + error));
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#0f172a",
        color: "#e2e8f0",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>
        🛰️ OrbitalGuard
      </h1>
      <div
        style={{
          padding: "20px",
          border: "1px solid #3b82f6",
          borderRadius: "8px",
          backgroundColor: "#1e293b",
        }}
      >
        <p style={{ fontSize: "1.2rem" }}>Backend Status:</p>
        <h2 style={{ color: "#4ade80" }}>{status}</h2>
      </div>
    </div>
  );
}

export default App;
