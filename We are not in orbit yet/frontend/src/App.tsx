import OrbitalViewer from "./components/OrbitalViewer";

function App() {
  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        overflow: "hidden",
        height: "100vh",
        width: "100vw",
      }}
    >
      {/* Overlay Title */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 1000,
          color: "white",
          fontFamily: "Arial, sans-serif",
          pointerEvents: "none", // Click through the text
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2rem" }}>OrbitalGuard</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Live Tracking: International Space Station & Stations
        </p>
      </div>

      {/* The 3D Globe */}
      <OrbitalViewer />
    </div>
  );
}

export default App;
