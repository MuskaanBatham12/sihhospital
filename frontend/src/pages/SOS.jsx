import { useState } from "react";

function SOS() {
  const [severity, setSeverity] = useState("");
  const [resource, setResource] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const handleSOS = (event) => {
    event.preventDefault();

    const sosData = {
      severity,
      required_resource: resource,
      description,
      location,
    };

    console.log("SOS Request:", sosData);

    alert("SOS request submitted!");
  };

  return (
    <div className="sos-page">

      <div className="sos-header">
        <h1>Emergency SOS</h1>
        <p>
          Request immediate assistance and find
          the most suitable hospital.
        </p>
      </div>

      <form
        className="sos-form"
        onSubmit={handleSOS}
      >

        <div className="form-group">
          <label>
            Emergency Severity
          </label>

          <select
            value={severity}
            onChange={(event) =>
              setSeverity(event.target.value)
            }
            required
          >
            <option value="">
              Select severity
            </option>

            <option value="critical">
              Critical
            </option>

            <option value="high">
              High
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="low">
              Low
            </option>
          </select>
        </div>

        <div className="form-group">
          <label>
            Required Resource
          </label>

          <select
            value={resource}
            onChange={(event) =>
              setResource(event.target.value)
            }
            required
          >
            <option value="">
              Select required resource
            </option>

            <option value="emergency_bed">
              Emergency Bed
            </option>

            <option value="icu">
              ICU
            </option>

            <option value="oxygen">
              Oxygen
            </option>

            <option value="ventilator">
              Ventilator
            </option>

            <option value="general">
              General Emergency Care
            </option>
          </select>
        </div>

        <div className="form-group">
          <label>
            Your Location
          </label>

          <input
            type="text"
            placeholder="Enter your current location"
            value={location}
            onChange={(event) =>
              setLocation(event.target.value)
            }
            required
          />
        </div>

        <div className="form-group">
          <label>
            Emergency Description
          </label>

          <textarea
            placeholder="Describe the emergency..."
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            required
          />
        </div>

        <button
          type="submit"
          className="sos-submit"
        >
          SEND SOS REQUEST
        </button>

      </form>

    </div>
  );
}

export default SOS;