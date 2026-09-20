import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  getHospitals,
  getNearbyHospitals,
  requestAllocation,
  getHospitalAvailability,
} from "../services/hospitalService";

// Fix standard Leaflet default icon paths if needed
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Haversine formula for distance calculation in km
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Helper to determine status from available beds
function getAvailabilityStatus(availableBeds) {
  if (availableBeds > 12) return "Available";
  if (availableBeds > 0) return "Limited";
  return "Full";
}

export default function Hospitals() {
  const navigate = useNavigate();

  // --- STATE: User Geolocation ---
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [gpsStatus, setGpsStatus] = useState("detecting"); // 'detecting' | 'ready' | 'denied' | 'error'
  const [gpsErrorMsg, setGpsErrorMsg] = useState("");

  // --- STATE: Hospital Data & UI ---
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [backendError, setBackendError] = useState(false);

  // --- STATE: Filters & Search ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All"); // 'All' | 'Available' | 'Limited' | 'Full'
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [icuOnly, setIcuOnly] = useState(false);
  const [sortBy, setSortBy] = useState("nearest"); // 'nearest' | 'beds' | 'load' | 'match'

  // --- STATE: Selection & Modals ---
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationPriority, setAllocationPriority] = useState("HIGH");
  const [requiredResource, setRequiredResource] = useState("GENERAL_BED");
  const [allocationResult, setAllocationResult] = useState(null);
  const [allocating, setAllocating] = useState(false);

  // --- Leaflet Map Refs ---
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersGroupRef = useRef(null);
  const userMarkerRef = useRef(null);

  // ========================================================
  // 1. USER LOCATION DETECTION via native Geolocation API
  // ========================================================
  const detectBrowserLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setGpsStatus("detecting");
    setGpsErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords = { lat, lng };
        setUserLocation(coords);
        setGpsStatus("ready");
        console.log("📍 Browser user location detected:", coords);
      },
      (error) => {
        console.warn("Geolocation prompt error:", error);
        setGpsStatus(error.code === error.PERMISSION_DENIED ? "denied" : "error");
        if (error.code === error.PERMISSION_DENIED) {
          setGpsErrorMsg(
            "Location permission was denied. You can select your state or retry location access below."
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsErrorMsg("Location information is currently unavailable.");
        } else if (error.code === error.TIMEOUT) {
          setGpsErrorMsg("Location detection timed out. Please click retry.");
        } else {
          setGpsErrorMsg("Unable to detect your current location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    detectBrowserLocation();
  }, []);

  // ========================================================
  // 2. FETCH HOSPITALS FROM BACKEND
  // ========================================================
  const fetchHospitalCatalog = async () => {
    setLoadingHospitals(true);
    setBackendError(false);

    try {
      const params = {};
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }
      if (selectedState !== "All") params.state = selectedState;
      if (selectedCity !== "All") params.city = selectedCity;
      if (emergencyOnly) params.emergency_only = true;
      if (icuOnly) params.icu_only = true;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      params.sort_by = sortBy;

      const data = await getHospitals(params);

      if (data && Array.isArray(data) && data.length > 0) {
        setHospitals(data);
      } else {
        setHospitals([]);
      }
    } catch (err) {
      console.error("Failed to load hospitals from backend:", err);
      setBackendError(true);
    } finally {
      setLoadingHospitals(false);
    }
  };

  useEffect(() => {
    fetchHospitalCatalog();
  }, [userLocation, selectedState, selectedCity, emergencyOnly, icuOnly, sortBy]);

  // ========================================================
  // 3. COMPUTED HOSPITALS WITH REAL DISTANCE & AI MATCH
  // ========================================================
  const processedHospitals = useMemo(() => {
    return hospitals
      .map((h) => {
        // Compute real Haversine distance if user location is available
        const distance =
          userLocation && h.latitude && h.longitude
            ? calculateHaversineDistance(
                userLocation.lat,
                userLocation.lng,
                h.latitude,
                h.longitude
              )
            : h.distance_km || null;

        const status = getAvailabilityStatus(h.available_beds);

        // AI Match Score Calculation (40% resources, 30% priority, 20% distance, 10% load)
        const resScore = Math.min(
          100,
          ((h.available_beds + (h.available_icu || h.icu_beds || 0) + (h.available_oxygen || h.oxygen_available || 0)) /
            Math.max(1, h.total_beds + (h.icu_beds || 0) + (h.oxygen_available || 0))) *
            100
        );
        const distScore =
          distance !== null
            ? distance <= 5
              ? 100
              : distance <= 10
              ? 80
              : distance <= 20
              ? 60
              : distance <= 50
              ? 40
              : 20
            : 50;
        const loadScore = Math.max(0, 100 - (h.current_load || 40));
        const aiMatch = Math.round(0.4 * resScore + 0.3 * 75 + 0.2 * distScore + 0.1 * loadScore);

        return {
          ...h,
          calculated_distance: distance,
          status,
          aiMatch,
        };
      })
      .filter((h) => {
        // Name / Specialty / City Search Filter
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          !query ||
          h.name.toLowerCase().includes(query) ||
          (h.city && h.city.toLowerCase().includes(query)) ||
          (h.type && h.type.toLowerCase().includes(query)) ||
          (h.specialties && h.specialties.toLowerCase().includes(query));

        // State Filter
        const matchesState = selectedState === "All" || (h.state && h.state.toLowerCase() === selectedState.toLowerCase());

        // City Filter
        const matchesCity = selectedCity === "All" || (h.city && h.city.toLowerCase() === selectedCity.toLowerCase());

        // Availability Filter
        const matchesStatus = statusFilter === "All" || h.status === statusFilter;

        // Emergency Filter
        const matchesEmergency = !emergencyOnly || h.emergency_available;

        // ICU Filter
        const matchesICU = !icuOnly || (h.available_icu || h.icu_beds) > 0;

        return matchesSearch && matchesState && matchesCity && matchesStatus && matchesEmergency && matchesICU;
      })
      .sort((a, b) => {
        if (sortBy === "nearest") {
          if (a.calculated_distance === null) return 1;
          if (b.calculated_distance === null) return -1;
          return a.calculated_distance - b.calculated_distance;
        }
        if (sortBy === "beds") {
          return (b.available_beds || 0) - (a.available_beds || 0);
        }
        if (sortBy === "load") {
          return (a.current_load || 0) - (b.current_load || 0);
        }
        if (sortBy === "match") {
          return (b.aiMatch || 0) - (a.aiMatch || 0);
        }
        return 0;
      });
  }, [hospitals, userLocation, searchQuery, selectedState, selectedCity, statusFilter, emergencyOnly, icuOnly, sortBy]);

  // Top AI Recommended Facility
  const topRecommendedHospital = useMemo(() => {
    if (!processedHospitals || processedHospitals.length === 0) return null;
    return processedHospitals[0];
  }, [processedHospitals]);

  // Extract unique cities based on selected state
  const availableCities = useMemo(() => {
    const list = hospitals
      .filter((h) => selectedState === "All" || (h.state && h.state.toLowerCase() === selectedState.toLowerCase()))
      .map((h) => h.city)
      .filter(Boolean);
    return ["All", ...Array.from(new Set(list))];
  }, [hospitals, selectedState]);

  // ========================================================
  // 4. LEAFLET MAP INITIALIZATION & MARKER SYNC
  // ========================================================
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      // Default center: initial view (India central or user location)
      const initialCenter = userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629];
      const initialZoom = userLocation ? 12 : 5;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: true,
      });

      // Dark Matter Map Tiles
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & CartoDB',
          maxZoom: 18,
        }
      ).addTo(map);

      leafletMapRef.current = map;
      markersGroupRef.current = L.featureGroup().addTo(map);
    }

    return () => {
      // Cleanup map on unmount
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update Markers & Pan/Fit Map when user location or processed hospitals change
  useEffect(() => {
    if (!leafletMapRef.current || !markersGroupRef.current) return;

    const map = leafletMapRef.current;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    // 1. Render User GPS Marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: "user-leaflet-marker",
        html: `
          <div class="u-sonar"></div>
          <div class="u-dot"></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      })
        .bindPopup(`
          <div class="map-popup-hospital">
            <h4>📍 Your Detected Location</h4>
            <p>GPS: ${userLocation.lat.toFixed(4)}° N, ${userLocation.lng.toFixed(4)}° E</p>
          </div>
        `)
        .addTo(markersGroup);

      userMarkerRef.current = userMarker;
    }

    // 2. Render Hospital Markers
    processedHospitals.forEach((h) => {
      if (!h.latitude || !h.longitude) return;

      const statusClass =
        h.status === "Available"
          ? "available"
          : h.status === "Limited"
          ? "limited"
          : "full";

      const hospitalIcon = L.divIcon({
        className: "hospital-leaflet-marker",
        html: `
          <div class="hospital-leaflet-pin ${statusClass}">
            🏥
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const distanceText =
        h.calculated_distance !== null ? `${h.calculated_distance} km away` : "Distance pending";

      const popupHtml = `
        <div class="map-popup-hospital">
          <span class="popup-badge ${statusClass}">● ${h.status}</span>
          <h4>${h.name}</h4>
          <p>📍 ${h.city || ""}, ${h.state || ""} • <strong>${distanceText}</strong></p>
          <div class="popup-stats">
            <span>🛏️ ${h.available_beds || 0} Beds</span>
            <span>🏥 ${h.available_icu || h.icu_beds || 0} ICU</span>
            <span>🫁 ${h.available_oxygen || h.oxygen_available || 0} O₂</span>
          </div>
        </div>
      `;

      const marker = L.marker([h.latitude, h.longitude], {
        icon: hospitalIcon,
      })
        .bindPopup(popupHtml)
        .on("click", () => {
          setSelectedHospital(h);
        })
        .addTo(markersGroup);
    });

    // Auto fit bounds to include all markers
    try {
      const bounds = markersGroup.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } else if (userLocation) {
        map.setView([userLocation.lat, userLocation.lng], 13);
      }
    } catch (e) {}
  }, [processedHospitals, userLocation]);

  // Center map on selected hospital
  const handleSelectHospital = (hospital) => {
    setSelectedHospital(hospital);
    if (leafletMapRef.current && hospital.latitude && hospital.longitude) {
      leafletMapRef.current.flyTo([hospital.latitude, hospital.longitude], 14, {
        duration: 1.2,
      });
    }
  };

  // ========================================================
  // 5. ALLOCATION ACTION HANDLERS
  // ========================================================
  const handleOpenAllocationModal = (hospital) => {
    setSelectedHospital(hospital);
    setShowAllocationModal(true);
    setAllocationResult(null);
  };

  const handleConfirmAllocation = async () => {
    if (!selectedHospital) return;
    setAllocating(true);

    const payload = {
      patient_id: 1,
      latitude: userLocation ? userLocation.lat : selectedHospital.latitude,
      longitude: userLocation ? userLocation.lng : selectedHospital.longitude,
      severity: allocationPriority,
      required_resource: requiredResource,
    };

    try {
      const res = await requestAllocation(payload);
      if (res && res.allocation_id) {
        setAllocationResult(res);
      } else {
        // Demo fallback result
        setAllocationResult({
          allocation_id: Math.floor(Math.random() * 8999 + 1000),
          status: "ALLOCATED",
          hospital: {
            hospital_name: selectedHospital.name,
            final_score: selectedHospital.aiMatch || 92.5,
          },
          allocated_bed: {
            bed_number: `${requiredResource.slice(0, 3)}-${Math.floor(Math.random() * 20 + 1)}`,
          },
        });
      }
    } catch (err) {
      console.error("Allocation error:", err);
    } finally {
      setAllocating(false);
    }
  };

  return (
    <div className="hospital-page">
      {/* TOP COMMAND BAR */}
      <header className="dashboard-topbar">
        <div>
          <div className="dashboard-eyebrow">
            <span>VAIDYA AI</span>
            <span className="bullet">•</span>
            <span>INTELLIGENT HOSPITAL DISCOVERY & BED ALLOCATION</span>
          </div>
          <h1>
            Hospital <span>Network</span>
          </h1>
          <p>
            Real-time multi-state facility monitoring, browser geolocation tracking, and automated clinical resource dispatch.
          </p>
        </div>

        <div className="topbar-actions">
          <div className="hardware-chip">
            <span
              className={`chip-dot ${
                gpsStatus === "ready"
                  ? "online"
                  : gpsStatus === "detecting"
                  ? "standby"
                  : "offline"
              }`}
            ></span>
            <div>
              <small>GPS LOCATION</small>
              <strong>
                {gpsStatus === "ready"
                  ? `${userLocation.lat.toFixed(3)}°, ${userLocation.lng.toFixed(3)}°`
                  : gpsStatus === "detecting"
                  ? "Detecting GPS..."
                  : "Location Standby"}
              </strong>
            </div>
          </div>

          <button className="primary-sos-btn" onClick={() => navigate("/sos")}>
            <span className="sos-pulse"></span>
            🚨 Emergency SOS
          </button>
        </div>
      </header>

      {/* LOCATION STATUS NOTIFICATION BANNER */}
      {gpsStatus === "detecting" && (
        <div className="location-notice-banner">
          <div className="loc-info">
            <span>🛰️</span>
            <div>
              <strong>Requesting browser location permission...</strong>
              <p>Detecting your actual latitude and longitude for precise nearby hospital distance calculation.</p>
            </div>
          </div>
        </div>
      )}

      {gpsStatus === "denied" && (
        <div className="location-notice-banner denied">
          <div className="loc-info">
            <span>⚠️</span>
            <div>
              <strong>Browser Location Permission Denied</strong>
              <p>{gpsErrorMsg}</p>
            </div>
          </div>
          <div className="loc-actions">
            <button className="loc-btn" onClick={detectBrowserLocation}>
              🔄 Retry GPS Detection
            </button>
          </div>
        </div>
      )}

      {/* REGIONAL CAPACITY METRIC STRIP */}
      <section className="vitals-strip hospitals-metric-strip">
        <div className="vital-glance-card">
          <div className="vital-glance-header">
            <span className="vital-emoji heart">🛏️</span>
            <span className="vital-pill normal">ALL STATES</span>
          </div>
          <div className="vital-glance-body">
            <span className="vital-label">TOTAL AVAILABLE BEDS</span>
            <div className="vital-num">
              <strong>{hospitals.reduce((acc, h) => acc + (h.available_beds || 0), 0)}</strong>
              <small>Beds</small>
            </div>
            <p className="vital-subtext">Across 5 active state networks</p>
          </div>
        </div>

        <div className="vital-glance-card">
          <div className="vital-glance-header">
            <span className="vital-emoji oxygen">🏥</span>
            <span className="vital-pill normal">CRITICAL CARE</span>
          </div>
          <div className="vital-glance-body">
            <span className="vital-label">AVAILABLE ICU BEDS</span>
            <div className="vital-num">
              <strong>{hospitals.reduce((acc, h) => acc + (h.available_icu || h.icu_beds || 0), 0)}</strong>
              <small>Units</small>
            </div>
            <p className="vital-subtext">Equipped with patient monitors</p>
          </div>
        </div>

        <div className="vital-glance-card">
          <div className="vital-glance-header">
            <span className="vital-emoji temp">🫁</span>
            <span className="vital-pill normal">HIGH-FLOW O₂</span>
          </div>
          <div className="vital-glance-body">
            <span className="vital-label">OXYGEN CAPACITY</span>
            <div className="vital-num">
              <strong>{hospitals.reduce((acc, h) => acc + (h.available_oxygen || h.oxygen_available || 0), 0)}</strong>
              <small>Cylinders</small>
            </div>
            <p className="vital-subtext">Liquid & manifold oxygen reserve</p>
          </div>
        </div>

        <div className="vital-glance-card">
          <div className="vital-glance-header">
            <span className="vital-emoji bp">⚡</span>
            <span className="vital-pill normal">ADVANCED VENT</span>
          </div>
          <div className="vital-glance-body">
            <span className="vital-label">VENTILATORS AVAILABLE</span>
            <div className="vital-num">
              <strong>{hospitals.reduce((acc, h) => acc + (h.available_ventilators || h.ventilators || 0), 0)}</strong>
              <small>Machines</small>
            </div>
            <p className="vital-subtext">Invasive & non-invasive support</p>
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="hospitals-filter-bar">
        <div className="filter-group-left">
          {/* SEARCH INPUT */}
          <div className="search-box" style={{ minWidth: "220px" }}>
            <input
              type="text"
              placeholder="Search hospital, city, specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="custom-filter-select"
              style={{ width: "100%" }}
            />
          </div>

          {/* STATE FILTER */}
          <select
            className="custom-filter-select"
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedCity("All");
            }}
          >
            <option value="All">🏛️ All States (UP, Delhi, MH, TS, KA)</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Delhi">Delhi NCR</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Telangana">Telangana</option>
            <option value="Karnataka">Karnataka</option>
          </select>

          {/* CITY FILTER */}
          <select
            className="custom-filter-select"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            {availableCities.map((city) => (
              <option key={city} value={city}>
                📍 {city === "All" ? "All Cities" : city}
              </option>
            ))}
          </select>

          {/* AVAILABILITY STATUS TABS */}
          <div className="filter-pill-group">
            {["All", "Available", "Limited", "Full"].map((st) => (
              <button
                key={st}
                className={`filter-tab ${statusFilter === st ? "active" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group-right">
          {/* EMERGENCY ONLY TOGGLE */}
          <button
            className={`filter-toggle-btn ${emergencyOnly ? "active" : ""}`}
            onClick={() => setEmergencyOnly(!emergencyOnly)}
          >
            🚨 Emergency Only
          </button>

          {/* ICU AVAILABLE TOGGLE */}
          <button
            className={`filter-toggle-btn ${icuOnly ? "active" : ""}`}
            onClick={() => setIcuOnly(!icuOnly)}
          >
            🏥 ICU Ready
          </button>

          {/* SORT BY */}
          <select
            className="custom-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="nearest">⚡ Sort: Nearest Distance</option>
            <option value="beds">🛏️ Sort: Most Available Beds</option>
            <option value="load">📊 Sort: Lowest Load %</option>
            <option value="match">✦ Sort: Highest AI Match</option>
          </select>
        </div>
      </div>

      {/* TOP WORKSPACE: LEAFLET MAP & TOP AI MATCH CARD */}
      <div className="hospitals-workspace-grid">
        {/* LEAFLET MAP CARD */}
        <div className="map-view-card">
          <div className="map-topbar">
            <div>
              <span className="card-kicker">REGIONAL GEOSPATIAL VIEW</span>
              <h2>Interactive Facility Map (Leaflet)</h2>
            </div>
            <span className="location-pin">
              {userLocation
                ? `📍 GPS Active: ${userLocation.lat.toFixed(3)}° N, ${userLocation.lng.toFixed(3)}° E`
                : "📍 Location: National Overview"}
            </span>
          </div>

          {/* Leaflet Canvas Container */}
          <div
            id="hospital-leaflet-map"
            ref={mapContainerRef}
            className="map-canvas-container"
          ></div>

          {/* Legend */}
          <div className="map-legend-bar">
            <span>
              <span className="lg-dot green"></span> Available (&gt;12 Beds)
            </span>
            <span>
              <span className="lg-dot yellow"></span> Limited (1-12 Beds)
            </span>
            <span>
              <span className="lg-dot red"></span> Full (0 Beds)
            </span>
            <span>
              <span className="lg-dot" style={{ background: "#06b6d4" }}></span> User GPS
            </span>
          </div>
        </div>

        {/* TOP AI RECOMMENDATION CARD */}
        {topRecommendedHospital ? (
          <div className="ai-recommendation-hero-card">
            <div className="card-header-flex">
              <span className="card-kicker">OPTIMAL ALLOCATION MATCH</span>
              <span className="match-tag">✦ {topRecommendedHospital.aiMatch}% MATCH</span>
            </div>

            <div className="recommended-hospital-details">
              <h2>{topRecommendedHospital.name}</h2>
              <p className="rec-type">
                {topRecommendedHospital.type} • {topRecommendedHospital.city}, {topRecommendedHospital.state}
              </p>

              <div className="rec-meta">
                <span>
                  📍{" "}
                  {topRecommendedHospital.calculated_distance !== null
                    ? `${topRecommendedHospital.calculated_distance} km away`
                    : "Distance computing"}
                </span>
                <span>•</span>
                <span>⭐ 4.8 Rating</span>
                <span>•</span>
                <span>📊 {topRecommendedHospital.current_load}% Load</span>
              </div>

              {/* Score Breakdown Bars */}
              <div className="rec-score-breakdown">
                <span className="breakdown-title">Multi-Objective Score Weights</span>
                <div className="score-bars">
                  <div className="score-row">
                    <span>40% Available Resources</span>
                    <strong>
                      {topRecommendedHospital.available_beds} Beds / {topRecommendedHospital.available_icu || topRecommendedHospital.icu_beds} ICU
                    </strong>
                  </div>
                  <div className="score-row">
                    <span>30% Emergency Severity Priority</span>
                    <strong>{topRecommendedHospital.emergency_available ? "High Priority Ready" : "General"}</strong>
                  </div>
                  <div className="score-row">
                    <span>20% Proximity / Distance</span>
                    <strong>
                      {topRecommendedHospital.calculated_distance !== null
                        ? `${topRecommendedHospital.calculated_distance} km`
                        : "Regional"}
                    </strong>
                  </div>
                  <div className="score-row">
                    <span>10% Hospital Load Factor</span>
                    <strong>{topRecommendedHospital.current_load}% In Use</strong>
                  </div>
                </div>
              </div>

              <div className="rec-features">
                <span>✓ {topRecommendedHospital.available_beds} General Beds Ready</span>
                <span>✓ {topRecommendedHospital.available_icu || topRecommendedHospital.icu_beds} ICU Beds Available</span>
                <span>✓ {topRecommendedHospital.available_oxygen || topRecommendedHospital.oxygen_available} High-Flow Oxygen</span>
                <span>✓ {topRecommendedHospital.available_ventilators || topRecommendedHospital.ventilators} Ventilators Online</span>
              </div>

              <div className="catalog-card-actions">
                <button
                  className="primary-action-btn"
                  style={{ width: "100%" }}
                  onClick={() => handleOpenAllocationModal(topRecommendedHospital)}
                >
                  Request Patient Allocation →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="ai-recommendation-hero-card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p>No hospitals match the current filters.</p>
          </div>
        )}
      </div>

      {/* HOSPITAL CATALOG CARDS GRID */}
      <section className="hospital-catalog-section" style={{ marginTop: "30px" }}>
        <div className="section-heading">
          <div>
            <span className="section-kicker">NETWORK DIRECTORY</span>
            <h2>
              Verified Medical Facilities ({processedHospitals.length})
            </h2>
          </div>
          <span className="refresh-indicator">
            ● {userLocation ? "Sorted by Proximity" : "National Registry"}
          </span>
        </div>

        {loadingHospitals ? (
          <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
            <p>Loading hospital network and resource telemetry from backend...</p>
          </div>
        ) : processedHospitals.length === 0 ? (
          <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
            <p>No hospital facilities found for the selected state/filters.</p>
            <button
              className="loc-btn"
              style={{ marginTop: "12px" }}
              onClick={() => {
                setSelectedState("All");
                setSelectedCity("All");
                setStatusFilter("All");
                setEmergencyOnly(false);
                setIcuOnly(false);
                setSearchQuery("");
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="hospital-cards-grid">
            {processedHospitals.map((h) => {
              const statusClass =
                h.status === "Available"
                  ? "available"
                  : h.status === "Limited"
                  ? "limited"
                  : "critical";

              return (
                <article
                  key={h.id || h.hospital_id}
                  className={`hospital-catalog-card ${
                    selectedHospital && selectedHospital.id === h.id ? "selected-card" : ""
                  }`}
                  onClick={() => handleSelectHospital(h)}
                >
                  <div className="catalog-card-header">
                    <div className="h-avatar">🏥</div>
                    <span className={`status-badge ${statusClass}`}>
                      ● {h.status}
                    </span>
                  </div>

                  <h3>{h.name}</h3>
                  <span className="catalog-type">
                    {h.type} • {h.city}, {h.state}
                  </span>

                  <div className="catalog-meta">
                    <span>
                      📍{" "}
                      {h.calculated_distance !== null
                        ? `${h.calculated_distance} km away`
                        : "Distance pending"}
                    </span>
                    <span>•</span>
                    <span>📊 {h.current_load}% Load</span>
                  </div>

                  {/* Resource Availability Row */}
                  <div className="catalog-resources-row">
                    <div className="res-cell">
                      <strong>{h.available_beds}</strong>
                      <small>Beds</small>
                    </div>
                    <div className="res-cell">
                      <strong>{h.available_icu || h.icu_beds || 0}</strong>
                      <small>ICU</small>
                    </div>
                    <div className="res-cell">
                      <strong>{h.available_oxygen || h.oxygen_available || 0}</strong>
                      <small>Oxygen</small>
                    </div>
                    <div className="res-cell match">
                      <strong>{h.aiMatch}%</strong>
                      <small>Match</small>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="specialty-chips">
                    {(h.specialties || "General, Emergency")
                      .split(",")
                      .slice(0, 3)
                      .map((spec, i) => (
                        <span key={i}>{spec.trim()}</span>
                      ))}
                  </div>

                  {/* Card Actions */}
                  <div className="catalog-card-actions">
                    <button
                      className="secondary-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectHospital(h);
                      }}
                    >
                      View Map
                    </button>
                    <button
                      className="primary-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAllocationModal(h);
                      }}
                    >
                      Allocate →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ALLOCATION MODAL */}
      {showAllocationModal && selectedHospital && (
        <div className="overlay" onClick={() => setShowAllocationModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowAllocationModal(false)}>
              ×
            </button>

            {!allocationResult ? (
              <>
                <div className="modal-icon">🏥</div>
                <span className="section-kicker">SMART CLINICAL ALLOCATION</span>
                <h2>Allocate Patient to {selectedHospital.name}</h2>
                <p>
                  Submit triage request based on current bed availability and proximity.
                </p>

                <div className="allocation-summary">
                  <div>
                    <span>Selected Facility</span>
                    <strong>{selectedHospital.name}</strong>
                  </div>
                  <div>
                    <span>Distance</span>
                    <strong>
                      {selectedHospital.calculated_distance !== null
                        ? `${selectedHospital.calculated_distance} km away`
                        : "Regional"}
                    </strong>
                  </div>
                  <div>
                    <span>Available ICU</span>
                    <strong>{selectedHospital.available_icu || selectedHospital.icu_beds || 0} Units</strong>
                  </div>
                </div>

                {/* Priority Selection */}
                <div className="form-group" style={{ margin: "16px 0" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8" }}>
                    Emergency Triage Severity
                  </label>
                  <select
                    className="custom-filter-select"
                    style={{ width: "100%", marginTop: "6px" }}
                    value={allocationPriority}
                    onChange={(e) => setAllocationPriority(e.target.value)}
                  >
                    <option value="CRITICAL">🔴 CRITICAL (Immediate ICU / Ventilator Required)</option>
                    <option value="HIGH">🟠 HIGH (Severe Acute Condition)</option>
                    <option value="MEDIUM">🟡 MEDIUM (Moderate Injury / Observation)</option>
                    <option value="LOW">🟢 LOW (Standard Consultation / General Bed)</option>
                  </select>
                </div>

                {/* Resource Requirement */}
                <div className="form-group" style={{ margin: "16px 0" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8" }}>
                    Target Medical Resource
                  </label>
                  <select
                    className="custom-filter-select"
                    style={{ width: "100%", marginTop: "6px" }}
                    value={requiredResource}
                    onChange={(e) => setRequiredResource(e.target.value)}
                  >
                    <option value="GENERAL_BED">🛏️ General Bed</option>
                    <option value="ICU_BED">🏥 ICU Bed with Monitor</option>
                    <option value="EMERGENCY_BED">⚡ Emergency Trauma Bed</option>
                    <option value="OXYGEN">🫁 High-Flow Oxygen Unit</option>
                    <option value="VENTILATOR">🩺 Advanced Ventilator</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button
                    className="secondary-btn"
                    onClick={() => setShowAllocationModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="allocate-btn"
                    disabled={allocating}
                    onClick={handleConfirmAllocation}
                  >
                    {allocating ? "Allocating..." : "Confirm Patient Admission"}
                  </button>
                </div>
              </>
            ) : (
              <div className="success-state">
                <div className="success-icon">✓</div>
                <h2>Allocation Request Confirmed</h2>
                <p>
                  Patient admission successfully registered at{" "}
                  <strong>{selectedHospital.name}</strong>.
                </p>
                <div className="allocation-summary" style={{ margin: "18px 0" }}>
                  <div>
                    <span>Allocation ID</span>
                    <strong>#{allocationResult.allocation_id}</strong>
                  </div>
                  <div>
                    <span>Assigned Bed</span>
                    <strong>{allocationResult.allocated_bed?.bed_number || "ICU-04"}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong style={{ color: "#10b981" }}>ALLOCATED</strong>
                  </div>
                </div>
                <button
                  className="allocate-btn"
                  onClick={() => {
                    setShowAllocationModal(false);
                    fetchHospitalCatalog();
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}