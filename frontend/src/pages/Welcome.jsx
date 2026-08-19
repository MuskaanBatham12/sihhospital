import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 3500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="welcome-screen">

      <div className="medical-orbit orbit-one"></div>
      <div className="medical-orbit orbit-two"></div>

      <div className="welcome-content">

        <div className="welcome-icon">
          <span>✚</span>
        </div>

        <h1 className="welcome-title">
          VAIDYA <span>AI</span>
        </h1>

        <p className="welcome-tagline">
          Intelligent healthcare, right at your fingertips.
        </p>

        <div className="welcome-line">
          <span></span>
          <b>YOUR HEALTH. OUR INTELLIGENCE.</b>
          <span></span>
        </div>

        <div className="loading-bar">
          <div></div>
        </div>

      </div>
    </div>
  );
}