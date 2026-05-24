/**
 * babbled notes v2 — Real AI Test Runner
 * Fires synthetic DSP digests at /api/interpret and logs every Gemini response.
 * No fabricated results — each entry is a live API call.
 */

import fs from "fs";

const ENDPOINT = "http://localhost:3000/api/interpret";
const OUT_FILE  = "test-results.json";

// ─── Disability profiles × difficulty levels ───────────────────────────────
// Each test case simulates what a specific user would produce through the mic.

const TESTS = [

  // ── NON-VERBAL DISABILITIES ────────────────────────────────────────────────

  // Autism — breath / single sustained tone
  { id: "NV-01", label: "Autism — slow exhale breath (beginner)",
    profile: "non-verbal autism", difficulty: "beginner",
    digest: { duration: 2.1, dominantFreq: 180, dominantPitch: "F3", avgAmplitude: 0.04,
      events: [{ time: 0.1, frequency: 180, pitchName: "F3", amplitude: 0.04 }] } },

  { id: "NV-02", label: "Autism — single sustained hum (beginner)",
    profile: "non-verbal autism", difficulty: "beginner",
    digest: { duration: 3.0, dominantFreq: 220, dominantPitch: "A3", avgAmplitude: 0.11,
      events: [{ time: 0.0, frequency: 220, pitchName: "A3", amplitude: 0.11 }] } },

  { id: "NV-03", label: "Autism — two-tone hum shift (intermediate)",
    profile: "non-verbal autism", difficulty: "intermediate",
    digest: { duration: 4.2, dominantFreq: 261, dominantPitch: "C4", avgAmplitude: 0.13,
      events: [
        { time: 0.0, frequency: 220, pitchName: "A3", amplitude: 0.12 },
        { time: 2.1, frequency: 261, pitchName: "C4", amplitude: 0.14 },
      ] } },

  { id: "NV-04", label: "Autism — melodic hum phrase (advanced)",
    profile: "non-verbal autism", difficulty: "advanced",
    digest: { duration: 6.0, dominantFreq: 330, dominantPitch: "E4", avgAmplitude: 0.15,
      events: [
        { time: 0.0, frequency: 220, pitchName: "A3", amplitude: 0.12 },
        { time: 1.5, frequency: 261, pitchName: "C4", amplitude: 0.14 },
        { time: 3.0, frequency: 330, pitchName: "E4", amplitude: 0.16 },
        { time: 4.5, frequency: 392, pitchName: "G4", amplitude: 0.15 },
      ] } },

  // Apraxia of speech — disrupted phonation, inconsistent onset
  { id: "NV-05", label: "Apraxia — disrupted single vowel (beginner)",
    profile: "apraxia of speech", difficulty: "beginner",
    digest: { duration: 1.8, dominantFreq: 196, dominantPitch: "G3", avgAmplitude: 0.08,
      events: [
        { time: 0.2, frequency: 196, pitchName: "G3", amplitude: 0.08 },
        { time: 0.9, frequency: 185, pitchName: "F#3", amplitude: 0.06 },
      ] } },

  { id: "NV-06", label: "Apraxia — broken phonation bursts (intermediate)",
    profile: "apraxia of speech", difficulty: "intermediate",
    digest: { duration: 4.5, dominantFreq: 246, dominantPitch: "B3", avgAmplitude: 0.09,
      events: [
        { time: 0.3, frequency: 246, pitchName: "B3", amplitude: 0.10 },
        { time: 1.4, frequency: 220, pitchName: "A3", amplitude: 0.07 },
        { time: 2.8, frequency: 261, pitchName: "C4", amplitude: 0.11 },
      ] } },

  { id: "NV-07", label: "Apraxia — vowel glide attempt (advanced)",
    profile: "apraxia of speech", difficulty: "advanced",
    digest: { duration: 5.0, dominantFreq: 293, dominantPitch: "D4", avgAmplitude: 0.10,
      events: [
        { time: 0.0, frequency: 220, pitchName: "A3", amplitude: 0.09 },
        { time: 1.0, frequency: 246, pitchName: "B3", amplitude: 0.10 },
        { time: 2.2, frequency: 261, pitchName: "C4", amplitude: 0.11 },
        { time: 3.5, frequency: 293, pitchName: "D4", amplitude: 0.10 },
        { time: 4.2, frequency: 329, pitchName: "E4", amplitude: 0.09 },
      ] } },

  // Selective mutism — only breath / near-silent inputs
  { id: "NV-08", label: "Selective mutism — barely audible breath (beginner)",
    profile: "selective mutism", difficulty: "beginner",
    digest: { duration: 2.5, dominantFreq: 120, dominantPitch: "B2", avgAmplitude: 0.02,
      events: [{ time: 0.5, frequency: 120, pitchName: "B2", amplitude: 0.02 }] } },

  { id: "NV-09", label: "Selective mutism — nose exhale rhythm (intermediate)",
    profile: "selective mutism", difficulty: "intermediate",
    digest: { duration: 4.0, dominantFreq: 110, dominantPitch: "A2", avgAmplitude: 0.03,
      events: [
        { time: 0.0, frequency: 110, pitchName: "A2", amplitude: 0.03 },
        { time: 2.0, frequency: 110, pitchName: "A2", amplitude: 0.03 },
      ] } },

  // ── PHYSICAL DISABILITIES ──────────────────────────────────────────────────

  // Cerebral palsy — tremor-affected tapping, irregular timing
  { id: "PH-01", label: "Cerebral palsy — single finger tap (beginner)",
    profile: "cerebral palsy", difficulty: "beginner",
    digest: { duration: 1.5, dominantFreq: 900, dominantPitch: "A5", avgAmplitude: 0.22,
      events: [{ time: 0.4, frequency: 900, pitchName: "A5", amplitude: 0.22 }],
      tempo: 40 } },

  { id: "PH-02", label: "Cerebral palsy — tremor tap cluster (intermediate)",
    profile: "cerebral palsy", difficulty: "intermediate",
    digest: { duration: 3.5, dominantFreq: 850, dominantPitch: "G#5", avgAmplitude: 0.18,
      events: [
        { time: 0.3, frequency: 900, pitchName: "A5",  amplitude: 0.22 },
        { time: 0.5, frequency: 820, pitchName: "G#5", amplitude: 0.15 },
        { time: 1.9, frequency: 880, pitchName: "A5",  amplitude: 0.20 },
        { time: 2.1, frequency: 800, pitchName: "G5",  amplitude: 0.14 },
      ], tempo: 60 } },

  { id: "PH-03", label: "Cerebral palsy — intentional beat pattern (advanced)",
    profile: "cerebral palsy", difficulty: "advanced",
    digest: { duration: 6.0, dominantFreq: 880, dominantPitch: "A5", avgAmplitude: 0.20,
      events: [
        { time: 0.0, frequency: 880, pitchName: "A5", amplitude: 0.25 },
        { time: 1.0, frequency: 440, pitchName: "A4", amplitude: 0.15 },
        { time: 2.0, frequency: 880, pitchName: "A5", amplitude: 0.23 },
        { time: 3.0, frequency: 440, pitchName: "A4", amplitude: 0.14 },
        { time: 4.0, frequency: 880, pitchName: "A5", amplitude: 0.22 },
        { time: 5.0, frequency: 660, pitchName: "E5", amplitude: 0.18 },
      ], tempo: 60 } },

  // ALS / Motor Neuron Disease — breath control declining, soft input only
  { id: "PH-04", label: "ALS — minimal breath control (beginner)",
    profile: "ALS / motor neuron disease", difficulty: "beginner",
    digest: { duration: 3.0, dominantFreq: 160, dominantPitch: "E3", avgAmplitude: 0.03,
      events: [{ time: 0.8, frequency: 160, pitchName: "E3", amplitude: 0.03 }] } },

  { id: "PH-05", label: "ALS — pulsed breath pattern (intermediate)",
    profile: "ALS / motor neuron disease", difficulty: "intermediate",
    digest: { duration: 5.0, dominantFreq: 155, dominantPitch: "Eb3", avgAmplitude: 0.04,
      events: [
        { time: 0.5, frequency: 160, pitchName: "E3", amplitude: 0.04 },
        { time: 2.5, frequency: 155, pitchName: "Eb3", amplitude: 0.03 },
        { time: 4.2, frequency: 165, pitchName: "E3", amplitude: 0.04 },
      ] } },

  // Locked-in syndrome — single switch eye-blink trigger (only one event type)
  { id: "PH-06", label: "Locked-in — single switch click (beginner)",
    profile: "locked-in syndrome", difficulty: "beginner",
    digest: { duration: 2.0, dominantFreq: 1000, dominantPitch: "C6", avgAmplitude: 0.30,
      events: [{ time: 0.5, frequency: 1000, pitchName: "C6", amplitude: 0.30 }],
      tempo: 30 } },

  { id: "PH-07", label: "Locked-in — two-click phrase (intermediate)",
    profile: "locked-in syndrome", difficulty: "intermediate",
    digest: { duration: 4.0, dominantFreq: 1000, dominantPitch: "C6", avgAmplitude: 0.28,
      events: [
        { time: 0.5, frequency: 1000, pitchName: "C6", amplitude: 0.30 },
        { time: 2.5, frequency: 1000, pitchName: "C6", amplitude: 0.26 },
      ], tempo: 30 } },

  { id: "PH-08", label: "Locked-in — morse-style rhythm (advanced)",
    profile: "locked-in syndrome", difficulty: "advanced",
    digest: { duration: 6.0, dominantFreq: 1000, dominantPitch: "C6", avgAmplitude: 0.28,
      events: [
        { time: 0.2, frequency: 1000, pitchName: "C6", amplitude: 0.30 },
        { time: 0.5, frequency: 1000, pitchName: "C6", amplitude: 0.28 },
        { time: 1.5, frequency: 1000, pitchName: "C6", amplitude: 0.30 },
        { time: 3.0, frequency: 1000, pitchName: "C6", amplitude: 0.27 },
        { time: 3.3, frequency: 1000, pitchName: "C6", amplitude: 0.29 },
      ], tempo: 50 } },

  // Quadriplegia — head movement / breath-puff controller
  { id: "PH-09", label: "Quadriplegia — breath-puff single trigger (beginner)",
    profile: "quadriplegia (breath controller)", difficulty: "beginner",
    digest: { duration: 1.5, dominantFreq: 200, dominantPitch: "G3", avgAmplitude: 0.07,
      events: [{ time: 0.1, frequency: 200, pitchName: "G3", amplitude: 0.07 }] } },

  { id: "PH-10", label: "Quadriplegia — hard puff / soft puff contrast (intermediate)",
    profile: "quadriplegia (breath controller)", difficulty: "intermediate",
    digest: { duration: 4.0, dominantFreq: 200, dominantPitch: "G3", avgAmplitude: 0.09,
      events: [
        { time: 0.2, frequency: 200, pitchName: "G3", amplitude: 0.20 },
        { time: 1.5, frequency: 180, pitchName: "F3", amplitude: 0.05 },
        { time: 2.8, frequency: 200, pitchName: "G3", amplitude: 0.22 },
      ] } },

  { id: "PH-11", label: "Quadriplegia — rhythmic breath phrase (advanced)",
    profile: "quadriplegia (breath controller)", difficulty: "advanced",
    digest: { duration: 6.0, dominantFreq: 196, dominantPitch: "G3", avgAmplitude: 0.12,
      events: [
        { time: 0.0, frequency: 200, pitchName: "G3", amplitude: 0.22 },
        { time: 0.8, frequency: 180, pitchName: "F3", amplitude: 0.05 },
        { time: 1.8, frequency: 200, pitchName: "G3", amplitude: 0.20 },
        { time: 2.6, frequency: 180, pitchName: "F3", amplitude: 0.04 },
        { time: 3.6, frequency: 220, pitchName: "A3", amplitude: 0.21 },
        { time: 4.8, frequency: 196, pitchName: "G3", amplitude: 0.18 },
      ], tempo: 70 } },

  // Parkinson's — tremor-affected vocal output
  { id: "PH-12", label: "Parkinson's — tremor hum (beginner)",
    profile: "Parkinson's disease", difficulty: "beginner",
    digest: { duration: 2.5, dominantFreq: 210, dominantPitch: "G#3", avgAmplitude: 0.10,
      events: [
        { time: 0.0, frequency: 215, pitchName: "A3",  amplitude: 0.11 },
        { time: 0.3, frequency: 205, pitchName: "G#3", amplitude: 0.09 },
        { time: 0.6, frequency: 215, pitchName: "A3",  amplitude: 0.10 },
      ] } },

  { id: "PH-13", label: "Parkinson's — vocal tremor melody (advanced)",
    profile: "Parkinson's disease", difficulty: "advanced",
    digest: { duration: 5.0, dominantFreq: 260, dominantPitch: "C4", avgAmplitude: 0.11,
      events: [
        { time: 0.0, frequency: 260, pitchName: "C4",  amplitude: 0.12 },
        { time: 0.2, frequency: 255, pitchName: "B3",  amplitude: 0.10 },
        { time: 1.0, frequency: 290, pitchName: "D4",  amplitude: 0.12 },
        { time: 1.2, frequency: 285, pitchName: "C#4", amplitude: 0.09 },
        { time: 2.4, frequency: 327, pitchName: "E4",  amplitude: 0.13 },
        { time: 3.6, frequency: 390, pitchName: "G4",  amplitude: 0.11 },
      ] } },

  // ── MIXED / CROSS-PROFILE TESTS ────────────────────────────────────────────

  // Whistle — high pitched, clear, usable by many physical disability profiles
  { id: "MX-01", label: "Whistle — single clear pitch (beginner)",
    profile: "general / assistive", difficulty: "beginner",
    digest: { duration: 1.8, dominantFreq: 1046, dominantPitch: "C6", avgAmplitude: 0.35,
      events: [{ time: 0.1, frequency: 1046, pitchName: "C6", amplitude: 0.35 }] } },

  { id: "MX-02", label: "Whistle — two-note call (intermediate)",
    profile: "general / assistive", difficulty: "intermediate",
    digest: { duration: 3.0, dominantFreq: 1046, dominantPitch: "C6", avgAmplitude: 0.33,
      events: [
        { time: 0.1, frequency: 1046, pitchName: "C6", amplitude: 0.35 },
        { time: 1.6, frequency:  880, pitchName: "A5", amplitude: 0.30 },
      ] } },

  { id: "MX-03", label: "Whistle — pentatonic phrase (advanced)",
    profile: "general / assistive", difficulty: "advanced",
    digest: { duration: 5.0, dominantFreq: 1046, dominantPitch: "C6", avgAmplitude: 0.32,
      events: [
        { time: 0.0, frequency: 1046, pitchName: "C6", amplitude: 0.35 },
        { time: 1.0, frequency:  880, pitchName: "A5", amplitude: 0.30 },
        { time: 2.0, frequency:  784, pitchName: "G5", amplitude: 0.28 },
        { time: 3.0, frequency:  659, pitchName: "E5", amplitude: 0.27 },
        { time: 4.0, frequency:  523, pitchName: "C5", amplitude: 0.32 },
      ] } },

  // Tongue click — percussion access, usable without hands or voice
  { id: "MX-04", label: "Tongue click — single percussive event (beginner)",
    profile: "general / assistive", difficulty: "beginner",
    digest: { duration: 1.0, dominantFreq: 2000, dominantPitch: "B6", avgAmplitude: 0.45,
      events: [{ time: 0.2, frequency: 2000, pitchName: "B6", amplitude: 0.45 }],
      tempo: 60 } },

  { id: "MX-05", label: "Tongue click — 4/4 rhythm (intermediate)",
    profile: "general / assistive", difficulty: "intermediate",
    digest: { duration: 4.0, dominantFreq: 2000, dominantPitch: "B6", avgAmplitude: 0.42,
      events: [
        { time: 0.0, frequency: 2000, pitchName: "B6", amplitude: 0.45 },
        { time: 1.0, frequency: 2000, pitchName: "B6", amplitude: 0.40 },
        { time: 2.0, frequency: 2000, pitchName: "B6", amplitude: 0.43 },
        { time: 3.0, frequency: 2000, pitchName: "B6", amplitude: 0.38 },
      ], tempo: 60 } },

  { id: "MX-06", label: "Tongue click — syncopated groove (advanced)",
    profile: "general / assistive", difficulty: "advanced",
    digest: { duration: 4.0, dominantFreq: 2000, dominantPitch: "B6", avgAmplitude: 0.42,
      events: [
        { time: 0.0,  frequency: 2000, pitchName: "B6", amplitude: 0.45 },
        { time: 0.75, frequency: 2000, pitchName: "B6", amplitude: 0.38 },
        { time: 1.5,  frequency: 2000, pitchName: "B6", amplitude: 0.42 },
        { time: 2.25, frequency: 2000, pitchName: "B6", amplitude: 0.40 },
        { time: 3.0,  frequency: 2000, pitchName: "B6", amplitude: 0.44 },
        { time: 3.5,  frequency: 2000, pitchName: "B6", amplitude: 0.36 },
      ], tempo: 80 } },

  // Humming with pitch intention — AAC / pre-verbal users
  { id: "MX-07", label: "AAC user — rising hum intention (intermediate)",
    profile: "AAC / pre-verbal", difficulty: "intermediate",
    digest: { duration: 4.0, dominantFreq: 330, dominantPitch: "E4", avgAmplitude: 0.14,
      events: [
        { time: 0.0, frequency: 220, pitchName: "A3", amplitude: 0.13 },
        { time: 1.3, frequency: 261, pitchName: "C4", amplitude: 0.14 },
        { time: 2.6, frequency: 330, pitchName: "E4", amplitude: 0.15 },
      ] } },

  { id: "MX-08", label: "AAC user — call and response hum (advanced)",
    profile: "AAC / pre-verbal", difficulty: "advanced",
    digest: { duration: 6.0, dominantFreq: 392, dominantPitch: "G4", avgAmplitude: 0.14,
      events: [
        { time: 0.0, frequency: 261, pitchName: "C4", amplitude: 0.14 },
        { time: 1.0, frequency: 330, pitchName: "E4", amplitude: 0.15 },
        { time: 2.0, frequency: 392, pitchName: "G4", amplitude: 0.16 },
        { time: 3.5, frequency: 330, pitchName: "E4", amplitude: 0.14 },
        { time: 4.5, frequency: 261, pitchName: "C4", amplitude: 0.13 },
      ] } },

  // Spinal cord injury (C4 level) — only head movement producing subtle sounds
  { id: "MX-09", label: "SCI C4 — head tap on mic (beginner)",
    profile: "spinal cord injury C4", difficulty: "beginner",
    digest: { duration: 2.0, dominantFreq: 400, dominantPitch: "G4", avgAmplitude: 0.25,
      events: [{ time: 0.6, frequency: 400, pitchName: "G4", amplitude: 0.25 }],
      tempo: 30 } },

  { id: "MX-10", label: "SCI C4 — two head taps, intentional gap (intermediate)",
    profile: "spinal cord injury C4", difficulty: "intermediate",
    digest: { duration: 4.0, dominantFreq: 400, dominantPitch: "G4", avgAmplitude: 0.23,
      events: [
        { time: 0.5, frequency: 400, pitchName: "G4", amplitude: 0.25 },
        { time: 2.5, frequency: 400, pitchName: "G4", amplitude: 0.22 },
      ], tempo: 30 } },

];

// ─── Runner ────────────────────────────────────────────────────────────────

async function runTest(test) {
  const start = Date.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dspDigest: test.digest, audioBase64: null, userPrompt: "" }),
    });

    if (!res.ok) {
      return { ...test, status: "error", error: `HTTP ${res.status}`, ms: Date.now() - start };
    }

    const data = await res.json();
    return {
      ...test,
      status: "ok",
      ms: Date.now() - start,
      result: {
        mood:          data.mood,
        voice:         data.voice,
        articulation:  data.articulation,
        noteCount:     data.notes?.length ?? 0,
        explanation:   data.explanation,
        liltCode:      data.liltCode,
      }
    };
  } catch (err) {
    return { ...test, status: "error", error: err.message, ms: Date.now() - start };
  }
}

async function main() {
  console.log(`\nbabbled notes v2 — AI Test Runner`);
  console.log(`Running ${TESTS.length} tests against ${ENDPOINT}\n`);
  console.log("=".repeat(70));

  const results = [];

  for (let i = 0; i < TESTS.length; i++) {
    const test = TESTS[i];
    process.stdout.write(`[${String(i + 1).padStart(2)}/${TESTS.length}] ${test.id} — ${test.label}... `);
    const result = await runTest(test);
    results.push(result);

    if (result.status === "ok") {
      console.log(`✓ ${result.ms}ms | mood: "${result.result.mood}" | voice: ${result.result.voice} | ${result.result.noteCount} notes`);
    } else {
      console.log(`✗ ERROR: ${result.error}`);
    }

    // Respect rate limits — 300ms between calls
    if (i < TESTS.length - 1) await new Promise(r => setTimeout(r, 350));
  }

  console.log("=".repeat(70));

  const passed = results.filter(r => r.status === "ok").length;
  const failed = results.filter(r => r.status === "error").length;

  console.log(`\nSummary: ${passed} passed / ${failed} failed / ${TESTS.length} total`);

  // Write full results to JSON
  fs.writeFileSync(OUT_FILE, JSON.stringify({
    runDate: new Date().toISOString(),
    endpoint: ENDPOINT,
    totalTests: TESTS.length,
    passed,
    failed,
    results,
  }, null, 2));

  console.log(`\nFull results saved to ${OUT_FILE}\n`);
}

main().catch(console.error);
