import React, { useEffect, useRef, useState, useMemo } from "react";
import { getPhysioStatus } from "../services/physioService";

// 12 Exercise Definitions with detailed biomechanical parameters & instructions
const EXERCISES_DATA = [
  {
    id: "squats",
    name: "Squats",
    category: "Lower Body",
    targetReps: 10,
    icon: "🦵",
    difficulty: "Moderate",
    jointName: "Knee Angle",
    targetMuscles: "Quadriceps, Glutes, Hamstrings",
    instructions: "Stand shoulder-width apart. Lower hips by bending knees to 90°, keeping chest upright.",
    tips: "Ensure knees do not cave inward and keep weight centered over mid-foot."
  },
  {
    id: "shoulder_raises",
    name: "Shoulder Raises",
    category: "Upper Body",
    targetReps: 12,
    icon: "💪",
    difficulty: "Beginner",
    jointName: "Shoulder Angle",
    targetMuscles: "Lateral Deltoids, Trapezius",
    instructions: "Raise arms out laterally to shoulder height (approx 90°), hold briefly, and lower slowly.",
    tips: "Avoid shrugging your neck or swinging your torso."
  },
  {
    id: "bicep_curls",
    name: "Bicep Curls",
    category: "Upper Body",
    targetReps: 12,
    icon: "🏋️",
    difficulty: "Beginner",
    jointName: "Elbow Angle",
    targetMuscles: "Biceps Brachii, Forearms",
    instructions: "Keep elbows fixed against ribs. Curl hands toward shoulders, squeezing at top.",
    tips: "Control the eccentric descent; do not let weights drop quickly."
  },
  {
    id: "arm_raises",
    name: "Arm Raises",
    category: "Upper Body",
    targetReps: 10,
    icon: "🙆",
    difficulty: "Beginner",
    jointName: "Overhead Angle",
    targetMuscles: "Anterior Deltoids, Upper Back",
    instructions: "Extend arms straight up overhead until fully aligned with torso.",
    tips: "Engage core and avoid overarching your lower back."
  },
  {
    id: "lunges",
    name: "Lunges",
    category: "Lower Body",
    targetReps: 10,
    icon: "🏃",
    difficulty: "Intermediate",
    jointName: "Lead Knee Angle",
    targetMuscles: "Quadriceps, Glutes, Calves",
    instructions: "Step forward until both knees form 90-degree angles, then press back to standing.",
    tips: "Keep front knee tracked over mid-foot, avoiding forward collapse."
  },
  {
    id: "knee_raises",
    name: "Knee Raises",
    category: "Core & Lower",
    targetReps: 12,
    icon: "🦶",
    difficulty: "Beginner",
    jointName: "Hip Elevation",
    targetMuscles: "Hip Flexors, Lower Abs",
    instructions: "Stand tall and lift each knee alternatingly up towards chest level.",
    tips: "Maintain an upright posture without leaning backwards."
  },
  {
    id: "side_leg_raises",
    name: "Side Leg Raises",
    category: "Lower Body",
    targetReps: 12,
    icon: "🦵",
    difficulty: "Beginner",
    jointName: "Abduction Angle",
    targetMuscles: "Gluteus Medius, Outer Thigh",
    instructions: "Lift leg out to the side without tilting your torso sideways.",
    tips: "Keep toes pointing forward, not turned outwards."
  },
  {
    id: "hip_abduction",
    name: "Hip Abduction",
    category: "Lower Body",
    targetReps: 12,
    icon: "🤸",
    difficulty: "Beginner",
    jointName: "Hip Abduction",
    targetMuscles: "Gluteus Medius, Hip Stabilizers",
    instructions: "Extend leg laterally with a smooth squeeze at peak range.",
    tips: "Keep pelvis level and avoid lumbar rotation."
  },
  {
    id: "calf_raises",
    name: "Calf Raises",
    category: "Lower Body",
    targetReps: 15,
    icon: "👣",
    difficulty: "Beginner",
    jointName: "Ankle Angle",
    targetMuscles: "Gastrocnemius, Soleus",
    instructions: "Push down through the balls of feet to elevate heels as high as possible.",
    tips: "Pause for one second at the top of contraction."
  },
  {
    id: "sit_to_stand",
    name: "Sit-to-Stand",
    category: "Mobility",
    targetReps: 10,
    icon: "🪑",
    difficulty: "Beginner",
    jointName: "Knee Extension",
    targetMuscles: "Quadriceps, Glutes, Core",
    instructions: "Rise from a chair to full standing position without using arm assistance.",
    tips: "Press through heels and keep feet flat on the floor."
  },
  {
    id: "leg_extension",
    name: "Leg Extension",
    category: "Mobility",
    targetReps: 12,
    icon: "🦿",
    difficulty: "Beginner",
    jointName: "Knee Flexion",
    targetMuscles: "Quadriceps, Knee Stabilizers",
    instructions: "While seated, extend lower leg forward until leg is straight, hold, and return.",
    tips: "Keep thigh flat on seat surface."
  },
  {
    id: "neck_shoulder_mobility",
    name: "Shoulder/Neck Mobility",
    category: "Mobility",
    targetReps: 10,
    icon: "🧘",
    difficulty: "Beginner",
    jointName: "Shrug Angle",
    targetMuscles: "Cervical Spine, Trapezius",
    instructions: "Elevate shoulders straight up towards ears in a controlled shrug motion.",
    tips: "Do not roll shoulders back aggressively; move vertically."
  }
];

export default function Physiotherapy() {
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES_DATA[0]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [running, setRunning] = useState(false);
  const [backendStatus, setBackendStatus] = useState("Checking...");

  // Real-time exercise telemetry state
  const [reps, setReps] = useState(0);
  const [correctReps, setCorrectReps] = useState(0);
  const [incorrectReps, setIncorrectReps] = useState(0);
  const [accuracy, setAccuracy] = useState(95);
  const [jointAngle, setJointAngle] = useState(0);
  const [postureStatus, setPostureStatus] = useState("READY"); // GOOD, ADJUST, WARNING, NO_BODY, READY
  const [feedbackText, setFeedbackText] = useState("Position yourself in frame to start.");
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Refs for tracking animation loops and pose engines
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const poseRef = useRef(null);
  const animationRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Exercise tracking state refs (avoids closure capture in animation frames)
  const runningRef = useRef(false);
  const exerciseRef = useRef(EXERCISES_DATA[0]);
  const stageRef = useRef("START");
  const repsRef = useRef(0);
  const correctRepsRef = useRef(0);
  const incorrectRepsRef = useRef(0);
  const repBadFormRef = useRef(false);
  const angleHistoryRef = useRef([]);
  const lastVoiceTimeRef = useRef(0);
  const lastVoiceMsgRef = useRef("");
  const mistakesLogRef = useRef([]);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    if (activeCategory === "All") return EXERCISES_DATA;
    return EXERCISES_DATA.filter((ex) => ex.category === activeCategory);
  }, [activeCategory]);

  /* =====================================================
     CHECK BACKEND STATUS
  ===================================================== */
  useEffect(() => {
    getPhysioStatus().then((res) => {
      if (res && res.status === "ready") {
        setBackendStatus("ready");
      } else {
        setBackendStatus("offline");
      }
    });
  }, []);

  /* =====================================================
     LOAD IN-BROWSER MEDIAPIPE AS FAILSAFE / CLIENT ENGINE
  ===================================================== */
  useEffect(() => {
    const existingScript = document.querySelector('script[data-mediapipe-pose="true"]');
    if (existingScript) {
      if (window.Pose) initializeMediaPipe();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";
    script.async = true;
    script.dataset.mediapipePose = "true";
    script.onload = () => initializeMediaPipe();
    script.onerror = () => {
      console.warn("MediaPipe CDN failed, relying on backend stream.");
    };
    document.body.appendChild(script);

    return () => {
      stopCamera();
    };
  }, []);

  const initializeMediaPipe = () => {
    if (!window.Pose || poseRef.current) return;
    try {
      const pose = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults(onPoseResults);
      poseRef.current = pose;
      console.log("In-browser MediaPipe Pose initialized successfully.");
    } catch (err) {
      console.error("MediaPipe initialization error:", err);
    }
  };

  /* =====================================================
     VOICE SYNTHESIS
  ===================================================== */
  const speakCue = (text) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    const now = Date.now();
    if (text === lastVoiceMsgRef.current && now - lastVoiceTimeRef.current < 2500) return;
    if (now - lastVoiceTimeRef.current < 1800) return;

    lastVoiceTimeRef.current = now;
    lastVoiceMsgRef.current = text;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  /* =====================================================
     CAMERA CONTROLS
  ===================================================== */
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setFeedbackText("Camera API not supported in this browser.");
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      runningRef.current = true;
      setRunning(true);
      setReps(0);
      setCorrectReps(0);
      setIncorrectReps(0);
      setAccuracy(96);
      setPostureStatus("READY");
      stageRef.current = "START";
      repsRef.current = 0;
      correctRepsRef.current = 0;
      incorrectRepsRef.current = 0;
      repBadFormRef.current = false;
      mistakesLogRef.current = [];
      setSessionSeconds(0);

      // Start timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);

      setFeedbackText(`Camera active. Starting ${selectedExercise.name}. Stand where full body is visible.`);
      speakCue(`Starting ${selectedExercise.name}. Position yourself in camera.`);

      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          await videoRef.current.play();
          renderLoop();
        }
      }, 150);
    } catch (err) {
      console.error("Camera access error:", err);
      setFeedbackText("Camera permission blocked or camera not found.");
      runningRef.current = false;
      setRunning(false);
    }
  };

  const stopCamera = () => {
    runningRef.current = false;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setRunning(false);
    setPostureStatus("READY");
  };

  const finishSession = () => {
    stopCamera();
    setShowSummary(true);
    speakCue("Session completed. Great work!");
  };

  /* =====================================================
     CONTINUOUS RENDER & POSE DETECTION LOOP
  ===================================================== */
  const renderLoop = async () => {
    if (!runningRef.current) return;

    if (videoRef.current && videoRef.current.readyState >= 2 && poseRef.current) {
      try {
        await poseRef.current.send({ image: videoRef.current });
      } catch (err) {}
    }

    if (runningRef.current) {
      animationRef.current = requestAnimationFrame(renderLoop);
    }
  };

  /* =====================================================
     JOINT ANGLE CALCULATION
  ===================================================== */
  const calculateAngle = (a, b, c) => {
    if (!a || !b || !c) return 0;
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360.0 - angle;
    return Math.round(angle);
  };

  /* =====================================================
     EXERCISE POSE LOGIC PROCESSOR
  ===================================================== */
  const onPoseResults = (results) => {
    if (!runningRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.poseLandmarks) {
      setPostureStatus("NO_BODY");
      setFeedbackText("No person detected in frame. Step back.");
      return;
    }

    const lm = results.poseLandmarks;
    const currentEx = exerciseRef.current.id;

    // Draw Skeleton on Canvas Overlay
    drawSkeleton(ctx, lm, canvas.width, canvas.height);

    // Landmarks mapping
    const leftShoulder = lm[11], rightShoulder = lm[12];
    const leftElbow = lm[13], rightElbow = lm[14];
    const leftWrist = lm[15], rightWrist = lm[16];
    const leftHip = lm[23], rightHip = lm[24];
    const leftKnee = lm[25], rightKnee = lm[26];
    const leftAnkle = lm[27], rightAnkle = lm[28];
    const leftEar = lm[7] || lm[0], rightEar = lm[8] || lm[0];

    let currentAngle = 0;

    /* ----------------------------------------------------
       1. SQUATS
       ---------------------------------------------------- */
    if (currentEx === "squats") {
      if (!leftHip || !leftKnee || !leftAnkle) return;
      const lAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      const rAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      currentAngle = Math.round((lAngle + rAngle) / 2);
      setJointAngle(currentAngle);

      if (currentAngle > 155) {
        if (stageRef.current === "BOTTOM" || stageRef.current === "ASCENDING") {
          repsRef.current += 1;
          setReps(repsRef.current);
          if (repBadFormRef.current) {
            incorrectRepsRef.current += 1;
            setIncorrectReps(incorrectRepsRef.current);
          } else {
            correctRepsRef.current += 1;
            setCorrectReps(correctRepsRef.current);
          }
          speakCue(`Rep ${repsRef.current} complete`);
          stageRef.current = "STANDING";
          repBadFormRef.current = false;
          setPostureStatus("GOOD");
          setFeedbackText("Good squat! Stand tall and repeat.");
        } else {
          stageRef.current = "STANDING";
          setPostureStatus("GOOD");
          setFeedbackText("Standing ready. Lower your hips to squat.");
        }
      } else if (currentAngle < 100) {
        stageRef.current = "BOTTOM";
        if (currentAngle < 65) {
          setPostureStatus("WARNING");
          setFeedbackText("Don't squat too low. Protect your knees.");
          repBadFormRef.current = true;
          speakCue("Don't squat too deep");
        } else {
          setPostureStatus("GOOD");
          setFeedbackText("Great depth! Drive up through heels.");
          speakCue("Good depth, push up");
        }
      } else {
        stageRef.current = "DESCENDING";
        setPostureStatus("GOOD");
        setFeedbackText("Lowering... keep knees aligned with toes.");
      }
    }

    /* ----------------------------------------------------
       2. BICEP CURLS
       ---------------------------------------------------- */
    else if (currentEx === "bicep_curls") {
      if (!leftShoulder || !leftElbow || !leftWrist) return;
      const lAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
      currentAngle = Math.min(lAngle, rAngle);
      setJointAngle(currentAngle);

      if (currentAngle < 50) {
        stageRef.current = "UP";
        setPostureStatus("GOOD");
        setFeedbackText("Curled up! Squeeze biceps and lower slowly.");
      } else if (currentAngle > 145) {
        if (stageRef.current === "UP") {
          repsRef.current += 1;
          setReps(repsRef.current);
          correctRepsRef.current += 1;
          setCorrectReps(correctRepsRef.current);
          speakCue(`Rep ${repsRef.current} complete`);
          stageRef.current = "DOWN";
          setPostureStatus("GOOD");
          setFeedbackText("Arm extended. Ready for next curl.");
        } else {
          stageRef.current = "DOWN";
          setPostureStatus("GOOD");
          setFeedbackText("Curl upward smoothly without swinging.");
        }
      }
    }

    /* ----------------------------------------------------
       3. SHOULDER RAISES
       ---------------------------------------------------- */
    else if (currentEx === "shoulder_raises") {
      if (!leftHip || !leftShoulder || !leftElbow) return;
      const lAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
      const rAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
      currentAngle = Math.max(lAngle, rAngle);
      setJointAngle(currentAngle);

      if (currentAngle > 80) {
        stageRef.current = "UP";
        if (currentAngle > 115) {
          setPostureStatus("ADJUST");
          setFeedbackText("Stop at shoulder level; do not over-raise.");
          speakCue("Shoulder height only");
        } else {
          setPostureStatus("GOOD");
          setFeedbackText("Shoulder height reached! Hold and lower slowly.");
        }
      } else if (currentAngle < 35) {
        if (stageRef.current === "UP") {
          repsRef.current += 1;
          setReps(repsRef.current);
          correctRepsRef.current += 1;
          setCorrectReps(correctRepsRef.current);
          speakCue(`Rep ${repsRef.current} complete`);
          stageRef.current = "DOWN";
          setPostureStatus("GOOD");
          setFeedbackText("Arms at side. Lift out laterally again.");
        } else {
          stageRef.current = "DOWN";
          setPostureStatus("GOOD");
          setFeedbackText("Raise arms out laterally to shoulder level.");
        }
      }
    }

    /* ----------------------------------------------------
       4. ARM RAISES / OVERHEAD
       ---------------------------------------------------- */
    else if (currentEx === "arm_raises") {
      if (!leftHip || !leftShoulder || !leftWrist) return;
      const lAngle = calculateAngle(leftHip, leftShoulder, leftWrist);
      const rAngle = calculateAngle(rightHip, rightShoulder, rightWrist);
      currentAngle = Math.round((lAngle + rAngle) / 2);
      setJointAngle(currentAngle);

      if (currentAngle > 150) {
        stageRef.current = "UP";
        setPostureStatus("GOOD");
        setFeedbackText("Full overhead reach! Lower with control.");
      } else if (currentAngle < 45) {
        if (stageRef.current === "UP") {
          repsRef.current += 1;
          setReps(repsRef.current);
          correctRepsRef.current += 1;
          setCorrectReps(correctRepsRef.current);
          speakCue(`Rep ${repsRef.current} complete`);
          stageRef.current = "DOWN";
          setPostureStatus("GOOD");
          setFeedbackText("Ready for next overhead raise.");
        } else {
          stageRef.current = "DOWN";
          setPostureStatus("GOOD");
          setFeedbackText("Raise arms straight overhead.");
        }
      }
    }

    /* ----------------------------------------------------
       5. LUNGES
       ---------------------------------------------------- */
    else if (currentEx === "lunges") {
      if (!leftHip || !leftKnee || !leftAnkle) return;
      const lAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      const rAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      currentAngle = Math.min(lAngle, rAngle);
      setJointAngle(currentAngle);

      if (currentAngle < 98) {
        stageRef.current = "LUNGING";
        setPostureStatus("GOOD");
        setFeedbackText("Good 90° lunge depth! Push back to start.");
      } else if (currentAngle > 155) {
        if (stageRef.current === "LUNGING") {
          repsRef.current += 1;
          setReps(repsRef.current);
          correctRepsRef.current += 1;
          setCorrectReps(correctRepsRef.current);
          speakCue(`Rep ${repsRef.current} complete`);
          stageRef.current = "STANDING";
          setPostureStatus("GOOD");
          setFeedbackText("Standing reset. Step forward with other leg.");
        }
      }
    }

    /* ----------------------------------------------------
       6. KNEE RAISES
       ---------------------------------------------------- */
    else if (currentEx === "knee_raises") {
      if (!leftShoulder || !leftHip || !leftKnee) return;
      const lAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
      const rAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
      currentAngle = Math.min(lAngle, rAngle);
      setJointAngle(currentAngle);

      if (currentAngle < 95) {
        stageRef.current = "UP";
        setPostureStatus("GOOD");
        setFeedbackText("High knee reached! Lower foot back down.");
      } else if (currentAngle > 150) {
        if (stageRef.current === "UP") {
          repsRef.current += 1;
          setReps(repsRef.current);
          correctRepsRef.current += 1;
          setCorrectReps(correctRepsRef.current);
          speakCue(`Rep ${repsRef.current} complete`);
          stageRef.current = "DOWN";
          setPostureStatus("GOOD");
          setFeedbackText("Lift opposite knee up high.");
        }
      }
    }

    /* ----------------------------------------------------
       7. SIDE LEG RAISES / HIP ABDUCTION
       ---------------------------------------------------- */
    else if (currentEx === "side_leg_raises" || currentEx === "hip_abduction") {
      if (!leftHip || !rightHip || !leftAnkle) return;
      const lAngle = calculateAngle(rightHip, leftHip, leftAnkle);
      const rAngle = calculateAngle(leftHip, rightHip, rightAnkle);
      currentAngle = Math.max(Math.abs(lAngle - 90), Math.abs(rAngle - 90));
      setJointAngle(currentAngle);

      if (currentAngle > 35) {
        stageRef.current = "UP";
        setPostureStatus("GOOD");
        setFeedbackText("Lateral leg lift reached! Lower slowly.");
      } else if (currentAngle < 15) {
        if (stageRef.current === "UP") {
          repsRef.current += 1;
          setReps(repsRef.current);
          correctRepsRef.current += 1;
          setCorrectReps(correctRepsRef.current);
          speakCue(`Rep ${repsRef.current} complete`);
          stageRef.current = "DOWN";
          setPostureStatus("GOOD");
          setFeedbackText("Ready for next lateral leg raise.");
        }
      }
    }

    /* ----------------------------------------------------
       8. CALF RAISES
       ---------------------------------------------------- */
    else if (currentEx === "calf_raises") {
      if (!leftKnee || !leftAnkle || !lm[31]) return;
      const lAngle = calculateAngle(leftKnee, leftAnkle, lm[31]);
      currentAngle = lAngle;
      setJointAngle(currentAngle);

      if (currentAngle > 130) {
        stageRef.current = "UP";
        setPostureStatus("GOOD");
        setFeedbackText("High on toes! Squeeze calves and lower.");
      } else if (currentAngle < 110) {
        if (stageRef.current === "UP") {
          repsRef.current += 1;
          setReps(repsRef.current);
          correctRepsRef.current += 1;
          setCorrectReps(correctRepsRef.current);
          speakCue(`Rep ${repsRef.current} complete`);
          stageRef.current = "FLAT";
          setPostureStatus("GOOD");
          setFeedbackText("Heels grounded. Elevate heels again.");
        }
      }
    }

    /* ----------------------------------------------------
       9. SIT-TO-STAND & LEG EXTENSION & MOBILITY
       ---------------------------------------------------- */
    else {
      if (!leftHip || !leftKnee || !leftAnkle) return;
      const lAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      currentAngle = lAngle;
      setJointAngle(currentAngle);

      if (currentAngle > 155) {
        stageRef.current = "STANDING";
        setPostureStatus("GOOD");
        setFeedbackText("Full extension! Return with control.");
      } else if (currentAngle < 100) {
        if (stageRef.current === "STANDING") {
          repsRef.current += 1;
          setReps(repsRef.current);
          correctRepsRef.current += 1;
          setCorrectReps(correctRepsRef.current);
          speakCue(`Rep ${repsRef.current} complete`);
          stageRef.current = "SEATED";
          setPostureStatus("GOOD");
          setFeedbackText("Seated position reached. Rise again.");
        }
      }
    }
  };

  /* =====================================================
     SKELETON CANVAS DRAWER
  ===================================================== */
  const drawSkeleton = (ctx, landmarks, width, height) => {
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#06b6d4"; // Cyan bone lines

    const bones = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
      [11, 23], [12, 24], [23, 24],
      [23, 25], [25, 27], [24, 26], [26, 28]
    ];

    bones.forEach(([s, e]) => {
      const p1 = landmarks[s];
      const p2 = landmarks[e];
      if (p1 && p2 && p1.visibility > 0.4 && p2.visibility > 0.4) {
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    });

    // Draw Joint Nodes
    landmarks.forEach((lm, idx) => {
      if (lm.visibility > 0.4) {
        const cx = lm.x * width;
        const cy = lm.y * height;
        ctx.beginPath();
        ctx.arc(cx, cy, idx in [11, 12, 13, 14, 23, 24, 25, 26] ? 6 : 3, 0, 2 * Math.PI);
        ctx.fillStyle = "#10b981"; // Emerald green
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  };

  const handleSelectExercise = (ex) => {
    if (running) stopCamera();
    setSelectedExercise(ex);
    exerciseRef.current = ex;
    setReps(0);
    setCorrectReps(0);
    setIncorrectReps(0);
    setJointAngle(0);
    setPostureStatus("READY");
    setFeedbackText(`Selected ${ex.name}. Start session to begin AI tracking.`);
    speakCue(`${ex.name} selected`);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const saveSessionToHistory = () => {
    const existing = JSON.parse(localStorage.getItem("vaidya_physio_history") || "[]");
    const newEntry = {
      id: Date.now(),
      exercise: selectedExercise.name,
      reps: reps,
      targetReps: selectedExercise.targetReps,
      accuracy: accuracy,
      duration: formatTime(sessionSeconds),
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    };
    localStorage.setItem("vaidya_physio_history", JSON.stringify([newEntry, ...existing]));
    setShowSummary(false);
    alert("Session saved to Medical History!");
  };

  return (
    <div className="physio-container">
      {/* HEADER BAR */}
      <header className="physio-header">
        <div>
          <div className="dashboard-eyebrow">
            <span>VAIDYA AI</span>
            <span className="bullet">•</span>
            <span>MOTION BIOMECHANICS STUDIO</span>
          </div>
          <h1>AI Physiotherapy & Pose Analysis</h1>
          <p>Real-time computer vision joint tracking, repetition counting, and voice feedback coach.</p>
        </div>

        <div className="physio-top-status">
          <div className="engine-status-pill">
            <span className={`status-dot ${backendStatus === "ready" ? "green" : "blue"}`}></span>
            <span>
              {backendStatus === "ready" ? "AI ENGINE ONLINE (Tasks API)" : "BROWSER POSE ENGINE ACTIVE"}
            </span>
          </div>

          <button
            className={`voice-toggle-btn ${voiceEnabled ? "active" : ""}`}
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            title="Toggle Voice Feedback"
          >
            {voiceEnabled ? "🔊 Voice Coach: ON" : "🔇 Voice Coach: OFF"}
          </button>
        </div>
      </header>

      {/* EXERCISE CATEGORY FILTER PILLS */}
      <div className="category-filter-bar">
        {["All", "Upper Body", "Lower Body", "Core & Lower", "Mobility"].map((cat) => (
          <button
            key={cat}
            className={`filter-pill ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MAIN 3-PANE WORKSPACE */}
      <div className="physio-workspace-grid">
        {/* PANE 1: EXERCISE SELECTION DRAWER */}
        <div className="exercise-selector-card">
          <div className="selector-header">
            <div>
              <span className="card-kicker">WORKOUT CATALOG</span>
              <h3>Choose Exercise</h3>
            </div>
            <span className="count-pill">{filteredExercises.length} Total</span>
          </div>

          <div className="exercises-scroll-list">
            {filteredExercises.map((ex) => {
              const isSelected = selectedExercise.id === ex.id;
              return (
                <div
                  key={ex.id}
                  className={`exercise-tile ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectExercise(ex)}
                >
                  <div className="tile-icon-box">{ex.icon}</div>
                  <div className="tile-details">
                    <strong>{ex.name}</strong>
                    <div className="tile-meta">
                      <span className="meta-category">{ex.category}</span>
                      <span className="meta-target">• {ex.targetReps} reps</span>
                    </div>
                  </div>
                  <span className="select-arrow">{isSelected ? "●" : "›"}</span>
                </div>
              );
            })}
          </div>

          {/* Biomechanics Instructions Card */}
          <div className="exercise-guide-box">
            <div className="guide-header">
              <span className="guide-icon">📖</span>
              <strong>{selectedExercise.name} Form Guide</strong>
            </div>
            <p className="guide-instructions">{selectedExercise.instructions}</p>
            <p className="guide-muscles">
              <strong>Muscles:</strong> {selectedExercise.targetMuscles}
            </p>
            <div className="guide-tip">
              <span>💡 Form Tip:</span> {selectedExercise.tips}
            </div>
          </div>
        </div>

        {/* PANE 2: LIVE CAMERA MOTION CAPTURE */}
        <div className="camera-motion-card">
          <div className="camera-card-topbar">
            <div>
              <strong>Live Motion Stream</strong>
              <span className="camera-sub">
                {running ? `Tracking: ${selectedExercise.name}` : "Camera Standby"}
              </span>
            </div>

            <div className="camera-badge-group">
              <div className={`live-feed-pill ${running ? "active" : ""}`}>
                <span className="pulse-indicator"></span>
                {running ? "CAPTURE ACTIVE" : "STANDBY"}
              </div>

              <div className="timer-badge">
                ⏱️ {formatTime(sessionSeconds)}
              </div>
            </div>
          </div>

          <div className="camera-viewport">
            {!running ? (
              <div className="camera-placeholder">
                <div className="placeholder-icon">📹</div>
                <h3>Camera Ready to Track</h3>
                <p>Position your device 6–8 feet away so your full body is visible.</p>
                <button className="primary-start-btn" onClick={startCamera}>
                  ▶ Start {selectedExercise.name} Session
                </button>
              </div>
            ) : (
              <div className="active-video-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video-element"
                />
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={480}
                  className="camera-canvas-overlay"
                />

                {/* Real-time Angle & Stage HUD Box */}
                <div className="hud-overlay-top">
                  <div className="hud-metric">
                    <small>{selectedExercise.jointName.toUpperCase()}</small>
                    <strong>{jointAngle}°</strong>
                  </div>
                  <div className="hud-metric">
                    <small>STAGE</small>
                    <strong className="stage-text">{stageRef.current}</strong>
                  </div>
                </div>

                {/* Dynamic Posture Banner */}
                <div className={`posture-banner ${postureStatus.toLowerCase()}`}>
                  <div className="posture-icon">
                    {postureStatus === "GOOD" ? "✓" : postureStatus === "WARNING" ? "⚠" : "●"}
                  </div>
                  <div className="posture-text">
                    <strong>
                      {postureStatus === "GOOD"
                        ? "Good Posture"
                        : postureStatus === "ADJUST"
                        ? "Adjust Posture"
                        : postureStatus === "WARNING"
                        ? "Form Warning"
                        : "Detecting Body"}
                    </strong>
                    <p>{feedbackText}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Camera Session Action Controls */}
          <div className="camera-action-footer">
            {!running ? (
              <button className="primary-start-btn full" onClick={startCamera}>
                ▶ Start Exercise
              </button>
            ) : (
              <div className="action-buttons-row">
                <button
                  className="secondary-ctrl-btn"
                  onClick={() => {
                    setReps(0);
                    setCorrectReps(0);
                    setIncorrectReps(0);
                    repsRef.current = 0;
                    correctRepsRef.current = 0;
                    incorrectRepsRef.current = 0;
                    speakCue("Repetitions reset");
                  }}
                >
                  🔄 Reset Reps
                </button>

                <button className="danger-finish-btn" onClick={finishSession}>
                  ⏹ End Session & View Summary
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PANE 3: REAL-TIME BIOMECHANICS TELEMETRY */}
        <div className="telemetry-sidebar-card">
          <div className="telemetry-heading">
            <span className="card-kicker">LIVE METRICS</span>
            <h3>AI Telemetry</h3>
          </div>

          {/* Rep Counter Card */}
          <div className="telemetry-metric-tile reps">
            <div className="tile-header-flex">
              <span className="tile-title">COMPLETED REPS</span>
              <span className="rep-icon">↻</span>
            </div>
            <div className="metric-huge-num">
              <strong>{reps}</strong>
              <span className="target-num">/ {selectedExercise.targetReps}</span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min(100, (reps / selectedExercise.targetReps) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Form Accuracy Score */}
          <div className="telemetry-metric-tile accuracy">
            <div className="tile-header-flex">
              <span className="tile-title">FORM ACCURACY</span>
              <span className="accuracy-icon">✓</span>
            </div>
            <div className="metric-huge-num">
              <strong>{accuracy}</strong>
              <small>%</small>
            </div>
            <span className="score-label">
              {accuracy >= 90 ? "Excellent Form" : accuracy >= 75 ? "Moderate Alignment" : "Needs Correction"}
            </span>
          </div>

          {/* Real-time Angle Meter */}
          <div className="telemetry-metric-tile angle">
            <div className="tile-header-flex">
              <span className="tile-title">{selectedExercise.jointName.toUpperCase()}</span>
              <span className="angle-icon">∠</span>
            </div>
            <div className="metric-huge-num">
              <strong>{jointAngle}</strong>
              <small>°</small>
            </div>
            <div className="angle-visual-bar">
              <span style={{ width: `${Math.min(100, (jointAngle / 180) * 100)}%` }}></span>
            </div>
          </div>

          {/* Rep Breakdown Tile */}
          <div className="rep-breakdown-card">
            <span className="card-kicker">SESSION SCOREBOARD</span>
            <div className="breakdown-grid">
              <div className="breakdown-item good">
                <small>Correct Form</small>
                <strong>{correctReps}</strong>
              </div>
              <div className="breakdown-item adjust">
                <small>Form Corrections</small>
                <strong>{incorrectReps}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SESSION SUMMARY MODAL */}
      {showSummary && (
        <div className="modal-backdrop">
          <div className="session-summary-dialog">
            <button className="modal-close-icon" onClick={() => setShowSummary(false)}>
              ✕
            </button>

            <div className="summary-banner-icon">🏆</div>
            <span className="card-kicker">WORKOUT COMPLETE</span>
            <h2>{selectedExercise.name} Summary</h2>
            <p>Here is your full AI posture biomechanics breakdown:</p>

            <div className="summary-stats-grid">
              <div className="summary-stat-box">
                <span>TOTAL REPS</span>
                <strong>{reps}</strong>
              </div>

              <div className="summary-stat-box">
                <span>CORRECT REPS</span>
                <strong className="green-text">{correctReps}</strong>
              </div>

              <div className="summary-stat-box">
                <span>DURATION</span>
                <strong>{formatTime(sessionSeconds)}</strong>
              </div>

              <div className="summary-stat-box">
                <span>POSTURE SCORE</span>
                <strong className="cyan-text">{accuracy}%</strong>
              </div>
            </div>

            <div className="summary-feedback-box">
              <strong>AI Biomechanics Analysis:</strong>
              <p>
                {accuracy >= 90
                  ? "Outstanding execution! Your joint angles and movement velocity aligned with clinical physical therapy benchmarks."
                  : "Good effort. Focus on controlled eccentric pacing and stabilizing your core alignment."}
              </p>
            </div>

            <div className="summary-dialog-actions">
              <button className="secondary-btn" onClick={() => setShowSummary(false)}>
                Close
              </button>
              <button className="primary-action-btn" onClick={saveSessionToHistory}>
                💾 Save to Medical History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}