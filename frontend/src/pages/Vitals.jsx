import React, { useEffect, useState } from "react";

const emptyForm = {
  heartRate: "",
  spo2: "",
  temperature: "",
  bloodPressure: "",
};

function Vitals() {
  const [form, setForm] = useState(emptyForm);

  const [vitals, setVitals] = useState({
    heartRate: "--",
    spo2: "--",
    temperature: "--",
    bloodPressure: "--",
  });

  const [history, setHistory] = useState([]);

  // Load saved data
  useEffect(() => {
    const savedVitals = localStorage.getItem("vaidya_current_vitals");
    const savedHistory = localStorage.getItem("vaidya_vitals_history");

    if (savedVitals) {
      setVitals(JSON.parse(savedVitals));
    }

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const saveVitals = (e) => {
    e.preventDefault();

    if (
      !form.heartRate ||
      !form.spo2 ||
      !form.temperature ||
      !form.bloodPressure
    ) {
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

    localStorage.setItem(
      "vaidya_current_vitals",
      JSON.stringify(currentVitals)
    );

    localStorage.setItem(
      "vaidya_vitals_history",
      JSON.stringify(newHistory)
    );

    setForm(emptyForm);
  };

  return (
    <div className="dark-vitals-page">

      {/* HEADER */}

      <div className="dark-vitals-header">

        <div>
          <span className="dark-eyebrow">
            VAIDYA AI • HEALTH MONITORING
          </span>

          <h1>My Health & Vitals</h1>

          <p>
            Monitor your health and keep track of your vital readings.
          </p>
        </div>

        <div className="live-status">
          <span></span>
          Health monitoring active
        </div>

      </div>


      {/* HEALTH OVERVIEW */}

      <div className="health-overview">

        <div className="overview-left">

          <div className="overview-icon">
            ♥
          </div>

          <div>
            <span>HEALTH STATUS</span>

            <h2>
              {history.length > 0 ? "Looking Good" : "Ready to Monitor"}
            </h2>

            <p>
              {history.length > 0
                ? "Your latest vital readings are available below."
                : "Enter your vitals to start monitoring your health."}
            </p>
          </div>

        </div>

        <div className="health-score">

          <strong>
            {history.length > 0 ? "92" : "--"}
          </strong>

          <span>/100</span>

          <small>Health Score</small>

        </div>

      </div>


      {/* INPUT SECTION */}

      <div className="vitals-form-card">

        <div className="section-top">

          <div>
            <span className="dark-eyebrow">
              UPDATE HEALTH DATA
            </span>

            <h2>Enter Your Vitals</h2>

            <p>
              Date and time will be recorded automatically.
            </p>
          </div>

          <div className="section-icon">
            +
          </div>

        </div>


        <form onSubmit={saveVitals}>

          <div className="vitals-form-grid">

            {/* HEART RATE */}

            <div className="dark-input-group">

              <label>Heart Rate</label>

              <div className="dark-input-wrapper">

                <input
                  type="number"
                  name="heartRate"
                  value={form.heartRate}
                  onChange={handleChange}
                  placeholder="72"
                />

                <span>BPM</span>

              </div>

            </div>


            {/* SPO2 */}

            <div className="dark-input-group">

              <label>SpO₂</label>

              <div className="dark-input-wrapper">

                <input
                  type="number"
                  name="spo2"
                  value={form.spo2}
                  onChange={handleChange}
                  placeholder="98"
                />

                <span>%</span>

              </div>

            </div>


            {/* TEMPERATURE */}

            <div className="dark-input-group">

              <label>Temperature</label>

              <div className="dark-input-wrapper">

                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={form.temperature}
                  onChange={handleChange}
                  placeholder="36.7"
                />

                <span>°C</span>

              </div>

            </div>


            {/* BLOOD PRESSURE */}

            <div className="dark-input-group">

              <label>Blood Pressure</label>

              <div className="dark-input-wrapper">

                <input
                  type="text"
                  name="bloodPressure"
                  value={form.bloodPressure}
                  onChange={handleChange}
                  placeholder="120/80"
                />

                <span>mmHg</span>

              </div>

            </div>

          </div>


          <button
            type="submit"
            className="save-vitals-btn"
          >
            ✓ Save Vitals
          </button>

        </form>

      </div>


      {/* CURRENT VITALS */}

      <div className="dark-section-heading">

        <div>
          <span>LIVE HEALTH SNAPSHOT</span>
          <h2>Current Vitals</h2>
        </div>

        {history.length > 0 && (
          <small>
            Last updated: {history[0].date} • {history[0].time}
          </small>
        )}

      </div>


      <div className="dark-vitals-grid">

        <VitalCard
          icon="♥"
          title="Heart Rate"
          value={vitals.heartRate}
          unit="BPM"
          className="heart"
        />

        <VitalCard
          icon="O₂"
          title="Oxygen Level"
          value={vitals.spo2}
          unit="%"
          className="oxygen"
        />

        <VitalCard
          icon="°"
          title="Temperature"
          value={vitals.temperature}
          unit="°C"
          className="temperature"
        />

        <VitalCard
          icon="BP"
          title="Blood Pressure"
          value={vitals.bloodPressure}
          unit=""
          className="pressure"
        />

      </div>


      {/* HISTORY */}

      <div className="dark-history-card">

        <div className="section-top">

          <div>
            <span className="dark-eyebrow">
              RECENT READINGS
            </span>

            <h2>Vitals History</h2>

            <p>
              Every reading is automatically saved with its date and time.
            </p>
          </div>

        </div>


        {history.length === 0 ? (

          <div className="dark-empty-history">

            <div>♥</div>

            <h3>No readings yet</h3>

            <p>
              Enter your health values above and click
              <strong> Save Vitals </strong>
              to create your first record.
            </p>

          </div>

        ) : (

          <div className="dark-table-wrapper">

            <div className="dark-table-row dark-table-head">

              <span>Date</span>
              <span>Time</span>
              <span>Heart Rate</span>
              <span>SpO₂</span>
              <span>Temperature</span>
              <span>Blood Pressure</span>

            </div>


            {history.map((item) => (

              <div
                className="dark-table-row"
                key={item.id}
              >

                <span>{item.date}</span>

                <span>{item.time}</span>

                <span>{item.heartRate} BPM</span>

                <span>{item.spo2}%</span>

                <span>{item.temperature}°C</span>

                <span>{item.bloodPressure}</span>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}


/* VITAL CARD */

function VitalCard({
  icon,
  title,
  value,
  unit,
  className,
}) {
  return (
    <div className={`dark-vital-card ${className}`}>

      <div className="vital-card-header">

        <div className="vital-icon">
          {icon}
        </div>

        <span className="normal-tag">
          NORMAL
        </span>

      </div>

      <span className="vital-title">
        {title}
      </span>

      <div className="vital-value">

        {value}

        <small>
          {unit}
        </small>

      </div>

      <div className="vital-bar">
        <span></span>
      </div>

    </div>
  );
}

export default Vitals;