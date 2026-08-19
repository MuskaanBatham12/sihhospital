import React, { useEffect, useState } from "react";

function History() {
  const [vitalsHistory, setVitalsHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("vaidya_vitals_history");

    if (saved) {
      setVitalsHistory(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="dark-history-page">

      {/* HEADER */}

      <div className="history-main-header">

        <div>
          <span className="dark-eyebrow">
            VAIDYA AI • PATIENT RECORD
          </span>

          <h1>My Health History</h1>

          <p>
            Your health and physiotherapy activity in one place.
          </p>
        </div>

        <div className="history-count-box">

          <strong>
            {vitalsHistory.length}
          </strong>

          <span>
            Vital Records
          </span>

        </div>

      </div>


      {/* TWO CATEGORIES */}

      <div className="history-category-grid">

        <div className="history-category">

          <div className="category-icon vitals">
            ♥
          </div>

          <div>
            <span>HEALTH MONITORING</span>

            <h3>
              Vitals History
            </h3>

            <p>
              Heart rate, SpO₂, temperature and blood pressure readings.
            </p>
          </div>

        </div>


        <div className="history-category">

          <div className="category-icon physio">
            ◎
          </div>

          <div>
            <span>RECOVERY & EXERCISE</span>

            <h3>
              Physiotherapy History
            </h3>

            <p>
              Exercise sessions, repetitions, accuracy and feedback.
            </p>
          </div>

        </div>

      </div>


      {/* VITAL HISTORY */}

      <section className="history-content-card">

        <div className="history-content-header">

          <div>
            <span>HEALTH MONITORING</span>

            <h2>
              Vitals History
            </h2>
          </div>

          <div className="record-badge">
            {vitalsHistory.length} Records
          </div>

        </div>


        {vitalsHistory.length === 0 ? (

          <div className="history-empty">

            <div className="empty-icon">
              ♥
            </div>

            <h3>
              No health records yet
            </h3>

            <p>
              Your readings will automatically appear here
              when you update your vitals.
            </p>

          </div>

        ) : (

          <div className="history-table-container">

            <div className="history-table-row history-table-header">

              <span>Date</span>
              <span>Time</span>
              <span>Heart Rate</span>
              <span>SpO₂</span>
              <span>Temperature</span>
              <span>Blood Pressure</span>

            </div>


            {vitalsHistory.map((record) => (

              <div
                className="history-table-row"
                key={record.id}
              >

                <span>
                  {record.date}
                </span>

                <span>
                  {record.time}
                </span>

                <span>
                  <b>{record.heartRate}</b> BPM
                </span>

                <span>
                  <b>{record.spo2}</b>%
                </span>

                <span>
                  <b>{record.temperature}</b>°C
                </span>

                <span>
                  <b>{record.bloodPressure}</b>
                </span>

              </div>

            ))}

          </div>

        )}

      </section>


      {/* PHYSIOTHERAPY */}

      <section className="history-content-card">

        <div className="history-content-header">

          <div>
            <span>RECOVERY & EXERCISE</span>

            <h2>
              Physiotherapy History
            </h2>
          </div>

          <div className="record-badge purple">
            Coming from sessions
          </div>

        </div>


        <div className="history-empty physio-empty">

          <div className="empty-icon purple-icon">
            ◎
          </div>

          <h3>
            No physiotherapy sessions yet
          </h3>

          <p>
            Once you complete a physiotherapy session,
            your exercise progress and feedback will appear here.
          </p>

        </div>

      </section>

    </div>
  );
}

export default History;