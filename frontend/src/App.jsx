import React, { useState } from "react";
import "./App.css";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import StartupAnimation from "./components/StartupAnimation";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Hospitals from "./pages/Hospitals";
import SOS from "./pages/SOS";
import Vitals from "./pages/Vitals";
import Physiotherapy from "./pages/Physiotherapy";
import History from "./pages/History";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <StartupAnimation onComplete={() => setShowSplash(false)} />}
      <BrowserRouter>

      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <>
              <Navbar />

              <main className="main-content">
                <Dashboard />
              </main>
            </>
          }
        />

        {/* HOSPITALS */}
        <Route
          path="/hospitals"
          element={
            <>
              <Navbar />

              <main className="main-content">
                <Hospitals />
              </main>
            </>
          }
        />

        {/* VITALS */}
        <Route
          path="/vitals"
          element={
            <>
              <Navbar />

              <main className="main-content">
                <Vitals />
              </main>
            </>
          }
        />

        {/* PHYSIOTHERAPY */}
        <Route
          path="/physiotherapy"
          element={
            <>
              <Navbar />

              <main className="main-content">
                <Physiotherapy />
              </main>
            </>
          }
        />

        {/* HISTORY */}
        <Route
          path="/history"
          element={
            <>
              <Navbar />

              <main className="main-content">
                <History />
              </main>
            </>
          }
        />

        {/* SOS */}
        <Route
          path="/sos"
          element={
            <>
              <Navbar />

              <main className="main-content">
                <SOS />
              </main>
            </>
          }
        />

        {/* HOME → LOGIN */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* UNKNOWN → LOGIN */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;