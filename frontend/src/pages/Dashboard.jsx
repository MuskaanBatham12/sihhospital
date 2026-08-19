export default function Dashboard() {
  return (
    <div className="dashboard">

      <header className="dashboard-header">
        <div>
          <h1>VAIDYA AI</h1>
          <p>Your intelligent healthcare companion</p>
        </div>

        <button className="sos-button">
          🚨 Emergency SOS
        </button>
      </header>


      <section className="welcome-section">
        <h2>Good Morning 👋</h2>

        <p>
          Welcome back. Here's your health overview for today.
        </p>
      </section>


      <section className="stats-grid">

        <div className="stat-card">
          <h3>Heart Rate</h3>
          <strong>72</strong>
          <p>BPM • Normal</p>
        </div>

        <div className="stat-card">
          <h3>SpO₂</h3>
          <strong>98%</strong>
          <p>Oxygen level • Normal</p>
        </div>

        <div className="stat-card">
          <h3>Temperature</h3>
          <strong>98.4°</strong>
          <p>Fahrenheit • Normal</p>
        </div>

        <div className="stat-card">
          <h3>Physio Sessions</h3>
          <strong>08</strong>
          <p>Sessions completed</p>
        </div>

      </section>


      <section className="quick-actions">

        <h2>Quick Actions</h2>

        <div className="action-grid">

          <div className="action-card">
            <h3>🏥 Find Hospital</h3>
            <p>
              Find nearby hospitals and check available
              beds, oxygen and emergency resources.
            </p>
          </div>

          <div className="action-card">
            <h3>❤️ Check Vitals</h3>
            <p>
              Record your heart rate, SpO₂, temperature
              and keep track of your health.
            </p>
          </div>

          <div className="action-card">
            <h3>🧘 Physiotherapy</h3>
            <p>
              Start an AI-assisted physiotherapy session
              with real-time exercise analysis.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}