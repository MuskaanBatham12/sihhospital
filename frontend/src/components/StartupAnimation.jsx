import React, { useEffect, useState } from "react";

export default function StartupAnimation({ onComplete }) {
  const [stage, setStage] = useState(0); // 0: init, 1: pulse/ecg, 2: fadeout

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 150);
    const t2 = setTimeout(() => setStage(2), 1900);
    const t3 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className={`vaidya-startup-overlay ${stage === 2 ? "startup-fadeout" : ""}`}>
      <div className="startup-brand-card">
        {/* Glow ambient background ring */}
        <div className="startup-glow-ring"></div>

        {/* Medical Cross Icon with Pulse */}
        <div className={`startup-cross-icon ${stage >= 1 ? "pulse-active" : ""}`}>
          <span>✚</span>
        </div>

        {/* Animated ECG Pulse Wave */}
        <div className="startup-ecg-container">
          <svg className="startup-ecg-svg" viewBox="0 0 300 40">
            <path
              className="startup-ecg-path"
              d="M 0,20 L 70,20 L 85,5 L 95,35 L 105,10 L 115,25 L 125,20 L 300,20"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Main Title & Subtitle */}
        <div className="startup-text-block">
          <h1 className="startup-title">
            VAIDYA <span className="highlight-ai">AI</span>
          </h1>
          <p className="startup-tagline">
            VIRTUAL HEALTHCARE & INTELLIGENT ALLOCATION
          </p>
        </div>

        {/* Status Indicators */}
        <div className="startup-status-strip">
          <span className="startup-status-pill">
            <span className="status-dot"></span> GPS GEOLOCATION ENGINE
          </span>
          <span className="startup-status-pill">
            <span className="status-dot"></span> 5-STATE HOSPITAL NETWORK
          </span>
        </div>
      </div>
    </div>
  );
}
