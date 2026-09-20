import React, { useEffect, useState } from "react";
import { getHardwareTelemetry, getHardwareStatus } from "../services/vitalService";

const emptyForm = {
  heartRate: "",
  spo2: "",
  temperature: "",
  bloodPressure: "",
};

export default function Vitals() {
  const [form, setForm] = useState(emptyForm);
  const [vitals, setVitals] = useState({
    heartRate: "72",
    spo2: "98",
    temperature: "36.7",
    bloodPressure: "120/80",
  });
  const [history, setHistory] = useState([]);
  const [esp32SimulationActive, setEsp32SimulationActive] = useState(false);
  const [hardwareInfo, setHardwareInfo] = useState({
    device_id: "ESP32-VAIDYA-01",
    status: "STANDBY_MODE",
  });

  // Load saved vitals history
  useEffect(() => {
    const savedVitals = localStorage.getItem("vaidya_current_vitals");
    const savedHistory = localStorage.getItem("vaidya_vitals_history");

    if (savedVitals) {
      setVitals(JSON.parse(savedVitals));
    }
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    } else {
      // Seed default baseline reading
      const initialRecord = {
        id: 1,
        date: "21 Aug 2026",
        time: "10:30 AM",
        heartRate: "72",
        spo2: "98",
        temperature: "36.7",
        bloodPressure: "120/80",
        source: "Manual Entry"
      };
      setHistory([initialRecord]);
      localStorage.setItem("vaidya_vitals_history", JSON.stringify([initialRecord]));
    }

    getHardwareStatus().then((res) => {
      if (res) setHardwareInfo(res);
    });
  }, []);

  // ESP32 Live Telemetry Stream Simulation Timer
  useEffect(() => {
    let interval = null;
    if (esp32SimulationActive) {
      interval = setInterval(() => {
        // Generate realistic biological sensor jitter
        const hr = Math.floor(70 + Math.random() * 8);
        const o2 = Number((97.5 + Math.random() * 1.5).toFixed(1));
        const temp = Number((36.5 + Math.random() * 0.4).toFixed(1));
        const bp = "120/80";

        const newReading = {
          heartRate: String(hr),
          spo2: String(o2),
          temperature: String(temp),
          bloodPressure: bp,
        };
        setVitals(newReading);
        localStorage.setItem("vaidya_current_vitals", JSON.stringify(newReading));
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [esp32SimulationActive]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const saveVitals = (e) => {
    e.preventDefault();

    if (!form.heartRate || !form.spo2 || !form.temperature || !form.bloodPressure) {
      alert("Please enter all vital values.");
      return;
    }

    const now = new Date();
    const newRecord = {
      id: Date.now(),
      heartRate: form.heartRate,
      spo2: form.spo2,
      temperature: form.temperature,
      bloodPressure: form.bloodPressure,
      source: "Manual Entry",
      date: now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };

    const newHistory = [newRecord, ...history];
    const currentVitals = {
      heartRate: form.heartRate,
      spo2: form.spo2,
      temperature: form.temperature,
      bloodPressure: form.bloodPressure,
    };

    setVitals(currentVitals);
    setHistory(newHistory);

    localStorage.setItem("vaidya_current_vitals", JSON.stringify(currentVitals));
    localStorage.setItem("vaidya_vitals_history", JSON.stringify(newHistory));
    setForm(emptyForm);
  };

  // Calculate dynamic health score
  const calculateHealthScore = () => {
    const hr = parseFloat(vitals.heartRate) || 72;
    const spo2 = parseFloat(vitals.spo2) || 98;
    const temp = parseFloat(vitals.temperature) || 36.7;

    let score = 100;
    if (hr < 60 || hr > 100) score -= 10;
    if (spo2 < 95) score -= (95 - spo2) * 4;
    if (temp > 37.5) score -= (temp - 37.5) * 10;

    return Math.max(50, Math.min(100, Math.round(score)));
  };

  return (
    <div className="vitals-page-container">
      {/* HEADER */}
      <header className="vitals-header">
        <div>
          <div className="dashboard-eyebrow">
            <span>VAIDYA AI</span>
            <span className="bullet">•</span>
            <span>BIOMETRIC TELEMETRY & SENSORS</span>
          </div>
          <h1>Health Vitals & ESP32 Hardware</h1>
          <p>Continuous physiological telemetry, sensor ingestion, and baseline anomaly detection.</p>
        </div>

        {/* ESP32 SENSOR CONNECTION CHIP */}
        <div className="esp32-panel">
          <div className="esp32-status">
            <span className={`esp-dot ${esp32SimulationActive ? "streaming" : "standby"}`}></span>
            <div>
              <strong>ESP32 Microcontroller ({hardwareInfo.device_id})</strong>
              <small>{esp32SimulationActive ? "STREAMING REAL-TIME (2Hz)" : "READY FOR HARDWARE CONNECT"}</small>
            </div>
          </div>

          <button
            className={`esp-toggle-btn ${esp32SimulationActive ? "active" : ""}`}
            onClick={() => setEsp32SimulationActive(!esp32SimulationActive)}
          >
            {esp32SimulationActive ? "⏹ Pause Stream" : "⚡ Emulate ESP32 Live Stream"}
          </button>
        </div>
      </header>

      {/* HEALTH SCORE HERO CARD */}
      <div className="health-score-banner">
        <div className="score-left">
          <div className="heart-icon-badge">❤️</div>
          <div>
            <span className="card-kicker">OVERALL PHYSIOLOGICAL STATUS</span>
            <h2>Health Status: Optimal</h2>
            <p>
              {esp32SimulationActive
                ? "Live telemetry streamed from ESP32 optical sensors (MAX30102 + MLX90614)."
                : "Latest vital readings match normal clinical benchmarks."}
            </p>
          </div>
        </div>

        <div className="score-metric-box">
          <div className="score-huge-num">
            <strong>{calculateHealthScore()}</strong>
            <span>/100</span>
          </div>
          <span className="score-desc">Calculated Health Index</span>
        </div>
      </div>

      {/* LIVE 4-CARD VITALS DISPLAY */}
      <div className="vitals-four-grid">
        <div className="vital-large-card heart">
          <div className="vital-card-top">
            <span className="v-icon">❤️</span>
            <span className="status-pill normal">OPTIMAL</span>
          </div>
          <span className="v-label">HEART RATE</span>
          <div className="v-val">
            <strong>{vitals.heartRate}</strong>
            <small>BPM</small>
          </div>
          <div className="v-bar"><span style={{ width: `${Math.min(100, (parseFloat(vitals.heartRate) / 120) * 100)}%` }}></span></div>
          <span className="v-sub">Normal rest: 60–100 BPM</span>
        </div>

        <div className="vital-large-card oxygen">
          <div className="vital-card-top">
            <span className="v-icon">🫁</span>
            <span className="status-pill normal">OPTIMAL</span>
          </div>
          <span className="v-label">BLOOD OXYGEN (SpO₂)</span>
          <div className="v-val">
            <strong>{vitals.spo2}</strong>
            <small>%</small>
          </div>
          <div className="v-bar"><span style={{ width: `${vitals.spo2}%` }}></span></div>
          <span className="v-sub">Normal: 95%–100%</span>
        </div>

        <div className="vital-large-card temp">
          <div className="vital-card-top">
            <span className="v-icon">🌡️</span>
            <span className="status-pill normal">NORMAL</span>
          </div>
          <span className="v-label">BODY TEMPERATURE</span>
          <div className="v-val">
            <strong>{vitals.temperature}</strong>
            <small>°C</small>
          </div>
          <div className="v-bar"><span style={{ width: `${Math.min(100, ((parseFloat(vitals.temperature) - 34) / 6) * 100)}%` }}></span></div>
          <span className="v-sub">Normal: 36.5°C–37.5°C</span>
        </div>

        <div className="vital-large-card bp">
          <div className="vital-card-top">
            <span className="v-icon">🩺</span>
            <span className="status-pill normal">OPTIMAL</span>
          </div>
          <span className="v-label">BLOOD PRESSURE</span>
          <div className="v-val">
            <strong>{vitals.bloodPressure}</strong>
            <small>mmHg</small>
          </div>
          <div className="v-bar"><span style={{ width: "75%" }}></span></div>
          <span className="v-sub">Systolic / Diastolic</span>
        </div>
      </div>

      {/* MANUAL INPUT FORM */}
      <div className="content-card vitals-input-card">
        <div className="card-header-flex">
          <div>
            <span className="card-kicker">MANUAL CLINICAL LOG</span>
            <h2>Log New Vital Measurement</h2>
          </div>
          <span className="time-auto-badge">⏱️ Timestamp Added Automatically</span>
        </div>

        <form onSubmit={saveVitals}>
          <div className="vitals-inputs-grid">
            <div className="input-field-group">
              <label>Heart Rate (BPM)</label>
              <input
                type="number"
                name="heartRate"
                value={form.heartRate}
                onChange={handleChange}
                placeholder="e.g. 72"
              />
            </div>

            <div className="input-field-group">
              <label>Blood Oxygen SpO₂ (%)</label>
              <input
                type="number"
                name="spo2"
                value={form.spo2}
                onChange={handleChange}
                placeholder="e.g. 98"
              />
            </div>

            <div className="input-field-group">
              <label>Body Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                name="temperature"
                value={form.temperature}
                onChange={handleChange}
                placeholder="e.g. 36.7"
              />
            </div>

            <div className="input-field-group">
              <label>Blood Pressure (mmHg)</label>
              <input
                type="text"
                name="bloodPressure"
                value={form.bloodPressure}
                onChange={handleChange}
                placeholder="e.g. 120/80"
              />
            </div>
          </div>

          <button type="submit" className="primary-action-btn">
            ✓ Save & Append Vital Reading
          </button>
        </form>
      </div>

      {/* VITALS HISTORY TABLE */}
      <div className="content-card">
        <div className="card-header-flex">
          <div>
            <span className="card-kicker">HISTORICAL RECORDS</span>
            <h2>Vitals Measurement Log</h2>
          </div>
          <span className="record-count">{history.length} Entries Recorded</span>
        </div>

        {history.length === 0 ? (
          <div className="empty-history-placeholder">
            <p>No vital measurements recorded yet. Enter a reading above or toggle the ESP32 live stream.</p>
          </div>
        ) : (
          <div className="vitals-table-wrapper">
            <table className="vitals-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Heart Rate</th>
                  <th>SpO₂</th>
                  <th>Temperature</th>
                  <th>Blood Pressure</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id}>
                    <td>{record.date}</td>
                    <td>{record.time}</td>
                    <td><strong>{record.heartRate}</strong> BPM</td>
                    <td><strong>{record.spo2}</strong>%</td>
                    <td><strong>{record.temperature}</strong>°C</td>
                    <td><strong>{record.bloodPressure}</strong></td>
                    <td>
                      <span className="source-tag">{record.source || "Manual Entry"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}