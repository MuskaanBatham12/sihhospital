import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const [showMenu, setShowMenu] = useState(false);

  const userName = localStorage.getItem("vaidyaUser") || "Patient";

  const handleLogout = () => {
    localStorage.removeItem("vaidyaUser");
    setShowMenu(false);

    navigate("/login");
  };

  return (
    <aside className="sidebar">

      {/* LOGO */}

      <div className="logo">
        <h2>VAIDYA AI</h2>
        <p>Intelligent Healthcare</p>
      </div>


      {/* NAVIGATION */}

      <nav className="navigation">

        <a href="/dashboard">
          🏠 Dashboard
        </a>

        <a href="/hospitals">
          🏥 Hospitals
        </a>

        <a href="/vitals">
          ❤️ My Vitals
        </a>

        <a href="/physiotherapy">
          🧘 Physiotherapy
        </a>

        <a href="/history">
          📋 History
        </a>

        <a href="/sos">
          🚨 Emergency SOS
        </a>

      </nav>


      {/* USER */}

      <div
        className="sidebar-user"
        onClick={() => setShowMenu(!showMenu)}
      >

        <div className="user-avatar">
          {userName.charAt(0).toUpperCase()}
        </div>

        <div className="user-info">
          <strong>{userName}</strong>
          <span>Patient</span>
        </div>

        <span className="user-arrow">
          {showMenu ? "⌃" : "⌄"}
        </span>

      </div>


      {/* DROPDOWN */}

      {showMenu && (
        <div className="user-menu">

          <div className="user-menu-name">
            <strong>{userName}</strong>
            <span>Patient Account</span>
          </div>

          <button onClick={handleLogout}>
            🚪 Logout
          </button>

        </div>
      )}

    </aside>
  );
}

export default Navbar;