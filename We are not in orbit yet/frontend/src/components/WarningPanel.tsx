import React from "react";

type Warning = {
  object: string;
  type: string;
  distance: number;
  timeOfApproach: string;
  hoursFromNow: number;
};

interface Props {
  warnings: Warning[];
  onWarningClick?: (warningName: string) => void;
}

const WarningPanel: React.FC<Props> = (props) => {
  const { warnings, onWarningClick } = props;
  if (warnings.length === 0) return null;

  // Sorting warnings by distance (closest first)
  const sortedWarnings = [...warnings].sort((a, b) => a.distance - b.distance);

  // Checking if any warnings are critically close (< 10km)
  const hasCritical = sortedWarnings.some((w) => w.distance < 10);

  return (
    <div
      style={
        hasCritical ? { ...panelStyle, ...criticalPanelStyle } : panelStyle
      }
    >
      <div style={headerStyle}>CONJUNCTION WARNINGS</div>

      <div style={countStyle}>
        {warnings.length} OBJECT{warnings.length > 1 ? "S" : ""} WITHIN 50KM
      </div>

      <div style={listContainerStyle}>
        {sortedWarnings.slice(0, 10).map((warning, idx) => (
          <div
            key={idx}
            onClick={() => props.onWarningClick?.(warning.object)}
            style={{
              ...(warning.distance < 10
                ? { ...warningItemStyle, ...criticalItemStyle }
                : warningItemStyle),
              cursor: props.onWarningClick ? "pointer" : "default",
            }}
          >
            <div style={nameStyle}>{warning.object}</div>
            <div style={detailsContainerStyle}>
              <div style={distanceStyle}>{warning.distance.toFixed(2)} km</div>
              <div style={timeStyle}>in {warning.hoursFromNow.toFixed(1)}h</div>
            </div>
          </div>
        ))}
      </div>

      {warnings.length > 10 && (
        <div style={moreStyle}>+{warnings.length - 10} more objects</div>
      )}
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  position: "fixed",
  top: "80px",
  left: "20px",
  backgroundColor: "rgba(15, 23, 42, 0.8)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 0, 85, 0.5)",
  borderRadius: "4px",
  padding: "15px",
  minWidth: "320px",
  maxWidth: "400px",
  maxHeight: "30vh",
  zIndex: 300,
  fontFamily: "'Space Grotesk', sans-serif",
};

const criticalPanelStyle: React.CSSProperties = {
  border: "2px solid #ff0055",
  animation: "pulse 3s ease-in-out infinite",
  backgroundColor: "rgba(139, 0, 0, 0.85)",
};

const headerStyle: React.CSSProperties = {
  color: "#ff0055",
  fontSize: "12px",
  fontWeight: "bold",
  letterSpacing: "2px",
  marginBottom: "10px",
  paddingBottom: "8px",
  borderBottom: "1px solid rgba(255, 0, 85, 0.3)",
};

const countStyle: React.CSSProperties = {
  color: "#ffaaaa",
  fontSize: "10px",
  letterSpacing: "1px",
  marginBottom: "12px",
};

const listContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  maxHeight: "calc(30vh - 100px)",
  overflowY: "auto",
  overflowX: "hidden",
};

const warningItemStyle: React.CSSProperties = {
  backgroundColor: "rgba(255, 0, 85, 0.1)",
  border: "1px solid rgba(255, 0, 85, 0.3)",
  borderRadius: "3px",
  padding: "8px 10px",
  transition: "all 0.2s",
};

const criticalItemStyle: React.CSSProperties = {
  backgroundColor: "rgba(255, 0, 85, 0.25)",
  border: "1px solid #ff0055",
  animation: "pulse 3s ease-in-out infinite",
};

const nameStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: "bold",
  marginBottom: "5px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const detailsContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
};

const distanceStyle: React.CSSProperties = {
  color: "#ff0055",
  fontSize: "10px",
  fontWeight: "bold",
};

const timeStyle: React.CSSProperties = {
  color: "#999",
  fontSize: "9px",
};

const moreStyle: React.CSSProperties = {
  color: "#666",
  fontSize: "9px",
  marginTop: "10px",
  paddingTop: "8px",
  borderTop: "1px solid rgba(255, 0, 85, 0.2)",
  textAlign: "center",
};

export default WarningPanel;
