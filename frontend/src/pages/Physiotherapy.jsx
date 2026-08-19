import React, { useEffect, useRef, useState } from "react";

function Physiotherapy() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [backendExercises, setBackendExercises] = useState([]);

  const [exercise, setExercise] = useState("Squats");
  const [running, setRunning] = useState(false);

  const [reps, setReps] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [kneeAngle, setKneeAngle] = useState(0);
  const [posture, setPosture] = useState("READY");

  const [feedback, setFeedback] = useState(
    "Start your session to begin AI analysis."
  );

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const poseRef = useRef(null);
  const animationRef = useRef(null);

  /*
    IMPORTANT:
    Refs are used so MediaPipe always sees the
    latest exercise/running state.
  */
  const runningRef = useRef(false);
  const exerciseRef = useRef("Squats");

  const squatStateRef = useRef("up");
  const curlStateRef = useRef("down");
  const shoulderStateRef = useRef("down");

  const recognitionRef = useRef(null);

  const exercises = [
    {
      name: "Squats",
      target: "20 reps",
      icon: "🦵",
    },
    {
      name: "Shoulder Raises",
      target: "15 reps",
      icon: "💪",
    },
    {
      name: "Bicep Curls",
      target: "15 reps",
      icon: "🏋️",
    },
    {
      name: "Arm Extension",
      target: "12 reps",
      icon: "🙆",
    },
  ];

  /* =====================================================
     BACKEND CONNECTION
  ===================================================== */

  useEffect(() => {
    fetch("http://127.0.0.1:8000/physio/status")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend response failed");
        }

        return response.json();
      })
      .then((data) => {
        console.log("Backend connected:", data);

        setBackendStatus(data.status);
        setBackendExercises(data.exercises || []);
      })
      .catch((error) => {
        console.error("Backend connection failed:", error);
        setBackendStatus("offline");
      });
  }, []);

  /* =====================================================
     LOAD MEDIAPIPE
  ===================================================== */

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[data-mediapipe-pose="true"]'
    );

    if (existingScript) {
      if (window.Pose) {
        initializePose();
      }

      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";

    script.async = true;
    script.dataset.mediapipePose = "true";

    script.onload = () => {
      console.log("MediaPipe Pose loaded");

      initializePose();
    };

    script.onerror = () => {
      console.error("Could not load MediaPipe Pose");

      setFeedback(
        "AI Pose Detection could not be loaded. Check your internet connection."
      );
    };

    document.body.appendChild(script);

    return () => {
      /*
        Do not remove the CDN script here.
        Other React renders/components may still need it.
      */
    };
  }, []);

  /* =====================================================
     INITIALIZE MEDIAPIPE
  ===================================================== */

  const initializePose = () => {
    if (!window.Pose) {
      console.error("MediaPipe Pose is not available.");
      return;
    }

    if (poseRef.current) {
      return;
    }

    try {
      const pose = new window.Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults(handlePoseResults);

      poseRef.current = pose;

      console.log("MediaPipe Pose initialized");
    } catch (error) {
      console.error("MediaPipe initialization failed:", error);
    }
  };

  /* =====================================================
     CAMERA
  ===================================================== */

  const startCamera = async () => {
    try {
      console.log("Starting camera...");

      if (!navigator.mediaDevices) {
        throw new Error(
          "Camera API is not available. Open the application using localhost or HTTPS."
        );
      }

      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "getUserMedia is not supported by this browser."
        );
      }

      /*
        Stop any old stream first.
      */

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }

      /*
        Ask browser for camera permission.
      */

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: {
              ideal: 640,
            },
            height: {
              ideal: 480,
            },
            facingMode: "user",
          },
          audio: false,
        });

      console.log("Camera permission granted.");
      console.log("Camera stream:", stream);

      streamRef.current = stream;

      /*
        IMPORTANT:
        Update refs immediately.
      */

      runningRef.current = true;
      exerciseRef.current = exercise;

      /*
        Update React state.
      */

      setRunning(true);
      setReps(0);
      setAccuracy(0);
      setKneeAngle(0);
      setPosture("DETECTING");

      setFeedback(
        "Camera active. Stand where your full body is visible."
      );

      /*
        Wait for React to render <video>.
      */

      setTimeout(async () => {
        if (!videoRef.current) {
          console.error(
            "Video element was not found."
          );

          setFeedback(
            "Camera opened but video element was not found."
          );

          return;
        }

        try {
          videoRef.current.srcObject = stream;

          videoRef.current.muted = true;
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;

          await videoRef.current.play();

          console.log("VIDEO IS PLAYING");

          /*
            Start AI processing.
          */

          processCamera();

          speak(
            `Starting ${exercise}. Please position yourself in front of the camera.`
          );
        } catch (error) {
          console.error(
            "Video playback failed:",
            error
          );

          setFeedback(
            "Camera opened but the video could not be displayed."
          );
        }
      }, 150);
    } catch (error) {
      console.error("CAMERA ERROR:", error);

      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      runningRef.current = false;

      setRunning(false);

      if (error.name === "NotAllowedError") {
        setFeedback(
          "Camera permission blocked. Allow camera access in browser settings."
        );
      } else if (error.name === "NotFoundError") {
        setFeedback(
          "No camera was found on this device."
        );
      } else if (error.name === "NotReadableError") {
        setFeedback(
          "Camera is being used by another application. Close Meet, Zoom or Camera app and try again."
        );
      } else if (error.name === "OverconstrainedError") {
        setFeedback(
          "Camera does not support the requested settings."
        );
      } else {
        setFeedback(
          `Camera access failed: ${error.message}`
        );
      }

      speak(
        "Camera access failed. Please check your camera permission."
      );
    }
  };

  /* =====================================================
     STOP CAMERA
  ===================================================== */

  const stopCamera = () => {
    console.log("Stopping camera...");

    runningRef.current = false;

    if (animationRef.current) {
      cancelAnimationFrame(
        animationRef.current
      );

      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setRunning(false);

    setPosture("READY");

    setFeedback("Session ended.");

    speak("Session ended.");
  };

  /* =====================================================
     CAMERA PROCESSING
  ===================================================== */

  const processCamera = async () => {
    if (!runningRef.current) {
      return;
    }

    if (
      videoRef.current &&
      poseRef.current &&
      videoRef.current.readyState >= 2
    ) {
      try {
        await poseRef.current.send({
          image: videoRef.current,
        });
      } catch (error) {
        console.error(
          "Pose processing error:",
          error
        );
      }
    }

    if (runningRef.current) {
      animationRef.current =
        requestAnimationFrame(
          processCamera
        );
    }
  };

  /* =====================================================
     ANGLE CALCULATION
  ===================================================== */

  const calculateAngle = (a, b, c) => {
    if (!a || !b || !c) {
      return 0;
    }

    const radians =
      Math.atan2(
        c.y - b.y,
        c.x - b.x
      ) -
      Math.atan2(
        a.y - b.y,
        a.x - b.x
      );

    let angle =
      Math.abs(
        (radians * 180) / Math.PI
      );

    if (angle > 180) {
      angle = 360 - angle;
    }

    return Math.round(angle);
  };

  /* =====================================================
     POSE ANALYSIS
  ===================================================== */

  const handlePoseResults = (results) => {
    if (!runningRef.current) {
      return;
    }

    if (!results.poseLandmarks) {
      setPosture("NO BODY");

      setFeedback(
        "Move into the camera frame."
      );

      return;
    }

    const lm = results.poseLandmarks;

    /*
      MediaPipe landmarks:

      11 = left shoulder
      12 = right shoulder

      13 = left elbow
      14 = right elbow

      15 = left wrist
      16 = right wrist

      23 = left hip
      24 = right hip

      25 = left knee
      26 = right knee

      27 = left ankle
      28 = right ankle
    */

    const leftShoulder = lm[11];
    const rightShoulder = lm[12];

    const leftElbow = lm[13];
    const rightElbow = lm[14];

    const leftWrist = lm[15];
    const rightWrist = lm[16];

    const leftHip = lm[23];
    const rightHip = lm[24];

    const leftKnee = lm[25];
    const rightKnee = lm[26];

    const leftAnkle = lm[27];
    const rightAnkle = lm[28];

    /*
      Required landmarks.
    */

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip
    ) {
      setPosture("NO BODY");

      setFeedback(
        "Make sure your upper and lower body are visible."
      );

      return;
    }

    const currentExercise =
      exerciseRef.current;

    /* =================================================
       SQUATS
    ================================================= */

    if (currentExercise === "Squats") {
      if (
        !leftKnee ||
        !rightKnee ||
        !leftAnkle ||
        !rightAnkle
      ) {
        return;
      }

      const leftAngle =
        calculateAngle(
          leftHip,
          leftKnee,
          leftAnkle
        );

      const rightAngle =
        calculateAngle(
          rightHip,
          rightKnee,
          rightAnkle
        );

      const averageKneeAngle =
        Math.round(
          (leftAngle + rightAngle) / 2
        );

      setKneeAngle(
        averageKneeAngle
      );

      /*
        Standing position
      */

      if (averageKneeAngle > 155) {
        squatStateRef.current = "up";

        setPosture("GOOD");
        setAccuracy(95);

        setFeedback(
          "Good posture. Bend your knees to squat."
        );
      }

      /*
        Squat completed
      */

      if (
        averageKneeAngle < 120 &&
        squatStateRef.current === "up"
      ) {
        squatStateRef.current = "down";

        setReps((previous) => {
          const next =
            previous + 1;

          speak(
            `Rep ${next} complete`
          );

          return next;
        });

        setPosture("GOOD");
        setAccuracy(96);

        setFeedback(
          "Excellent squat. Return to standing position."
        );
      }

      /*
        Middle position
      */

      if (
        averageKneeAngle >= 120 &&
        averageKneeAngle <= 155
      ) {
        setPosture("ADJUST");
        setAccuracy(90);

        setFeedback(
          "Keep your back straight and control the movement."
        );
      }
    }

    /* =================================================
       BICEP CURLS
    ================================================= */

    if (
      currentExercise ===
      "Bicep Curls"
    ) {
      if (
        !leftElbow ||
        !rightElbow ||
        !leftWrist ||
        !rightWrist
      ) {
        return;
      }

      const leftAngle =
        calculateAngle(
          leftShoulder,
          leftElbow,
          leftWrist
        );

      const rightAngle =
        calculateAngle(
          rightShoulder,
          rightElbow,
          rightWrist
        );

      const elbowAngle =
        Math.round(
          (leftAngle +
            rightAngle) /
            2
        );

      setKneeAngle(
        elbowAngle
      );

      /*
        Arm down
      */

      if (elbowAngle > 150) {
        curlStateRef.current =
          "down";

        setPosture("GOOD");
        setAccuracy(94);

        setFeedback(
          "Good. Curl your arms upward."
        );
      }

      /*
        Curl completed
      */

      if (
        elbowAngle < 60 &&
        curlStateRef.current ===
          "down"
      ) {
        curlStateRef.current =
          "up";

        setReps((previous) => {
          const next =
            previous + 1;

          speak(
            `Rep ${next} complete`
          );

          return next;
        });

        setPosture("GOOD");
        setAccuracy(96);

        setFeedback(
          "Great curl. Slowly lower your arms."
        );
      }
    }

    /* =================================================
       SHOULDER RAISES
    ================================================= */

    if (
      currentExercise ===
      "Shoulder Raises"
    ) {
      if (
        !leftWrist ||
        !rightWrist
      ) {
        return;
      }

      const shoulderHeight =
        (leftShoulder.y +
          rightShoulder.y) /
        2;

      const wristHeight =
        (leftWrist.y +
          rightWrist.y) /
        2;

      /*
        Arms raised
      */

      if (
        wristHeight <
        shoulderHeight - 0.12
      ) {
        shoulderStateRef.current =
          "up";

        setPosture("GOOD");
        setAccuracy(95);

        setFeedback(
          "Arms raised correctly."
        );
      }

      /*
        Return down = completed rep
      */

      if (
        wristHeight >
          shoulderHeight + 0.05 &&
        shoulderStateRef.current ===
          "up"
      ) {
        shoulderStateRef.current =
          "down";

        setReps((previous) => {
          const next =
            previous + 1;

          speak(
            `Rep ${next} complete`
          );

          return next;
        });

        setPosture("GOOD");
        setAccuracy(96);

        setFeedback(
          "Good shoulder raise. Repeat slowly."
        );
      }
    }

    /* =================================================
       ARM EXTENSION
    ================================================= */

    if (
      currentExercise ===
      "Arm Extension"
    ) {
      if (
        !leftElbow ||
        !rightElbow ||
        !leftWrist ||
        !rightWrist
      ) {
        return;
      }

      const leftAngle =
        calculateAngle(
          leftShoulder,
          leftElbow,
          leftWrist
        );

      const rightAngle =
        calculateAngle(
          rightShoulder,
          rightElbow,
          rightWrist
        );

      const angle =
        Math.round(
          (leftAngle +
            rightAngle) /
            2
        );

      setKneeAngle(angle);

      if (angle > 150) {
        setPosture("GOOD");
        setAccuracy(95);

        setFeedback(
          "Arms are extended correctly."
        );
      } else {
        setPosture("ADJUST");
        setAccuracy(88);

        setFeedback(
          "Extend your arms slowly."
        );
      }
    }
  };

  /* =====================================================
     VOICE OUTPUT
  ===================================================== */

  const speak = (text) => {
    if (
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(
        text
      );

    speech.rate = 0.95;
    speech.pitch = 1;

    window.speechSynthesis.speak(
      speech
    );
  };

  /* =====================================================
     VOICE CONTROL
  ===================================================== */

  const startVoiceControl = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log(
        "Voice recognition not supported."
      );

      return;
    }

    if (recognitionRef.current) {
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (
      event
    ) => {
      const result =
        event.results[
          event.results.length - 1
        ][0].transcript
          .toLowerCase()
          .trim();

      console.log(
        "Voice command:",
        result
      );

      if (
        result.includes("start") ||
        result.includes("begin")
      ) {
        if (!runningRef.current) {
          startCamera();
        }

        return;
      }

      if (
        result.includes("stop") ||
        result.includes("end")
      ) {
        if (runningRef.current) {
          stopCamera();
        }

        return;
      }

      if (
        result.includes("squat") ||
        result.includes("squats")
      ) {
        changeExercise("Squats");

        return;
      }

      if (
        result.includes("bicep") ||
        result.includes("curl")
      ) {
        changeExercise(
          "Bicep Curls"
        );

        return;
      }

      if (
        result.includes("shoulder")
      ) {
        changeExercise(
          "Shoulder Raises"
        );

        return;
      }

      if (
        result.includes("arm extension")
      ) {
        changeExercise(
          "Arm Extension"
        );
      }
    };

    recognition.onerror = (
      error
    ) => {
      console.log(
        "Voice recognition:",
        error.error
      );
    };

    recognition.onend = () => {
      if (
        recognitionRef.current
      ) {
        try {
          recognition.start();
        } catch (error) {
          // Already running
        }
      }
    };

    recognitionRef.current =
      recognition;

    try {
      recognition.start();

      speak(
        "Voice control enabled. Say start, stop, squat, bicep curl, or shoulder raise."
      );
    } catch (error) {
      console.log(
        "Voice start error:",
        error
      );
    }
  };

  /* =====================================================
     VOICE CLEANUP
  ===================================================== */

  useEffect(() => {
    startVoiceControl();

    return () => {
      if (
        recognitionRef.current
      ) {
        try {
          recognitionRef.current.stop();
        } catch (error) {}

        recognitionRef.current =
          null;
      }

      runningRef.current =
        false;

      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current
        );

        animationRef.current =
          null;
      }

      if (
        streamRef.current
      ) {
        streamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        streamRef.current =
          null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject =
          null;
      }
    };
  }, []);

  /* =====================================================
     EXERCISE CHANGE
  ===================================================== */

  const changeExercise = (
    name
  ) => {
    setExercise(name);

    exerciseRef.current =
      name;

    setReps(0);
    setAccuracy(0);
    setKneeAngle(0);

    squatStateRef.current =
      "up";

    curlStateRef.current =
      "down";

    shoulderStateRef.current =
      "down";

    setPosture(
      runningRef.current
        ? "DETECTING"
        : "READY"
    );

    setFeedback(
      runningRef.current
        ? `Perform ${name} in front of the camera.`
        : "Start your session to begin AI analysis."
    );

    speak(
      `${name} selected`
    );
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="physio-dashboard">

      {/* HEADER */}

      <div className="physio-header">

        <div>

          <div className="physio-eyebrow">
            VAIDYA AI • MOTION ANALYSIS
          </div>

          <h1>
            AI Physiotherapy
          </h1>

          <p>
            Real-time posture analysis and intelligent exercise guidance.
          </p>

        </div>

        <div className="physio-live">

          <span></span>

          {backendStatus ===
          "ready"
            ? "AI ENGINE ONLINE"
            : backendStatus ===
              "offline"
            ? "AI ENGINE OFFLINE"
            : "CONNECTING..."}

        </div>

      </div>


      {/* SESSION INFO */}

      <div className="physio-session-card">

        <div>

          <span className="small-label">
            CURRENT SESSION
          </span>

          <h2>
            {exercise}
          </h2>

          <p>
            Follow the AI guidance and maintain proper form.
          </p>

        </div>

        <div className="session-time">

          <span>
            SESSION TIME
          </span>

          <strong>
            {running
              ? "LIVE"
              : "08:42"}
          </strong>

        </div>

      </div>


      {/* BACKEND STATUS */}

      <div className="backend-status-card">

        <span>
          BACKEND STATUS
        </span>

        <strong>
          {backendStatus ===
          "ready"
            ? "● Connected"
            : backendStatus}
        </strong>

        {backendExercises.length >
          0 && (
          <small>
            Exercises available:{" "}
            {
              backendExercises.length
            }
          </small>
        )}

      </div>


      {/* MAIN AREA */}

      <div className="physio-main-grid">

        {/* EXERCISES */}

        <div className="exercise-sidebar">

          <div className="exercise-title">

            <div>

              <span>
                EXERCISES
              </span>

              <h2>
                Choose Exercise
              </h2>

            </div>

            <b>
              {exercises.length}
            </b>

          </div>


          <div className="exercise-list">

            {exercises.map(
              (item) => (

                <button
                  key={item.name}
                  className={
                    exercise ===
                    item.name
                      ? "exercise-option selected"
                      : "exercise-option"
                  }
                  onClick={() =>
                    changeExercise(
                      item.name
                    )
                  }
                >

                  <div className="exercise-icon">
                    {item.icon}
                  </div>

                  <div className="exercise-details">

                    <strong>
                      {item.name}
                    </strong>

                    <small>
                      {item.target}
                    </small>

                  </div>

                  <span>
                    ›
                  </span>

                </button>

              )
            )}

          </div>


          <div className="physio-tip">

            <span>
              ✦ AI TIP
            </span>

            <p>
              Keep your movements slow and controlled for
              better accuracy.
            </p>

          </div>

        </div>


        {/* CAMERA */}

        <div className="camera-card">

          <div className="camera-topbar">

            <div>

              <strong>
                Live Motion Capture
              </strong>

              <span>
                AI Pose Detection
              </span>

            </div>

            <div
              className={
                running
                  ? "camera-status active"
                  : "camera-status"
              }
            >

              <i></i>

              {running
                ? "LIVE"
                : "READY"}

            </div>

          </div>


          <div className="camera-view">

            {!running ? (

              <div className="camera-start">

                <div className="camera-circle">
                  ◉
                </div>

                <h2>
                  Camera Ready
                </h2>

                <p>
                  Start your session to activate
                  AI pose detection.
                </p>

                <button
                  className="start-physio"
                  onClick={
                    startCamera
                  }
                >
                  Start Session →
                </button>

              </div>

            ) : (

              <div
                className="active-camera"
                style={{
                  position:
                    "relative",
                  width: "100%",
                  height: "100%",
                  overflow:
                    "hidden",
                }}
              >

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit:
                      "cover",
                    transform:
                      "scaleX(-1)",
                  }}
                />

                <canvas
                  ref={canvasRef}
                  style={{
                    display:
                      "none",
                  }}
                />

                <div className="tracking-label">

                  <span></span>

                  BODY TRACKING ACTIVE

                </div>

                <div className="camera-feedback">

                  <strong>

                    {posture ===
                    "GOOD"
                      ? "✓ Good posture"
                      : posture ===
                        "ADJUST"
                      ? "⚠ Adjust posture"
                      : posture ===
                        "NO BODY"
                      ? "● No body detected"
                      : "● Detecting body"}

                  </strong>

                  <p>
                    {feedback}
                  </p>

                </div>

              </div>

            )}

          </div>


          <div className="camera-controls">

            {!running ? (

              <button
                className="camera-primary"
                onClick={
                  startCamera
                }
              >
                ▶ Start Exercise
              </button>

            ) : (

              <button
                className="camera-stop"
                onClick={
                  stopCamera
                }
              >
                ■ End Session
              </button>

            )}

          </div>

        </div>


        {/* ANALYSIS */}

        <div className="analysis-sidebar">

          <div className="analysis-heading">

            <span>
              REAL-TIME
            </span>

            <h2>
              AI Analysis
            </h2>

          </div>


          <div className="analysis-card">

            <div className="analysis-icon reps">
              ↻
            </div>

            <div>

              <span>
                REPETITIONS
              </span>

              <strong>

                {reps}

                <small>
                  / 20
                </small>

              </strong>

            </div>

          </div>


          <div className="analysis-card">

            <div className="analysis-icon accuracy">
              ✓
            </div>

            <div>

              <span>
                FORM ACCURACY
              </span>

              <strong>

                {accuracy}

                <small>
                  %
                </small>

              </strong>

            </div>

          </div>


          <div className="analysis-card">

            <div className="analysis-icon angle">
              ∠
            </div>

            <div>

              <span>

                {exercise ===
                "Bicep Curls"
                  ? "ELBOW ANGLE"
                  : "KNEE ANGLE"}

              </span>

              <strong>

                {kneeAngle}

                <small>
                  °
                </small>

              </strong>

            </div>

          </div>


          <div className="posture-card">

            <div className="posture-top">

              <span>
                POSTURE STATUS
              </span>

              <b>
                {posture}
              </b>

            </div>

            <div className="posture-bar">

              <span
                style={{
                  width: `${Math.min(
                    Math.max(
                      accuracy,
                      5
                    ),
                    100
                  )}%`,
                }}
              ></span>

            </div>

            <p>
              {feedback}
            </p>

          </div>


          <div className="feedback-box">

            <div>
              ✦
            </div>

            <div>

              <strong>
                AI Feedback
              </strong>

              <p>
                {feedback}
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* PROGRESS */}

      <div className="physio-progress">

        <div className="progress-top">

          <div>

            <span>
              SESSION PROGRESS
            </span>

            <h2>
              Today's Physiotherapy
            </h2>

          </div>

          <strong>
            {Math.min(
              reps * 5,
              100
            )}
            %
          </strong>

        </div>


        <div className="progress-track">

          <span
            style={{
              width: `${Math.min(
                reps * 5,
                100
              )}%`,
            }}
          ></span>

        </div>


        <div className="progress-bottom">

          <span>

            <b>
              {reps}
            </b>{" "}
            completed

          </span>

          <span>

            Target:{" "}

            <b>
              20 reps
            </b>

          </span>

          <span>

            Accuracy:{" "}

            <b>
              {accuracy}%
            </b>

          </span>

        </div>

      </div>


      {/* SAFETY */}

      <div className="physio-warning">

        <div className="warning-icon">
          !
        </div>

        <div>

          <strong>
            Safety First
          </strong>

          <p>
            Stop immediately if you experience pain,
            dizziness or discomfort. This AI system
            provides guidance and does not replace
            professional medical advice.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Physiotherapy;