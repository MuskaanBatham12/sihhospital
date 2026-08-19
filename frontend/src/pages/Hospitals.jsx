import React, { useMemo, useState } from "react";

const hospitals = [
  {
    id: 1,
    name: "City Care Hospital",
    type: "Multi-Speciality",
    distance: "3.2 km",
    rating: "4.8",
    status: "Available",
    beds: 18,
    icu: 6,
    oxygen: 24,
    ambulance: 3,
    specialties: ["Cardiology", "Emergency", "Orthopedics"],
    load: 42,
    match: 94,
  },
  {
    id: 2,
    name: "Metro Health Center",
    type: "Emergency & Trauma",
    distance: "5.7 km",
    rating: "4.6",
    status: "Limited",
    beds: 9,
    icu: 2,
    oxygen: 11,
    ambulance: 2,
    specialties: ["Trauma", "Neurology", "Emergency"],
    load: 71,
    match: 88,
  },
  {
    id: 3,
    name: "Apollo Medical Center",
    type: "Advanced Care",
    distance: "8.4 km",
    rating: "4.7",
    status: "Available",
    beds: 31,
    icu: 9,
    oxygen: 38,
    ambulance: 4,
    specialties: ["Cardiology", "Neurology", "Oncology"],
    load: 36,
    match: 86,
  },
  {
    id: 4,
    name: "Sunrise Hospital",
    type: "General Hospital",
    distance: "11.2 km",
    rating: "4.5",
    status: "Critical",
    beds: 3,
    icu: 0,
    oxygen: 4,
    ambulance: 1,
    specialties: ["General", "Orthopedics"],
    load: 92,
    match: 64,
  },
];

const activities = [
  {
    icon: "🟢",
    title: "City Care Hospital",
    text: "ICU bed became available",
    time: "12 sec ago",
  },
  {
    icon: "🟡",
    title: "Metro Health Center",
    text: "Emergency capacity is limited",
    time: "42 sec ago",
  },
  {
    icon: "🔵",
    title: "Ambulance Network",
    text: "Ambulance A-17 is available",
    time: "1 min ago",
  },
  {
    icon: "🟢",
    title: "Apollo Medical Center",
    text: "Oxygen resources updated",
    time: "2 min ago",
  },
];

export default function Hospitals() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showAllocation, setShowAllocation] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [priority, setPriority] = useState("HIGH");
  const [allocated, setAllocated] = useState(false);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((hospital) => {
      const matchesSearch =
        hospital.name.toLowerCase().includes(search.toLowerCase()) ||
        hospital.type.toLowerCase().includes(search.toLowerCase()) ||
        hospital.specialties.some((item) =>
          item.toLowerCase().includes(search.toLowerCase())
        );

      const matchesFilter =
        filter === "All" || hospital.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const handleAllocation = (hospital) => {
    setSelectedHospital(hospital);
    setShowAllocation(true);
    setAllocated(false);
  };

  return (
    <div className="hospital-page">

      {/* HEADER */}
      <div className="hospital-topbar">
        <div>
          <div className="eyebrow">
            VAIDYA AI <span>•</span> SMART HEALTHCARE
          </div>

          <h1>Virtual Hospital</h1>

          <p>
            Find hospitals, monitor resources and get intelligent emergency
            assistance in one place.
          </p>
        </div>

        <div className="system-status">
          <span className="pulse-dot"></span>
          <div>
            <strong>Network Operational</strong>
            <small>24 hospitals online</small>
          </div>
        </div>
      </div>

      {/* EMERGENCY HERO */}
      <section className="hospital-hero">

        <div className="hero-content">
          <span className="hero-badge">⚡ SMART HOSPITAL ASSISTANCE</span>

          <h2>
            The right care,
            <br />
            <span>when every second matters.</span>
          </h2>

          <p>
            Vaidya AI intelligently helps you discover suitable hospitals
            based on availability, emergency priority, resources and distance.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={() =>
                document
                  .getElementById("hospital-network")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Find Hospital →
            </button>

            <button
              className="danger-btn"
              onClick={() => setShowSOS(true)}
            >
              🚨 Emergency SOS
            </button>
          </div>
        </div>

        <div className="emergency-card">
          <div className="emergency-card-header">
            <div>
              <span className="mini-label">EMERGENCY NETWORK</span>
              <h3>System Ready</h3>
            </div>

            <div className="live-badge">
              <span></span> LIVE
            </div>
          </div>

          <div className="emergency-grid">
            <div>
              <strong>24</strong>
              <span>Hospitals</span>
            </div>

            <div>
              <strong>128</strong>
              <span>Available Beds</span>
            </div>

            <div>
              <strong>24</strong>
              <span>ICU Beds</span>
            </div>

            <div>
              <strong>8</strong>
              <span>Ambulances</span>
            </div>
          </div>
        </div>

      </section>

      {/* QUICK STATS */}
      <section className="resource-strip">

        <div className="resource-card">
          <div className="resource-icon blue">🛏️</div>
          <div>
            <span>GENERAL BEDS</span>
            <strong>128</strong>
            <small>Available now</small>
          </div>
        </div>

        <div className="resource-card">
          <div className="resource-icon purple">🏥</div>
          <div>
            <span>ICU CAPACITY</span>
            <strong>24</strong>
            <small>Critical care beds</small>
          </div>
        </div>

        <div className="resource-card">
          <div className="resource-icon cyan">🫁</div>
          <div>
            <span>OXYGEN</span>
            <strong>76</strong>
            <small>Units available</small>
          </div>
        </div>

        <div className="resource-card">
          <div className="resource-icon green">🚑</div>
          <div>
            <span>AMBULANCES</span>
            <strong>8</strong>
            <small>Ready for dispatch</small>
          </div>
        </div>

      </section>

      {/* SEARCH + FILTER */}
      <section id="hospital-network" className="network-section">

        <div className="section-heading">
          <div>
            <span className="section-kicker">HOSPITAL NETWORK</span>
            <h2>Find the right hospital</h2>
            <p>
              Search and filter hospitals based on their current availability.
            </p>
          </div>

          <div className="hospital-count">
            <strong>{filteredHospitals.length}</strong>
            <span>facilities found</span>
          </div>
        </div>

        <div className="search-filter-bar">

          <div className="hospital-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search hospital, specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-buttons">
            {["All", "Available", "Limited", "Critical"].map((item) => (
              <button
                key={item}
                className={filter === item ? "active-filter" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>

        </div>

        {/* MAIN NETWORK GRID */}
        <div className="hospital-layout">

          {/* MAP */}
          <div className="map-card">

            <div className="map-header">
              <div>
                <span className="section-kicker">LIVE NETWORK</span>
                <h3>Nearby Hospitals</h3>
              </div>

              <span className="map-location">📍 Lucknow</span>
            </div>

            <div className="fake-map">

              <div className="map-grid"></div>

              <div className="map-road road-one"></div>
              <div className="map-road road-two"></div>
              <div className="map-road road-three"></div>

              {filteredHospitals.map((hospital, index) => (
                <button
                  key={hospital.id}
                  className={`map-marker marker-${index + 1}`}
                  onClick={() => setSelectedHospital(hospital)}
                  title={hospital.name}
                >
                  <span>+</span>
                </button>
              ))}

              <div className="map-center">
                <span>●</span>
                You
              </div>

              <div className="map-legend">
                <span>
                  <i className="legend-green"></i> Available
                </span>
                <span>
                  <i className="legend-yellow"></i> Limited
                </span>
                <span>
                  <i className="legend-red"></i> Critical
                </span>
              </div>

            </div>
          </div>

          {/* AI RECOMMENDATION */}
          <div className="recommendation-card">

            <div className="ai-heading">
              <div className="ai-icon">✦</div>
              <div>
                <span>VAIDYA AI</span>
                <h3>Smart Recommendation</h3>
              </div>
            </div>

            <p className="recommendation-text">
              Based on emergency priority, hospital load, available resources
              and distance.
            </p>

            <div className="match-card">

              <div className="match-top">
                <div>
                  <span className="recommended-label">
                    ✦ RECOMMENDED
                  </span>
                  <h3>City Care Hospital</h3>
                  <p>3.2 km away • ⭐ 4.8</p>
                </div>

                <div className="match-score">
                  <strong>94%</strong>
                  <span>Match</span>
                </div>
              </div>

              <div className="match-reasons">
                <div>✓ ICU available</div>
                <div>✓ Oxygen available</div>
                <div>✓ Emergency active</div>
                <div>✓ Low hospital load</div>
              </div>

              <button
                className="allocate-btn"
                onClick={() => handleAllocation(hospitals[0])}
              >
                Allocate Patient →
              </button>

            </div>

            <div className="priority-box">
              <div>
                <span>Emergency Priority</span>
                <strong>{priority}</strong>
              </div>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option>LOW</option>
                <option>MEDIUM</option>
                <option>HIGH</option>
                <option>CRITICAL</option>
              </select>
            </div>

          </div>

        </div>

      </section>

      {/* HOSPITAL CARDS */}
      <section className="hospital-list-section">

        <div className="section-heading">
          <div>
            <span className="section-kicker">AVAILABLE FACILITIES</span>
            <h2>Hospital network</h2>
          </div>
        </div>

        <div className="hospital-cards">

          {filteredHospitals.map((hospital) => (

            <article className="hospital-card" key={hospital.id}>

              <div className="hospital-card-top">

                <div className="hospital-logo">
                  +
                </div>

                <span
                  className={`status-pill ${hospital.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  ● {hospital.status}
                </span>

              </div>

              <h3>{hospital.name}</h3>

              <p className="hospital-type">
                {hospital.type}
              </p>

              <div className="hospital-meta">
                <span>📍 {hospital.distance}</span>
                <span>⭐ {hospital.rating}</span>
              </div>

              <div className="hospital-resources">

                <div>
                  <strong>{hospital.beds}</strong>
                  <span>Beds</span>
                </div>

                <div>
                  <strong>{hospital.icu}</strong>
                  <span>ICU</span>
                </div>

                <div>
                  <strong>{hospital.oxygen}</strong>
                  <span>O₂</span>
                </div>

              </div>

              <div className="specialties">
                {hospital.specialties.map((specialty) => (
                  <span key={specialty}>{specialty}</span>
                ))}
              </div>

              <div className="hospital-actions">

                <button
                  className="secondary-btn"
                  onClick={() => setSelectedHospital(hospital)}
                >
                  View Details
                </button>

                <button
                  className="small-allocate"
                  onClick={() => handleAllocation(hospital)}
                >
                  Allocate
                </button>

              </div>

            </article>

          ))}

        </div>

      </section>

      {/* ACTIVITY */}
      <section className="activity-section">

        <div className="activity-card">

          <div className="section-heading compact">
            <div>
              <span className="section-kicker">NETWORK ACTIVITY</span>
              <h2>Live hospital updates</h2>
            </div>

            <span className="live-badge">
              <span></span> LIVE
            </span>
          </div>

          <div className="activity-list">

            {activities.map((activity, index) => (
              <div className="activity-item" key={index}>

                <div className="activity-icon">
                  {activity.icon}
                </div>

                <div className="activity-content">
                  <strong>{activity.title}</strong>
                  <span>{activity.text}</span>
                </div>

                <time>{activity.time}</time>

              </div>
            ))}

          </div>

        </div>

        {/* PATIENT JOURNEY */}
        <div className="journey-card">

          <span className="section-kicker">SMART CARE FLOW</span>

          <h2>Patient Journey</h2>

          <div className="journey">

            {[
              "Request",
              "Assessment",
              "Matching",
              "Resources",
              "Allocation",
              "Consultation",
            ].map((step, index) => (

              <div
                className={`journey-step ${
                  index === 0 ? "current" : ""
                }`}
                key={step}
              >

                <div className="journey-number">
                  {index + 1}
                </div>

                <span>{step}</span>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* HOSPITAL DRAWER */}
      {selectedHospital && !showAllocation && (
        <div
          className="overlay"
          onClick={() => setSelectedHospital(null)}
        >
          <aside
            className="hospital-drawer"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="close-btn"
              onClick={() => setSelectedHospital(null)}
            >
              ×
            </button>

            <div className="drawer-logo">+</div>

            <span
              className={`status-pill ${selectedHospital.status
                .toLowerCase()
                .replace(" ", "-")}`}
            >
              ● {selectedHospital.status}
            </span>

            <h2>{selectedHospital.name}</h2>

            <p>{selectedHospital.type}</p>

            <div className="drawer-rating">
              ⭐ {selectedHospital.rating}
              <span>• {selectedHospital.distance}</span>
            </div>

            <div className="drawer-stats">

              <div>
                <strong>{selectedHospital.beds}</strong>
                <span>Beds</span>
              </div>

              <div>
                <strong>{selectedHospital.icu}</strong>
                <span>ICU</span>
              </div>

              <div>
                <strong>{selectedHospital.oxygen}</strong>
                <span>Oxygen</span>
              </div>

              <div>
                <strong>{selectedHospital.ambulance}</strong>
                <span>Ambulance</span>
              </div>

            </div>

            <h4>Specialties</h4>

            <div className="specialties">
              {selectedHospital.specialties.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <h4>Current Hospital Load</h4>

            <div className="load-bar">
              <span style={{ width: `${selectedHospital.load}%` }}></span>
            </div>

            <p className="load-text">
              {selectedHospital.load}% capacity currently in use
            </p>

            <div className="drawer-actions">

              <button
                className="allocate-btn"
                onClick={() => handleAllocation(selectedHospital)}
              >
                Request Allocation
              </button>

              <button className="secondary-btn">
                Get Directions
              </button>

            </div>

          </aside>
        </div>
      )}

      {/* ALLOCATION MODAL */}
      {showAllocation && selectedHospital && (
        <div className="overlay">

          <div className="modal-card">

            <button
              className="close-btn"
              onClick={() => setShowAllocation(false)}
            >
              ×
            </button>

            {!allocated ? (
              <>
                <div className="modal-icon">🏥</div>

                <span className="section-kicker">
                  SMART ALLOCATION
                </span>

                <h2>Allocate Patient?</h2>

                <p>
                  Request allocation at{" "}
                  <strong>{selectedHospital.name}</strong>.
                </p>

                <div className="allocation-summary">

                  <div>
                    <span>Priority</span>
                    <strong>{priority}</strong>
                  </div>

                  <div>
                    <span>Distance</span>
                    <strong>{selectedHospital.distance}</strong>
                  </div>

                  <div>
                    <span>ICU</span>
                    <strong>{selectedHospital.icu} available</strong>
                  </div>

                </div>

                <div className="modal-actions">

                  <button
                    className="secondary-btn"
                    onClick={() => setShowAllocation(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="allocate-btn"
                    onClick={() => setAllocated(true)}
                  >
                    Confirm Allocation
                  </button>

                </div>
              </>
            ) : (
              <div className="success-state">

                <div className="success-icon">✓</div>

                <h2>Allocation Request Created</h2>

                <p>
                  Demo allocation request has been successfully created for{" "}
                  <strong>{selectedHospital.name}</strong>.
                </p>

                <span className="demo-note">
                  DEMO MODE — backend integration pending
                </span>

                <button
                  className="allocate-btn"
                  onClick={() => {
                    setShowAllocation(false);
                    setSelectedHospital(null);
                  }}
                >
                  Done
                </button>

              </div>
            )}

          </div>

        </div>
      )}

      {/* SOS MODAL */}
      {showSOS && (
        <div className="overlay">

          <div className="sos-modal">

            <div className="sos-icon">🚨</div>

            <span className="section-kicker danger-text">
              EMERGENCY ASSISTANCE
            </span>

            <h2>Activate Emergency SOS?</h2>

            <p>
              This will start the emergency assistance flow in demo mode.
            </p>

            <div className="sos-warning">
              <strong>HIGH PRIORITY</strong>
              <span>Hospital matching will be initiated.</span>
            </div>

            <div className="modal-actions">

              <button
                className="secondary-btn"
                onClick={() => setShowSOS(false)}
              >
                Cancel
              </button>

              <button
                className="danger-btn"
                onClick={() => setShowSOS(false)}
              >
                Activate SOS
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}