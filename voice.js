document.addEventListener("DOMContentLoaded", () => {
  if (typeof requireAuth === "function") requireAuth();

  const role = typeof getCurrentRole === "function" ? getCurrentRole() : null;
  if (role !== "senior") {
    window.location.href = "dashboard.html";
    return;
  }

  const statusEl = document.getElementById("voiceStatus");
  const supportNoteEl = document.getElementById("voiceSupportNote");
  const cardsContainer = document.getElementById("voiceCards");
  const manualInputBox = document.getElementById("manualInputBox");
  const manualAction = document.getElementById("manualAction");
  const manualTranscript = document.getElementById("manualTranscript");
  const manualProcess = document.getElementById("manualProcess");
  const confirmBox = document.getElementById("confirmBox");
  const confirmText = document.getElementById("confirmText");
  const confirmSave = document.getElementById("confirmSave");
  const confirmCancel = document.getElementById("confirmCancel");
  const confirmOverlay = document.getElementById("confirmOverlay");


  const support = detectVoiceSupport();
  const voiceOutput = createVoiceOutput(support);

  if (!window.isSecureContext) {
    setStatus("Voice input requires HTTPS (or localhost).", "error");
  }

  showCompatibilityMessage();
  checkMicrophonePermission();

  let recognition = null;
  let pendingSave = null;
  let activeButton = null;
  let recognizedText = "";

  const WORD_TO_NUMBER = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
    thousand: 1000,
    point: "."
  };

  function detectVoiceSupport() {
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    const isIOS = /iPhone|iPad|iPod/.test(ua) || (platform === "MacIntel" && maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isHuaweiBrowser = /HuaweiBrowser|HMSCore|HONOR/i.test(ua);

    return {
      recognitionCtor: window.SpeechRecognition || window.webkitSpeechRecognition || null,
      hasSpeechSynthesis: typeof window.speechSynthesis !== "undefined",
      hasUtterance: typeof window.SpeechSynthesisUtterance !== "undefined",
      isIOS,
      isSafari,
      isHuaweiBrowser
    };
  }

  function createVoiceOutput(capabilities) {
    const canSpeak = capabilities.hasSpeechSynthesis && capabilities.hasUtterance;
    let preferredVoice = null;

    if (!canSpeak) {
      return { canSpeak: false, speak: () => {} };
    }

    const loadVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const language = (navigator.language || "en-US").toLowerCase();
      preferredVoice =
        voices.find((voice) => voice.lang && voice.lang.toLowerCase() === language) ||
        voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith(language.split("-")[0])) ||
        voices.find((voice) => /en/i.test(voice.lang || "")) ||
        voices[0] ||
        null;
    };

    loadVoice();
    if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
      window.speechSynthesis.onvoiceschanged = loadVoice;
    }

    return {
      canSpeak,
      speak(message, fromGesture = false) {
        if (!message || !fromGesture) return;

        try {
          const utterance = new SpeechSynthesisUtterance(message);
          utterance.lang = navigator.language || "en-US";
          if (preferredVoice) utterance.voice = preferredVoice;
          utterance.rate = 1;
          utterance.pitch = 1;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.warn("[voice] Speech synthesis failed:", error);
        }
      }
    };
  }

  function setStatus(message, type = "info", speakFromGesture = false) {
    statusEl.textContent = message;
    statusEl.style.color = type === "error" ? "#b91c1c" : (type === "success" ? "#166534" : "#111827");

    if ((type === "success" || type === "error") && voiceOutput.canSpeak) {
      voiceOutput.speak(message, speakFromGesture);
    }
  }

  function showCompatibilityMessage() {
    if (support.isIOS && support.isSafari && !support.recognitionCtor) {
      supportNoteEl.textContent = "iOS Safari does not provide Web Speech recognition. Manual input is enabled.";
      manualInputBox.classList.remove("hidden");
      disableVoiceButtons();
      return;
    }

    if (support.isHuaweiBrowser && !support.recognitionCtor) {
      supportNoteEl.textContent = "Huawei Browser/WebView has limited speech recognition support. Manual input is enabled.";
      manualInputBox.classList.remove("hidden");
      disableVoiceButtons();
      return;
    }

    if (!support.recognitionCtor) {
      supportNoteEl.textContent = "Speech recognition is unavailable in this browser. Use manual input.";
      manualInputBox.classList.remove("hidden");
      disableVoiceButtons();
      return;
    }

    supportNoteEl.textContent = "Voice recognition is available. Tap a card to start listening.";
    if (!voiceOutput.canSpeak) {
      supportNoteEl.textContent += " Spoken feedback is unavailable on this browser.";
    }
  }

  function disableVoiceButtons() {
    cardsContainer.querySelectorAll("button").forEach((btn) => {
      btn.disabled = true;
      btn.classList.remove("listening");
    });
  }

  async function checkMicrophonePermission() {
    if (!support.recognitionCtor || !navigator.permissions || !navigator.permissions.query) return;

    try {
      const permission = await navigator.permissions.query({ name: "microphone" });
      if (permission.state === "denied") {
        setStatus("Microphone access is blocked. Enable it in browser settings.", "error");
      }
      permission.onchange = () => {
        if (permission.state === "denied") {
          setStatus("Microphone access was denied. Use manual input or browser settings.", "error");
        }
      };
    } catch (error) {
      console.info("[voice] Microphone permission state API unavailable:", error);
    }
  }

  function getVitals() {
    try {
      const list = JSON.parse(localStorage.getItem("vitals")) || [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function createVitalsEntry(partial) {
    const history = getVitals();
    const latest = history.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || {};
    const entry = {
      bp: partial.bp ?? latest.bp ?? "",
      hr: Number(partial.hr ?? latest.hr ?? 0),
      temp: Number(partial.temp ?? latest.temp ?? 0),
      sl: Number(partial.sl ?? latest.sl ?? 0),
      timestamp: new Date().toISOString()
    };

    history.push(entry);
    localStorage.setItem("vitals", JSON.stringify(history));
  }

  function parseNumber(text) {
    const m = text.match(/\d+(?:\.\d+)?/);
    if (m) return Number(m[0]);

    const normalized = text.toLowerCase().replace(/-/g, " ").replace(/ and /g, " ");
    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (!tokens.length) return null;

    let total = 0;
    let current = 0;
    let decimal = "";
    let inDecimal = false;

    for (const token of tokens) {
      if (!(token in WORD_TO_NUMBER)) continue;
      const value = WORD_TO_NUMBER[token];

      if (value === ".") {
        inDecimal = true;
        continue;
      }

      if (inDecimal) {
        decimal += String(value);
        continue;
      }

      if (value === 1000) {
        current *= value;
        total += current;
        current = 0;
        continue;
      }

      if (value === 100) {
        current = (current || 1) * value;
        continue;
      }

      current += value;
    }

    const intPart = total + current;
    if (intPart === 0 && !decimal) return null;
    return Number(decimal ? `${intPart}.${decimal}` : intPart);
  }

  function parseBloodPressure(text) {
    const rawNormalized = text
      .toLowerCase()
      .replace(/\s+/g, " ");
    const normalized = rawNormalized.replace(/\bslash\b/g, "/").replace(/\bover\b/g, "/");
    const slash = normalized.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
    if (slash) return `${slash[1]}/${slash[2]}`;

    const overWords = normalized.match(/([a-z\s-]+)\s*\/\s*([a-z\s-]+)/);
    if (overWords) {
      const systolic = parseNumber(overWords[1]);
      const diastolic = parseNumber(overWords[2]);
      if (systolic && diastolic) return `${systolic}/${diastolic}`;
    }

    const nums = normalized.match(/\d{2,3}/g);
    if (nums && nums.length >= 2) return `${nums[0]}/${nums[1]}`;

    const tokens = rawNormalized.split(/\s+/);
    const overIndex = tokens.findIndex((t) => t === "over");
    if (overIndex > 0 && overIndex < tokens.length - 1) {
      const systolic = parseNumber(tokens.slice(0, overIndex).join(" "));
      const diastolic = parseNumber(tokens.slice(overIndex + 1).join(" "));
      if (systolic && diastolic) return `${systolic}/${diastolic}`;
    }

    return null;
  }

  function parseMedicine(text) {
    const clean = text.replace(/[.,!?]/g, "").trim();
    if (!clean) return null;

    const timeMatch = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    let time = new Date().toTimeString().slice(0, 5);
    if (timeMatch) {
      let hour = Number(timeMatch[1]);
      const min = Number(timeMatch[2] || 0);
      const mer = (timeMatch[3] || "").toLowerCase();
      if (mer === "pm" && hour < 12) hour += 12;
      if (mer === "am" && hour === 12) hour = 0;
      time = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }

    const doseMatch = clean.match(/(\d+\s?(mg|ml|mcg|tablet|tab|capsule|drop)s?)/i);
    const dosage = doseMatch ? doseMatch[1] : "";
    let name = clean;
    if (doseMatch) name = name.replace(doseMatch[0], "").trim();
    if (timeMatch) name = name.replace(timeMatch[0], "").trim();
    if (!name) return null;

    return { name, dosage, time };
  }

  function saveMedicine(med) {
    const medicines = JSON.parse(localStorage.getItem("medicines")) || [];
    medicines.push({
      id: Date.now(),
      name: med.name,
      dosage: med.dosage,
      time: med.time,
      taken: false,
      notified: false
    });
    localStorage.setItem("medicines", JSON.stringify(medicines));
  }

  function markMedicineTakenByName(name) {
    const medicines = JSON.parse(localStorage.getItem("medicines")) || [];
    const target = medicines.find((m) => m.name.toLowerCase().includes(name.toLowerCase()));
    if (!target) return false;
    target.taken = true;
    localStorage.setItem("medicines", JSON.stringify(medicines));
    return true;
  }

  function promptConfirm(message, onConfirm) {
    confirmText.textContent = message;
    confirmOverlay.classList.remove("hidden");
    pendingSave = onConfirm;
  }

  confirmSave.addEventListener("click", () => {
    if (pendingSave) pendingSave();
    pendingSave = null;
    confirmOverlay.classList.add("hidden");
    setStatus("Saved successfully!", "success", true);
  });

  confirmCancel.addEventListener("click", () => {
    pendingSave = null;
    confirmOverlay.classList.add("hidden");
    setStatus("Cancelled. You can try again.");
  });

  function createRecognition() {
    if (!support.recognitionCtor) return null;
    const instance = new support.recognitionCtor();
    instance.lang = navigator.language || "en-US";
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    return instance;
  }

  function runRecognition(action, button) {
    if (!support.recognitionCtor) {
      setStatus("This browser does not support speech recognition. Please use manual input.", "error", true);
      manualInputBox.classList.remove("hidden");
      return;
    }

    if (recognition) recognition.abort();
    recognition = createRecognition();
    recognizedText = "";

    if (activeButton) activeButton.classList.remove("listening");
    activeButton = button;
    activeButton.classList.add("listening");
    setStatus("Listening...");

    recognition.onresult = (event) => {
      const transcript = (event.results[0][0].transcript || "").trim();
      recognizedText = transcript;
      activeButton.classList.remove("listening");
      handleTranscript(action, transcript, true);
    };

    recognition.onerror = (event) => {
      activeButton.classList.remove("listening");
      const errorCode = event?.error || "unknown";
      console.warn("[voice] Recognition error:", errorCode, event);

      const byCode = {
        "not-allowed": "Microphone permission denied. Enable microphone access and try again.",
        "service-not-allowed": "Speech service is unavailable in this browser.",
        "audio-capture": "No microphone detected. Please connect/enable a microphone.",
        network: "Network issue while recognizing speech. Check connection and retry.",
        "no-speech": "No speech detected. Please speak clearly and try again.",
        "aborted": "Voice listening was cancelled. Tap again to retry."
      };
      setStatus(byCode[errorCode] || "Could not understand speech. Please try again.", "error", true);

      if (errorCode === "service-not-allowed" || errorCode === "not-allowed") {
        manualInputBox.classList.remove("hidden");
      }
    };

    recognition.onnomatch = () => {
      activeButton.classList.remove("listening");
      setStatus("Could not understand. Please try again.", "error", true);
    };

    recognition.onend = () => {
      if (activeButton) activeButton.classList.remove("listening");
      if (!recognizedText) {
        setStatus("No speech detected. Allow microphone permission and try again.", "error");
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.warn("[voice] Failed to start recognition:", error);
      setStatus("Voice could not start on this browser session. Use manual input below.", "error", true);
      manualInputBox.classList.remove("hidden");
    }
  }

  function handleTranscript(action, text, fromGesture = false) {
    if (!text) {
      setStatus("Could not understand. Please try again.", "error", fromGesture);
      return;
    }

    if (action === "heartRate") {
      const hr = parseNumber(text);
      if (!hr) return setStatus("No number detected. Please try again.", "error", fromGesture);
      promptConfirm(`You said: ${hr} bpm. Save this?`, () => createVitalsEntry({ hr }));
      return;
    }

    if (action === "bloodPressure") {
      const bp = parseBloodPressure(text);
      if (!bp) return setStatus("No blood pressure value detected. Please try again.", "error", fromGesture);
      promptConfirm(`You said: ${bp}. Save this?`, () => createVitalsEntry({ bp }));
      return;
    }

    if (action === "sugarLevel") {
      const sl = parseNumber(text);
      if (!sl) return setStatus("No number detected. Please try again.", "error", fromGesture);
      promptConfirm(`You said: ${sl} mg/dl. Save this?`, () => createVitalsEntry({ sl }));
      return;
    }

    if (action === "temperature") {
      const temp = parseNumber(text);
      if (!temp) return setStatus("No temperature detected. Please try again.", "error", fromGesture);
      promptConfirm(`You said: ${temp} °C. Save this?`, () => createVitalsEntry({ temp }));
      return;
    }

    if (action === "medicine") {
      const med = parseMedicine(text);
      if (!med) return setStatus("Could not detect medicine details. Please try again.", "error", fromGesture);
      promptConfirm(`You said: ${med.name}${med.dosage ? ` (${med.dosage})` : ""} at ${med.time}. Save this?`, () => saveMedicine(med));
      return;
    }

    if (action === "markTaken") {
      const med = parseMedicine(text);
      if (!med?.name) return setStatus("Could not detect medicine name. Please try again.", "error", fromGesture);
      promptConfirm(`You said: mark ${med.name} as taken. Save this?`, () => {
        const ok = markMedicineTakenByName(med.name);
        if (!ok) setStatus("Medicine not found. Please try the exact name.", "error", fromGesture);
      });
    }
  }

  document.querySelectorAll(".voice-card").forEach((button) => {
    button.addEventListener("click", () => runRecognition(button.dataset.action, button));
  });

  manualProcess.addEventListener("click", () => {
    const text = manualTranscript.value.trim();
    if (!text) {
      setStatus("Type the details first, then submit.", "error", true);
      return;
    }

    handleTranscript(manualAction.value, text, true);
  });
});
