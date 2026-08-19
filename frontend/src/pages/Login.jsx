import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [age, setAge] = useState("");
  const [nationality, setNationality] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    // Keep the existing user name storage
    localStorage.setItem(
      "vaidyaUser",
      name.trim()
    );

    // Save complete patient profile
    const patientProfile = {
      name: name.trim(),
      email,
      number,
      age,
      nationality,
      bloodType,
      weight,
      height,
    };

    localStorage.setItem(
      "vaidyaPatientProfile",
      JSON.stringify(patientProfile)
    );

    // SAME PATH — DO NOT CHANGE
    navigate("/dashboard");
  };

  return (
    <div className="login-page">

      <div className="login-form">

        <h1>VAIDYA AI</h1>

        <p>
          Your intelligent healthcare companion
        </p>

        <form onSubmit={handleLogin}>

          {/* NAME */}
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* PHONE */}
          <input
            type="tel"
            placeholder="Mobile Number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />

          {/* AGE */}
          <input
            type="number"
            placeholder="Age"
            min="1"
            max="120"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />

          {/* NATIONALITY */}
          <input
            type="text"
            placeholder="Nationality"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
          />

          {/* BLOOD TYPE */}
          <select
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
          >
            <option value="">
              Select Blood Type
            </option>

            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>

          {/* WEIGHT */}
          <input
            type="number"
            placeholder="Weight (kg)"
            min="1"
            max="500"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />

          {/* HEIGHT */}
          <input
            type="number"
            placeholder="Height (cm)"
            min="30"
            max="250"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />

          {/* SAME SUBMIT BUTTON */}
          <button type="submit">
            Continue
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;