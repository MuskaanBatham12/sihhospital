import React, { useEffect, useState } from "react";

export default function History() {
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [physioHistory, setPhysioHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, VITALS, PHYSIO

  useEffect(() => {
    const savedVitals = localStorage.getItem("vaidya_vitals_history");
    if (savedVitals) {
      try {
        setVitalsHistory(JSON.parse(savedVitals));
      } catch (e) {}
    } else {
      setVitalsHistory([
        {
          id: 1,
          date: "21 Aug 2026",
          time: "10:30 AM",
          heartRate: "72",
          spo2: "98",
          temperature: "36.7",
          bloodPressure: "120/80",
          source: "ESP32 Sensor"
        }
      ]);
    }

    const savedPhysio = localStorage.getItem("vaidya_physio_history");
    if (savedPhysio) {
      try {
        setPhysioHistory(JSON.parse(savedPhysio));
      } catch (e) {}
    } else {
      setPhysioHistory([
        {
          id: 101,
          date: "21 Aug 2026",
          time: "09:15 AM",
          exercise: "Squats",
          reps: 10,
          targetReps: 10,
          accuracy: 96,
          duration: "02:45",
        },
        {
          id: 102,
          date: "20 Aug 2026",
          time: "04:30 PM",
          exercise: "Bicep Curls",
          reps: 12,
          targetReps: 12,
          accuracy: 94,
          duration: "03:10",
        }
      ]);
    }
  }, []);

  return (
    <div className="history-page-container">
      {/* HEADER */}
      <header className="history-header">
        <div>
          <div className="dashboard-eyebrow">
            <span>VAIDYA AI</span>
            <span className="bullet">•</span>
            <span>UNIFIED PATIENT TIMELINE</span>
          </div>
          <h1>Medical & Physiotherapy History</h1>
          <p>Comprehensive chronological records of all vital readings, sensor streams, and AI exercise sessions.</p>
        </div>

        <div className="history-metrics-summary">
          <div className="summary-pill">
            <strong>{vitalsHistory.length}</strong>
            <span>Vital Logs</span>
          </div>
          <div className="summary-pill purple">
            <strong>{physioHistory.length}</strong>
            <span>Physio Sessions</span>
          </div>
        </div>
      </header>

      {/* FILTER TABS */}
      <div className="history-tabs-bar">
        <button
          className={`h-tab ${activeTab === "ALL" ? "active" : ""}`}
          onClick={() => setActiveTab("ALL")}
        >
          All Activity ({vitalsHistory.length + physioHistory.length})
        </button>
        <button
          className={`h-tab ${activeTab === "VITALS" ? "active" : ""}`}
          onClick={() => setActiveTab("VITALS")}
        >
          ❤️ Vitals Telemetry ({vitalsHistory.length})
        </button>
        <button
          className={`h-tab ${activeTab === "PHYSIO" ? "active" : ""}`}
          onClick={() => setActiveTab("PHYSIO")}
        >
          🧘 AI Physiotherapy ({physioHistory.length})
        </button>
      </div>

      {/* PHYSIOTHERAPY SECTION */}
      {(activeTab === "ALL" || activeTab === "PHYSIO") && (
        <div className="content-card">
          <div className="card-header-flex">
            <div>
              <span className="card-kicker">MOTION BIOMECHANICS LOG</span>
              <h2>Physiotherapy Workout Sessions</h2>
            </div>
            <span className="count-tag">{physioHistory.length} Completed</span>
          </div>

          {physioHistory.length === 0 ? (
            <div className="empty-history-placeholder">
              <p>No physiotherapy sessions recorded yet. Start a session in the AI Physiotherapy module.</p>
            </div>
          ) : (
            <div className="physio-history-grid">
              {physioHistory.map((item) => (
                <div className="physio-session-card" key={item.id}>
                  <div className="sess-card-top">
                    <span className="sess-icon">🧘</span>
                    <span className="accuracy-pill">
                      {item.accuracy}% Accuracy
                    </span>
                  </div>

                  <h3>{item.exercise}</h3>
                  <div className="sess-stats">
                    <div>
                      <span>Reps Done:</span>
                      <strong>{item.reps} / {item.targetReps || 10}</strong>
                    </div>
                    <div>
                      <span>Duration:</span>
                      <strong>{item.duration || "02:30"}</strong>
                    </div>
                  </div>

                  <div className="sess-date-footer">
                    <span>📅 {item.date}</span>
                    <span>⏱️ {item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VITALS SECTION */}
      {(activeTab === "ALL" || activeTab === "VITALS") && (
        <div className="content-card">
          <div className="card-header-flex">
            <div>
              <span className="card-kicker">PHYSIOLOGICAL TELEMETRY</span>
              <h2>Vital Signs History</h2>
            </div>
            <span className="count-tag">{vitalsHistory.length} Logs</span>
          </div>

          {vitalsHistory.length === 0 ? (
            <div className="empty-history-placeholder">
              <p>No vital logs found.</p>
            </div>
          ) : (
            <div className="vitals-table-wrapper">
              <table className="vitals-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Heart Rate</th>
                    <th>SpO₂ Oxygen</th>
                    <th>Temperature</th>
                    <th>Blood Pressure</th>
                    <th>Telemetry Source</th>
                  </tr>
                </thead>
                <tbody>
                  {vitalsHistory.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.date}</strong> <small className="text-dim">{v.time}</small>
                      </td>
                      <td><strong>{v.heartRate}</strong> BPM</td>
                      <td><strong>{v.spo2}</strong>%</td>
                      <td><strong>{v.temperature}</strong>°C</td>
                      <td><strong>{v.bloodPressure}</strong></td>
                      <td>
                        <span className="source-tag">{v.source || "Sensor Reading"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}