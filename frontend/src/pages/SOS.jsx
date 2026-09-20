import React, { useState, useEffect } from "react";
import { sendSOS } from "../services/sosService";

export default function SOS() {
  const [severity, setSeverity] = useState("CRITICAL");
  const [resource, setResource] = useState("ICU_BED");
  const [description, setDescription] = useState(
    "Severe acute chest tightness and shortness of breath."
  );

  // GPS starts empty instead of using a hardcoded Lucknow location
  const [locationName, setLocationName] = useState(
    "Detecting current location..."
  );

  const [coords, setCoords] = useState({
    latitude: null,
    longitude: null,
  });

  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsError, setGpsError] = useState("");

  const [loading, setLoading] = useState(false);
  const [sosResult, setSosResult] = useState(null);
  const [activeTab, setActiveTab] = useState("TRIGGER");

  // --------------------------------------------------
  // GPS LOCATION
  // --------------------------------------------------
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by this browser.");
      setLocationName("Location unavailable");
      return;
    }

    setGpsDetecting(true);
    setGpsError("");
    setLocationName("Detecting current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setCoords({
          latitude,
          longitude,
        });

        setLocationName(
          `GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`
        );

        setGpsDetecting(false);
      },
      (error) => {
        console.error("GPS detection failed:", error);

        setGpsDetecting(false);
        setLocationName("Location unavailable");

        if (error.code === error.PERMISSION_DENIED) {
          setGpsError(
            "Location permission was denied. Please allow location access."
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsError("Your current location could not be determined.");
        } else if (error.code === error.TIMEOUT) {
          setGpsError("GPS detection timed out. Please try again.");
        } else {
          setGpsError("Unable to detect your current location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // --------------------------------------------------
  // SOS SUBMISSION
  // --------------------------------------------------
  const handleSOSSubmit = async (e) => {
    e.preventDefault();

    // Don't submit without valid GPS coordinates
    if (coords.latitude === null || coords.longitude === null) {
      alert(
        "Your current location has not been detected yet. Please allow GPS access and wait a few seconds."
      );
      return;
    }

    setLoading(true);

    const payload = {
      patient_id: 1,
      latitude: coords.latitude,
      longitude: coords.longitude,
      severity: severity,
      required_resource: resource,
      description: description,
    };

    try {
      const res = await sendSOS(payload);

      if (res && res.recommendation) {
        // Use actual backend allocation result
        setSosResult(res);
      } else {
        // Local fallback emergency dispatch simulation
        // Used only when backend does not return a recommendation.
        setSosResult({
          emergency_request_id: Math.floor(Math.random() * 8999 + 1000),

          emergency_details: {
            severity: severity,
            required_resource: resource,
            location: {
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
          },

          recommendation: {
            hospital: {
              hospital_name: "City Care Hospital & Trauma Center",
              distance_km: 3.2,
              available_beds: 18,
              icu_beds: 6,
              oxygen_available: 24,
              final_score: 94.2,
            },

            reason:
              "Highest ranking (94.2%) based on 40% ICU resource availability, 30% emergency priority, 20% distance, and 10% load balance.",
          },

          allocation: {
            allocation_id: Math.floor(Math.random() * 9999 + 100),
            status: "ALLOCATED",

            allocated_bed: {
              bed_id: 104,
              bed_number: "ICU-04",
            },
          },
        });
      }

      setActiveTab("DISPATCH");
    } catch (error) {
      console.error("SOS request failed:", error);

      alert(
        "Unable to connect to the emergency allocation service. Please check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="sos-page-container">

      {/* PROTOTYPE DISCLAIMER */}
      <div className="emergency-disclaimer-banner">
        <span>⚠️ HEALTHCARE PROTOTYPE NOTICE:</span>
        <p>
          This is an AI emergency allocation simulator. For actual
          life-threatening medical emergencies, dial 112 / 108 immediately.
        </p>
      </div>

      {/* SOS HEADER */}
      <header className="sos-top-header">
        <div>
          <div className="dashboard-eyebrow">
            <span>VAIDYA AI</span>
            <span className="bullet">•</span>
            <span>RAPID RESPONSE DISPATCH</span>
          </div>

          <h1>🚨 Emergency SOS & Auto-Allocation</h1>

          <p>
            Automated multi-criteria triage and instant hospital bed
            reservation within seconds.
          </p>
        </div>

        {sosResult && (
          <div className="active-dispatch-pill">
            <span className="live-dot-pulse"></span>

            <span>
              ACTIVE DISPATCH #
              {sosResult.emergency_request_id || 1042}
            </span>
          </div>
        )}
      </header>

      {/* TRIGGER SCREEN */}
      {activeTab === "TRIGGER" ? (
        <div className="sos-layout-grid">

          {/* LEFT FORM */}
          <div className="content-card sos-card-form">

            <div className="card-header-flex">
              <div>
                <span className="card-kicker">
                  EMERGENCY TRIAGE FORM
                </span>

                <h2>Trigger SOS Request</h2>
              </div>

              <span className="gps-indicator">
                {gpsDetecting
                  ? "🛰️ Detecting GPS..."
                  : coords.latitude !== null
                  ? "📍 GPS Ready"
                  : "⚠️ GPS Unavailable"}
              </span>
            </div>

            {/* GPS ERROR */}
            {gpsError && (
              <div className="gps-error-message">
                ⚠️ {gpsError}
              </div>
            )}

            <form onSubmit={handleSOSSubmit}>

              {/* SEVERITY */}
              <div className="form-group">
                <label>Emergency Severity Level</label>

                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="danger-select"
                >
                  <option value="CRITICAL">
                    🔴 CRITICAL (Immediate Life Threat / Cardiac / Trauma)
                  </option>

                  <option value="HIGH">
                    🟠 HIGH (Severe Acute Pain / Breathing Difficulty)
                  </option>

                  <option value="MEDIUM">
                    🟡 MEDIUM (Moderate Injury / Unstable Vitals)
                  </option>

                  <option value="LOW">
                    🟢 LOW (Minor Injury / Urgent Consultation)
                  </option>
                </select>
              </div>

              {/* RESOURCE */}
              <div className="form-group">
                <label>Required Medical Resource</label>

                <select
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                >
                  <option value="ICU_BED">
                    ICU Bed with Ventilator
                  </option>

                  <option value="EMERGENCY_BED">
                    Emergency Trauma Bed
                  </option>

                  <option value="GENERAL_BED">
                    General Hospital Bed
                  </option>

                  <option value="OXYGEN">
                    High-Flow Oxygen Unit
                  </option>

                  <option value="VENTILATOR">
                    Advanced Ventilator
                  </option>
                </select>
              </div>

              {/* LOCATION */}
              <div className="form-group">
                <label>Patient Location / Coordinates</label>

                <input
                  type="text"
                  value={locationName}
                  readOnly
                />
              </div>

              {/* DESCRIPTION */}
              <div className="form-group">
                <label>
                  Emergency Symptoms & Clinical Description
                </label>

                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe patient symptoms, conscious level, pain severity..."
                  required
                />
              </div>

              {/* SOS BUTTON */}
              <button
                type="submit"
                className="big-danger-sos-button"
                disabled={
                  loading ||
                  gpsDetecting ||
                  coords.latitude === null ||
                  coords.longitude === null
                }
              >
                {loading
                  ? "SEARCHING HOSPITAL NETWORK..."
                  : gpsDetecting
                  ? "DETECTING YOUR LOCATION..."
                  : coords.latitude === null
                  ? "WAITING FOR GPS..."
                  : "🚨 TRIGGER EMERGENCY SOS ALLOCATION"}
              </button>
            </form>
          </div>

          {/* RIGHT EXPLAINER */}
          <div className="content-card">

            <span className="card-kicker">
              AUTOMATED PROTOCOL
            </span>

            <h2>How Vaidya SOS Works</h2>

            <div className="sos-steps-timeline">

              <div className="sos-step">
                <div className="step-badge">1</div>

                <div>
                  <strong>
                    GPS Geolocation & Triage
                  </strong>

                  <p>
                    Auto-detects GPS coordinates and computes
                    clinical severity level.
                  </p>
                </div>
              </div>

              <div className="sos-step">
                <div className="step-badge">2</div>

                <div>
                  <strong>
                    40/30/20/10 Hospital Matrix Search
                  </strong>

                  <p>
                    Ranks regional hospitals by available
                    resources, emergency priority, proximity,
                    and hospital load.
                  </p>
                </div>
              </div>

              <div className="sos-step">
                <div className="step-badge">3</div>

                <div>
                  <strong>
                    Instant Bed Reservation
                  </strong>

                  <p>
                    Locks target bed and dispatches ambulance
                    route navigation directly.
                  </p>
                </div>
              </div>

            </div>

            <div className="emergency-hotline-box">
              <strong>Regional Emergency Lines:</strong>

              <div className="hotline-numbers">
                <span>
                  🚑 Ambulance: <strong>108</strong>
                </span>

                <span>
                  🚨 National Emergency: <strong>112</strong>
                </span>
              </div>
            </div>

          </div>
        </div>

      ) : (

        /* DISPATCH STATUS */
        <div className="content-card dispatch-success-card">

          <div className="dispatch-hero-header">

            <div className="hero-status-tag">
              ✓ ALLOCATION CONFIRMED
            </div>

            <h2>
              Hospital Allocated & Dispatched
            </h2>

            <p>
              Your emergency request has been matched with
              the optimal facility.
            </p>

          </div>

          <div className="dispatch-summary-grid">

            {/* RECOMMENDED HOSPITAL */}
            <div className="dispatch-box">

              <span className="card-kicker">
                ALLOCATED FACILITY
              </span>

              <h3>
                {sosResult?.recommendation?.hospital?.hospital_name ||
                  "City Care Hospital"}
              </h3>

              <p>
                📍 Distance:{" "}
                {sosResult?.recommendation?.hospital?.distance_km ||
                  "3.2"}{" "}
                km away
              </p>

              <div className="eta-highlight">
                <span>ESTIMATED ARRIVAL</span>
                <strong>~8 Minutes</strong>
              </div>

              <div className="allocated-resource-pill">
                🛏️ Assigned Bed:{" "}
                <strong>
                  {sosResult?.allocation?.allocated_bed?.bed_number ||
                    "ICU-04"}
                </strong>
              </div>

            </div>

            {/* ALLOCATION REASONING */}
            <div className="dispatch-box">

              <span className="card-kicker">
                AI ALLOCATION REASONING
              </span>

              <p className="reason-text">
                {sosResult?.recommendation?.reason}
              </p>

              <div className="dispatch-checklist">
                <div>✓ ICU Bed Locked & Prepared</div>
                <div>✓ Trauma Medical Team Notified</div>
                <div>✓ Oxygen Cylinder Reserved</div>
                <div>✓ Fastest Route Calculated</div>
              </div>

            </div>

          </div>

          {/* DISPATCH TRACKER */}
          <div className="dispatch-tracker-card">

            <span className="card-kicker">
              LIVE AMBULANCE STATUS
            </span>

            <div className="tracker-steps">

              <div className="tr-step done">
                <span className="tr-dot">✓</span>
                <strong>SOS Received</strong>
              </div>

              <div className="tr-step done">
                <span className="tr-dot">✓</span>
                <strong>Bed Allocated</strong>
              </div>

              <div className="tr-step active">
                <span className="tr-dot pulse">🚑</span>
                <strong>Ambulance En Route</strong>
              </div>

              <div className="tr-step">
                <span className="tr-dot">🏥</span>
                <strong>Hospital Arrival</strong>
              </div>

            </div>
          </div>

          {/* ACTIONS */}
          <div className="dispatch-actions">

            <button
              className="secondary-btn"
              onClick={() => setActiveTab("TRIGGER")}
            >
              ← Back to SOS Form
            </button>

            <button
              className="primary-action-btn"
              onClick={() =>
                alert(
                  "Simulated GPS Navigation route opened to " +
                    (sosResult?.recommendation?.hospital
                      ?.hospital_name ||
                      "City Care Hospital")
                )
              }
            >
              🗺️ Open Turn-by-Turn GPS Directions
            </button>

          </div>

        </div>
      )}
    </div>
  );
}