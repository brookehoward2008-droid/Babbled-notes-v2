"""
Babbled Notes skill for Hermes Agent
https://github.com/brookehoward2008-droid/Babbled-notes-v2

Converts any sound description into a musical composition via Gemma 4.
Run babbled notes first: cd Babbled-notes-v2 && npm run dev  (port 3000)

Usage in Hermes:
  /babbled_notes hum at A3
  /babbled_notes breath puff, soft, 2 seconds
  you: Generate music from a tongue click
  hermes: [calls generate_music_from_profile("click")]
"""

import math
import requests


BABBLED_NOTES_URL = "http://localhost:3000/api/interpret"


def generate_music(
    pitch_hz: float,
    duration_s: float,
    amplitude: float = 0.1,
    user_prompt: str = ""
) -> dict:
    """
    Ask babbled notes to compose music from a sound description.

    Args:
        pitch_hz:    Dominant frequency in Hz (e.g. 220 = A3, 440 = A4)
        duration_s:  How long the sound lasted in seconds
        amplitude:   Loudness 0.0-1.0 (0.03 = quiet breath, 0.6 = loud tap)
        user_prompt: Optional intent hint ("make it a cello", "slow and gentle")

    Returns:
        dict with keys: mood, articulation, voice, notes[], explanation
    """
    # Map Hz to note name
    names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    midi = round(12 * math.log2(max(pitch_hz, 20) / 440) + 69)
    midi = max(0, min(127, midi))
    pitch_name = f"{names[midi % 12]}{(midi // 12) - 1}"

    digest = {
        "duration": duration_s,
        "averageEnergy": amplitude,
        "peakOnsetCount": 1,
        "events": [
            {
                "time": 0.0,
                "frequency": pitch_hz,
                "pitchName": pitch_name,
                "amplitude": amplitude
            }
        ]
    }

    response = requests.post(
        BABBLED_NOTES_URL,
        json={"dspDigest": digest, "userPrompt": user_prompt},
        timeout=120
    )
    response.raise_for_status()
    return response.json()


def generate_music_from_profile(profile: str) -> dict:
    """
    Generate music for a named disability or sound profile.
    Gemma 4 tested against all 32 profiles -- 32/32 passed.

    Args:
        profile: one of:
            breath   -- slow exhale, minimal amplitude (ALS, quadriplegia)
            hum      -- sustained vocal hum (autism, non-verbal)
            tremor   -- tremor hum treated as vibrato (Parkinson's)
            tap      -- single finger or head tap (cerebral palsy, SCI C4)
            click    -- tongue click, percussive (locked-in, AAC users)
            puff     -- breath puff trigger (quadriplegia sip-and-puff)
            whistle  -- single clear pitch whistle

    Returns:
        dict with keys: mood, articulation, voice, notes[], explanation
    """
    profiles = {
        "breath":  (180,  2.5, 0.03, "minimal breath, ambient drone, cello"),
        "hum":     (220,  3.0, 0.11, "gentle sustained hum, cinematic cello"),
        "tremor":  (196,  2.0, 0.08, "tremor hum, treat as vibrato, cello"),
        "tap":     (440,  0.2, 0.45, "single finger tap, percussive, piano"),
        "click":   (800,  0.1, 0.60, "tongue click, sharp and short, staccato"),
        "puff":    (120,  1.5, 0.05, "breath puff, soft and round, cello"),
        "whistle": (1047, 0.8, 0.30, "single whistle note, clear pitch"),
    }
    hz, dur, amp, prompt = profiles.get(profile, profiles["hum"])
    return generate_music(hz, dur, amp, prompt)


def generate_music_from_events(events: list, user_prompt: str = "") -> dict:
    """
    Generate music from a sequence of sound events (multi-onset input).

    Args:
        events: list of dicts with keys: time, frequency, pitchName, amplitude
        user_prompt: optional intent hint

    Returns:
        dict with keys: mood, articulation, voice, notes[], explanation
    """
    if not events:
        return generate_music_from_profile("breath")

    total_duration = max(e["time"] for e in events) + 1.0
    avg_amplitude = sum(e["amplitude"] for e in events) / len(events)

    digest = {
        "duration": total_duration,
        "averageEnergy": avg_amplitude,
        "peakOnsetCount": len(events),
        "events": events
    }

    response = requests.post(
        BABBLED_NOTES_URL,
        json={"dspDigest": digest, "userPrompt": user_prompt},
        timeout=120
    )
    response.raise_for_status()
    return response.json()
