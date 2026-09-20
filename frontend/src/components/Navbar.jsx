import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userName = localStorage.getItem("vaidyaUser") || "Patient";

  const handleLogout = () => {
    localStorage.removeItem("vaidyaUser");
    localStorage.removeItem("vaidyaPatientProfile");
    setShowMenu(false);
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: "🏠", label: "Dashboard" },
    { to: "/hospitals", icon: "🏥", label: "Hospital Network" },
    { to: "/sos", icon: "🚨", label: "Emergency SOS", badge: "LIVE" },
    { to: "/physiotherapy", icon: "🧘", label: "AI Physiotherapy", badge: "12 Exercises" },
    { to: "/vitals", icon: "❤️", label: "Vitals & ESP32" },
    { to: "/history", icon: "📋", label: "Medical History" },
  ];

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="mobile-header">
        <div className="logo-compact">
          <span className="pulse-glow"></span>
          <strong>VAIDYA AI</strong>
        </div>
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        {/* LOGO */}
        <div className="logo">
          <div className="logo-mark">
            <span className="pulse-ring"></span>
            <span>✚</span>
          </div>
          <div>
            <h2>VAIDYA AI</h2>
            <p>VIRTUAL HEALTH & MOTION INTELLIGENCE</p>
          </div>
        </div>

        {/* SYSTEM STATUS BADGE */}
        <div className="sidebar-status-pill">
          <span className="dot-green"></span>
          <span>SYSTEM ONLINE • v2.0</span>
        </div>

        {/* NAVIGATION */}
        <div className="nav-section">
          <span className="nav-label">CLINICAL SUITE</span>
          <nav className="navigation">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`nav-link ${isActive ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                  {item.badge && (
                    <span className={`nav-badge ${item.badge === "LIVE" ? "emergency" : "tech"}`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* EMERGENCY SOS QUICK ACTION */}
        <div className="nav-emergency">
          <div className="emergency-mini-icon">🚨</div>
          <div>
            <strong>Emergency Assist</strong>
            <p>Instant Hospital Allocation</p>
          </div>
          <button
            className="emergency-nav-button"
            onClick={() => {
              setMobileOpen(false);
              navigate("/sos");
            }}
          >
            SOS
          </button>
        </div>

        {/* USER PROFILE */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => setShowMenu(!showMenu)}>
            <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <strong>{userName}</strong>
              <span>Verified Patient</span>
            </div>
            <span className="user-arrow">{showMenu ? "▲" : "▼"}</span>
          </div>

          {/* DROPDOWN */}
          {showMenu && (
            <div className="user-menu">
              <div className="user-menu-name">
                <strong>{userName}</strong>
                <span>ID: VAIDYA-PT-{Math.floor(userName.length * 142 + 100)}</span>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Navbar;