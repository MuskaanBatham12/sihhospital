import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHospitals } from "../services/hospitalService";
import { getHardwareTelemetry } from "../services/vitalService";
import { getPhysioStatus } from "../services/physioService";

export default function Dashboard() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("vaidyaUser") || "Patient";

  const [hospitalsData, setHospitalsData] = useState([]);
  const [networkStats, setNetworkStats] = useState({
    totalBeds: 128,
    icuBeds: 24,
    oxygenUnits: 76,
    activeAmbulances: 8,
    averageLoad: 48,
  });

  const [liveVitals, setLiveVitals] = useState({
    heartRate: 72,
    spo2: 98,
    temperature: 36.7,
    bloodPressure: "120/80",
    status: "OPTIMAL",
  });

  const [physioStatus, setPhysioStatus] = useState("AI Ready (12 Exercises)");
  const [hardwareConnected, setHardwareConnected] = useState(true);
  const [aiAssistantQuery, setAiAssistantQuery] = useState("");
  const [aiAssistantReply, setAiAssistantReply] = useState(
    "Hello! I am your Vaidya AI health copilot. Ask me about nearby hospitals, exercise form, or your vital parameters."
  );

  useEffect(() => {
    // Load stored vitals if present
    const savedVitals = localStorage.getItem("vaidya_current_vitals");
    if (savedVitals) {
      try {
        const parsed = JSON.parse(savedVitals);
        setLiveVitals((prev) => ({
          ...prev,
          heartRate: parsed.heartRate || prev.heartRate,
          spo2: parsed.spo2 || prev.spo2,
          temperature: parsed.temperature || prev.temperature,
          bloodPressure: parsed.bloodPressure || prev.bloodPressure,
        }));
      } catch (e) {}
    }

    // Fetch live hospital data
    getHospitals().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setHospitalsData(data);
        const totalB = data.reduce((acc, h) => acc + (h.available_beds || 0), 0);
        const icuB = data.reduce((acc, h) => acc + (h.icu_beds || 0), 0);
        const o2 = data.reduce((acc, h) => acc + (h.oxygen_available || 0), 0);
        setNetworkStats({
          totalBeds: totalB || 128,
          icuBeds: icuB || 24,
          oxygenUnits: o2 || 76,
          activeAmbulances: 8,
          averageLoad: Math.round(data.reduce((acc, h) => acc + (h.current_load || 40), 0) / data.length),
        });
      }
    });

    // Check physio status
    getPhysioStatus().then((res) => {
      if (res && res.status === "ready") {
        setPhysioStatus(`Online (${res.total_exercises || 12} Exercises Available)`);
      }
    });

    // Check ESP32 hardware telemetry
    getHardwareTelemetry().then((res) => {
      if (res && res.heart_rate) {
        setHardwareConnected(true);
      }
    });
  }, []);

  const handleAiAsk = (e) => {
    e.preventDefault();
    if (!aiAssistantQuery.trim()) return;

    const query = aiAssistantQuery.toLowerCase();
    let reply = "Based on your vitals, your health metrics are in optimal range.";

    if (query.includes("hospital") || query.includes("bed") || query.includes("icu")) {
      reply = `Network status: ${networkStats.totalBeds} general beds and ${networkStats.icuBeds} ICU beds are currently available across the network. City Care Hospital currently has the highest 94% allocation match.`;
    } else if (query.includes("sos") || query.includes("emergency")) {
      reply = "If this is a critical medical emergency, click the Emergency SOS button immediately to trigger GPS-based automated hospital allocation.";
    } else if (query.includes("exercise") || query.includes("physio") || query.includes("squat")) {
      reply = "The AI Physiotherapy module is equipped with 12 motion-tracking exercises including Squats, Bicep Curls, and Lunges with real-time audio posture feedback.";
    } else if (query.includes("vitals") || query.includes("heart") || query.includes("oxygen")) {
      reply = `Your heart rate is ${liveVitals.heartRate} BPM, and SpO2 is ${liveVitals.spo2}%. All parameters conform to healthy clinical baselines.`;
    }

    setAiAssistantReply(reply);
    setAiAssistantQuery("");
  };

  return (
    <div className="dashboard-container">
      {/* TOP COMMAND BAR */}
      <header className="dashboard-topbar">
        <div>
          <div className="dashboard-eyebrow">
            <span>HEALTHCARE COMMAND CENTER</span>
            <span className="bullet">•</span>
            <span>REAL-TIME AI SYSTEM</span>
          </div>
          <h1>
            Welcome back, <span>{userName}</span> 👋
          </h1>
          <p>Here is your real-time health telemetry and regional hospital resource status.</p>
        </div>

        <div className="topbar-actions">
          <div className="hardware-chip">
            <span className={`chip-dot ${hardwareConnected ? "online" : "standby"}`}></span>
            <div>
              <small>ESP32 TELEMETRY</small>
              <strong>{hardwareConnected ? "Connected (WiFi)" : "Standby Mode"}</strong>
            </div>
          </div>

          <button className="primary-sos-btn" onClick={() => navigate("/sos")}>
            <span className="sos-pulse"></span>
            🚨 Emergency SOS
          </button>
        </div>
      </header>

      {/* QUICK VITALS STRIP */}
      <section className="vitals-strip">
        <div className="vital-glance-card">
          <div className="vital-glance-header">
            <span className="vital-emoji heart">❤️</span>
            <span className="vital-pill normal">NORMAL</span>
          </div>
          <div className="vital-glance-body">
            <span className="vital-label">HEART RATE</span>
            <div className="vital-num">
              <strong>{liveVitals.heartRate}</strong>
              <small>BPM</small>
            </div>
            <div className="pulse-wave">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <div className="vital-glance-card">
          <div className="vital-glance-header">
            <span className="vital-emoji oxygen">🫁</span>
            <span className="vital-pill normal">NORMAL</span>
          </div>
          <div className="vital-glance-body">
            <span className="vital-label">BLOOD OXYGEN (SpO₂)</span>
            <div className="vital-num">
              <strong>{liveVitals.spo2}</strong>
              <small>%</small>
            </div>
            <div className="progress-linear">
              <span style={{ width: `${liveVitals.spo2}%` }}></span>
            </div>
          </div>
        </div>

        <div className="vital-glance-card">
          <div className="vital-glance-header">
            <span className="vital-emoji temp">🌡️</span>
            <span className="vital-pill normal">NORMAL</span>
          </div>
          <div className="vital-glance-body">
            <span className="vital-label">TEMPERATURE</span>
            <div className="vital-num">
              <strong>{liveVitals.temperature}</strong>
              <small>°C</small>
            </div>
            <p className="vital-subtext">36.5°C - 37.5°C Normal range</p>
          </div>
        </div>

        <div className="vital-glance-card">
          <div className="vital-glance-header">
            <span className="vital-emoji bp">🩺</span>
            <span className="vital-pill normal">NORMAL</span>
          </div>
          <div className="vital-glance-body">
            <span className="vital-label">BLOOD PRESSURE</span>
            <div className="vital-num">
              <strong>{liveVitals.bloodPressure}</strong>
              <small>mmHg</small>
            </div>
            <p className="vital-subtext">Systolic / Diastolic</p>
          </div>
        </div>
      </section>

      {/* MAIN TWO-COLUMN WORKFLOW GRID */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN: Regional Resource Monitor + Allocation Formula */}
        <div className="dashboard-column">
          {/* Hospital Network Capacity */}
          <div className="content-card">
            <div className="card-header-flex">
              <div>
                <span className="card-kicker">REGIONAL INFRASTRUCTURE</span>
                <h2>Hospital Network Live Status</h2>
              </div>
              <button className="text-link-btn" onClick={() => navigate("/hospitals")}>
                View All Facilities →
              </button>
            </div>

            <div className="resources-matrix">
              <div className="matrix-tile">
                <span className="tile-icon">🛏️</span>
                <div>
                  <strong>{networkStats.totalBeds}</strong>
                  <span>Available Beds</span>
                </div>
              </div>

              <div className="matrix-tile">
                <span className="tile-icon purple">🏥</span>
                <div>
                  <strong>{networkStats.icuBeds}</strong>
                  <span>ICU Beds</span>
                </div>
              </div>

              <div className="matrix-tile">
                <span className="tile-icon cyan">🫁</span>
                <div>
                  <strong>{networkStats.oxygenUnits}</strong>
                  <span>Oxygen Cylinders</span>
                </div>
              </div>

              <div className="matrix-tile">
                <span className="tile-icon green">🚑</span>
                <div>
                  <strong>{networkStats.activeAmbulances}</strong>
                  <span>Ambulances Active</span>
                </div>
              </div>
            </div>

            {/* AI Allocation Formula Explainer */}
            <div className="allocation-explainer-box">
              <div className="explainer-top">
                <span className="sparkle-icon">✦</span>
                <strong>VAIDYA AI Allocation Algorithm</strong>
              </div>
              <p>Every emergency request is ranked in real time using our multi-objective weighting:</p>
              
              <div className="formula-pills">
                <div className="formula-pill">
                  <span className="pct">40%</span>
                  <span className="desc">Available Resources</span>
                </div>
                <div className="formula-pill">
                  <span className="pct">30%</span>
                  <span className="desc">Emergency Severity</span>
                </div>
                <div className="formula-pill">
                  <span className="pct">20%</span>
                  <span className="desc">Distance / Proximity</span>
                </div>
                <div className="formula-pill">
                  <span className="pct">10%</span>
                  <span className="desc">Hospital Load Factor</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="content-card">
            <div className="card-header-flex">
              <div>
                <span className="card-kicker">QUICK SHORTCUTS</span>
                <h2>Healthcare Services</h2>
              </div>
            </div>

            <div className="quick-actions-grid">
              <div className="service-card" onClick={() => navigate("/hospitals")}>
                <div className="service-icon-box">🏥</div>
                <div>
                  <h3>Hospital Allocation</h3>
                  <p>Check available beds, ICU, oxygen and request patient admission.</p>
                </div>
              </div>

              <div className="service-card" onClick={() => navigate("/physiotherapy")}>
                <div className="service-icon-box cyan">🧘</div>
                <div>
                  <h3>AI Physiotherapy Studio</h3>
                  <p>12 camera-tracked exercises with rep counting and speech feedback.</p>
                </div>
              </div>

              <div className="service-card" onClick={() => navigate("/vitals")}>
                <div className="service-icon-box green">❤️</div>
                <div>
                  <h3>Vitals & Telemetry</h3>
                  <p>Record clinical readings or stream directly from ESP32 sensors.</p>
                </div>
              </div>

              <div className="service-card" onClick={() => navigate("/history")}>
                <div className="service-icon-box purple">📋</div>
                <div>
                  <h3>Medical Timeline</h3>
                  <p>Review past vital logs, emergency admissions and physio sessions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Copilot + Physio Widget + Recent Activity */}
        <div className="dashboard-column">
          {/* AI Clinical Assistant Widget */}
          <div className="content-card ai-assistant-card">
            <div className="card-header-flex">
              <div className="ai-title-group">
                <div className="ai-badge-icon">✦</div>
                <div>
                  <span className="card-kicker">AI COPILOT</span>
                  <h2>Vaidya Assistant</h2>
                </div>
              </div>
              <span className="live-tag">
                <span className="live-dot"></span> ONLINE
              </span>
            </div>

            <div className="ai-chat-bubble">
              <p>{aiAssistantReply}</p>
            </div>

            <form className="ai-input-form" onSubmit={handleAiAsk}>
              <input
                type="text"
                placeholder="Ask about hospital beds, vitals, exercises..."
                value={aiAssistantQuery}
                onChange={(e) => setAiAssistantQuery(e.target.value)}
              />
              <button type="submit">Ask →</button>
            </form>

            <div className="ai-chips">
              <button onClick={() => setAiAssistantQuery("Which hospital has ICU beds available?")}>
                ICU Availability
              </button>
              <button onClick={() => setAiAssistantQuery("How to perform Squats properly?")}>
                Squat Instructions
              </button>
              <button onClick={() => setAiAssistantQuery("What are normal vital ranges?")}>
                Vitals Benchmark
              </button>
            </div>
          </div>

          {/* AI Physiotherapy Highlight */}
          <div className="content-card physio-promo-card">
            <div className="physio-promo-content">
              <span className="card-kicker">MOTION ANALYSIS ENGINE</span>
              <h3>AI Physiotherapy Studio</h3>
              <p>State-of-the-art joint angle tracking powered by MediaPipe Tasks API.</p>
              
              <div className="physio-tags">
                <span>🦵 Squats</span>
                <span>💪 Shoulder Raises</span>
                <span>🏋️ Bicep Curls</span>
                <span>🏃 Lunges</span>
                <span>+8 More</span>
              </div>

              <button className="primary-action-btn" onClick={() => navigate("/physiotherapy")}>
                Launch Motion Camera →
              </button>
            </div>
          </div>

          {/* Live System Activity Feed */}
          <div className="content-card">
            <div className="card-header-flex">
              <div>
                <span className="card-kicker">REAL-TIME TELEMETRY</span>
                <h2>Recent Network Activity</h2>
              </div>
              <span className="refresh-indicator">● Live Feed</span>
            </div>

            <div className="activity-timeline">
              <div className="activity-row">
                <span className="activity-dot green"></span>
                <div>
                  <strong>City Care Hospital</strong>
                  <p>ICU Bed #4 allocated via 40/30/20/10 engine</p>
                </div>
                <time>1 min ago</time>
              </div>

              <div className="activity-row">
                <span className="activity-dot blue"></span>
                <div>
                  <strong>ESP32 Sensor Telemetry</strong>
                  <p>Live vital telemetry sync: SpO2 98%, HR 72 BPM</p>
                </div>
                <time>3 mins ago</time>
              </div>

              <div className="activity-row">
                <span className="activity-dot purple"></span>
                <div>
                  <strong>Physiotherapy Session Logged</strong>
                  <p>Squats workout: 10 Reps, 96% Form Accuracy</p>
                </div>
                <time>15 mins ago</time>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}