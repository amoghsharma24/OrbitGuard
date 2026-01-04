import React, { useState } from "react";
import axios from "axios";

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isRegistering ? "/register" : "/login";

    try {
      const response = await axios.post(
        `http://localhost:8080/api/auth${endpoint}`,
        {
          email,
          password,
        }
      );

      const token = response.data.token;
      onLoginSuccess(token);
    } catch (err: any) {
      setError("Access Denied: Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Animated background grid */}
      <div style={gridOverlayStyle} />

      {/* Floating particles effect */}
      <div style={particlesStyle} />

      <div style={cardStyle}>
        {/* Logo section */}
        <div style={logoContainerStyle}>
          <div style={logoIconStyle}>⬡</div>
          <h1 style={titleStyle}>ORBITALGUARD</h1>
          <div style={subtitleStyle}>
            {isRegistering ? "SYSTEM REGISTRATION" : "AUTHENTICATION REQUIRED"}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputContainerStyle}>
            <div style={inputLabelStyle}>EMAIL ADDRESS</div>
            <input
              type="email"
              placeholder="officer@command.space"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div style={inputContainerStyle}>
            <div style={inputLabelStyle}>ACCESS CODE</div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          <button
            type="submit"
            style={{
              ...buttonStyle,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading
              ? "PROCESSING..."
              : isRegistering
              ? "INITIALIZE"
              : "AUTHENTICATE"}
          </button>
        </form>

        <div
          onClick={() => !loading && setIsRegistering(!isRegistering)}
          style={{
            ...switchModeStyle,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {isRegistering ? "← RETURN TO LOGIN" : "NEW OFFICER? REGISTER →"}
        </div>
      </div>
    </div>
  );
};

// Futuristic minimalistic styles
const containerStyle: React.CSSProperties = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#000000",
  color: "#ffffff",
  fontFamily: "'Courier New', monospace",
  position: "relative",
  overflow: "hidden",
};

const gridOverlayStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundImage: `
    linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
  `,
  backgroundSize: "50px 50px",
  animation: "gridMove 20s linear infinite",
  pointerEvents: "none",
};

const particlesStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background:
    "radial-gradient(circle at 20% 50%, rgba(0, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 0, 255, 0.1) 0%, transparent 50%)",
  pointerEvents: "none",
};

const cardStyle: React.CSSProperties = {
  padding: "50px 40px",
  backgroundColor: "rgba(10, 10, 10, 0.9)",
  border: "1px solid rgba(0, 255, 255, 0.3)",
  borderRadius: "2px",
  width: "420px",
  textAlign: "center",
  boxShadow:
    "0 0 60px rgba(0, 255, 255, 0.2), inset 0 0 30px rgba(0, 255, 255, 0.05)",
  backdropFilter: "blur(20px)",
  position: "relative",
  zIndex: 1,
};

const logoContainerStyle: React.CSSProperties = {
  marginBottom: "40px",
};

const logoIconStyle: React.CSSProperties = {
  fontSize: "60px",
  color: "#00ffff",
  marginBottom: "10px",
  textShadow: "0 0 20px rgba(0, 255, 255, 0.8)",
  letterSpacing: "10px",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px 0",
  fontSize: "28px",
  fontWeight: "bold",
  letterSpacing: "8px",
  color: "#00ffff",
  textShadow: "0 0 10px rgba(0, 255, 255, 0.5)",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#666",
  letterSpacing: "3px",
  fontWeight: "bold",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "25px",
};

const inputContainerStyle: React.CSSProperties = {
  textAlign: "left",
};

const inputLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "#00ffff",
  letterSpacing: "2px",
  marginBottom: "8px",
  fontWeight: "bold",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "2px",
  border: "1px solid rgba(0, 255, 255, 0.3)",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  color: "#ffffff",
  fontSize: "14px",
  fontFamily: "'Courier New', monospace",
  outline: "none",
  transition: "all 0.3s",
  boxSizing: "border-box",
};

const errorStyle: React.CSSProperties = {
  color: "#ff0055",
  fontSize: "12px",
  letterSpacing: "1px",
  padding: "10px",
  border: "1px solid rgba(255, 0, 85, 0.3)",
  backgroundColor: "rgba(255, 0, 85, 0.1)",
  borderRadius: "2px",
};

const buttonStyle: React.CSSProperties = {
  padding: "16px",
  borderRadius: "2px",
  border: "1px solid #00ffff",
  backgroundColor: "rgba(0, 255, 255, 0.1)",
  color: "#00ffff",
  fontSize: "14px",
  fontWeight: "bold",
  fontFamily: "'Courier New', monospace",
  letterSpacing: "3px",
  cursor: "pointer",
  transition: "all 0.3s",
  boxShadow: "0 0 20px rgba(0, 255, 255, 0.2)",
};

const switchModeStyle: React.CSSProperties = {
  marginTop: "30px",
  cursor: "pointer",
  color: "#00ffff",
  fontSize: "11px",
  letterSpacing: "2px",
  opacity: 0.7,
  transition: "opacity 0.3s",
};

export default Login;
