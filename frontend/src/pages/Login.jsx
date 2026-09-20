import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [name, setName] = useState("Dr. Muskaan Batham");
  const [email, setEmail] = useState("muskaan@vaidya.ai");
  const [phone, setPhone] = useState("+91 9876543210");
  const [age, setAge] = useState("24");
  const [bloodType, setBloodType] = useState("O+");
  const [weight, setWeight] = useState("65");
  const [height, setHeight] = useState("172");
  const [role, setRole] = useState("patient");

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter full patient name");
      return;
    }

    localStorage.setItem("vaidyaUser", name.trim());
    localStorage.setItem(
      "vaidyaPatientProfile",
      JSON.stringify({
        name: name.trim(),
        email,
        phone,
        age,
        bloodType,
        weight,
        height,
        role,
      })
    );

    navigate("/dashboard");
  };

  return (
    <div className="login-fullscreen-bg">
      <div className="login-card-container">
        {/* BRAND HEADER */}
        <div className="login-brand-header">
          <div className="login-cross-icon">✚</div>
          <h1>VAIDYA AI</h1>
          <p>VIRTUAL HEALTHCARE & INTELLIGENT PHYSIOTHERAPY SYSTEM</p>
        </div>

        <form className="login-form-body" onSubmit={handleLogin}>
          <div className="form-row-2">
            <div className="form-group">
              <label>Full Name / Patient Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
              />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
              />
            </div>

            <div className="form-group">
              <label>Blood Group</label>
              <select value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile"
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="65"
              />
            </div>

            <div className="form-group">
              <label>Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="172"
              />
            </div>
          </div>

          <button type="submit" className="login-submit-btn">
            Enter Healthcare Portal →
          </button>
        </form>

        <div className="login-footer-info">
          <span>🔒 End-to-End Encrypted Health Records • AI Motion Biomechanics Ready</span>
        </div>
      </div>
    </div>
  );
}