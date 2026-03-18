# Lessons Learned — Cinder Project

> Updated after every correction. Purpose: prevent repeat mistakes.

---

## Architecture & Navigation

### L001 — Always check App.tsx before touching screens
**Mistake:** Rewrote Login/Signup/WelcomeScreen but the app still showed the old white screens.
**Root cause:** App.tsx had its own hardcoded navigation stack pointing Login/Signup routes to the old `AuthScreen` component. The new `navigation/index.tsx` was never used.
**Rule:** Before touching any screen, grep for where it's actually mounted. The entry point (`App.tsx`) owns navigation — not `navigation/index.tsx`.

### L002 — Replicate model IDs must be verified before use
**Mistake:** Used `lucataco/ip-adapter-sdxl` (made-up ID) → 404 error.
**Rule:** Never guess a Replicate model ID. If unsure, ask the user to look it up on replicate.com first. The correct model was `lucataco/ip_adapter-sdxl-face:226c6bf6...`.

### L003 — Read the actual running server file, not just the code I wrote
**Mistake:** Left `COLAB_URL` variable in server.py as a deprecated comment without removing it cleanly.
**Rule:** After a pivot (e.g. Colab → Replicate), do a full cleanup pass on the file.

---

## UI / Frontend

### L004 — Design tokens must be applied everywhere consistently
**Mistake:** Rewrote screens with dark theme but Login/Signup still used hardcoded `#fff` background and `#FF4500` orange because they referenced the old `CinderOrange` theme file.
**Rule:** After creating `tokens.ts`, grep for old hardcoded color values (`#fff`, `#FF4500`, `backgroundColor: '#fff'`) across all screens before calling the revamp done.

### L005 — `mediaTypes` deprecation in expo-image-picker
**Mistake:** Used deprecated `ImagePicker.MediaTypeOptions.Images`.
**Rule:** Use `mediaTypes: ['images']` (array syntax) for expo-image-picker v17+.

### L006 — SafeAreaView import source matters
**Mistake:** Used `SafeAreaView` from `react-native` instead of `react-native-safe-area-context`.
**Rule:** Always import `SafeAreaView` from `react-native-safe-area-context` — the RN built-in version doesn't respect notches correctly on modern devices.

---

## Backend / Python

### L007 — numpy version must be >=1.26 for Python 3.12
**Mistake:** `requirements.txt` had `numpy==1.23.2` which uses `distutils.msvccompiler` removed in Python 3.12.
**Rule:** For Python 3.12+, use `numpy>=1.26,<2`.

### L008 — Replicate output format differs by model
**Mistake:** Used `output[0].read()` (file-like object) for ip-adapter output, but ip-adapter returns URL strings — needs `requests.get(url).content` instead.
**Rule:** Check the Replicate model's output type: Flux/SDXL file-likes use `.read()`, IP-Adapter returns URL strings. Always handle both cases or check the model's API docs.

### L009 — Don't leave dead dependencies in requirements.txt
**Mistake:** `requirements.txt` still listed `torch`, `diffusers`, `transformers`, `huggingface_hub` after the pivot to Replicate — 2GB+ of unnecessary installs.
**Rule:** After a pivot, immediately clean requirements.txt to only what `server.py` actually imports.

---

## General Process

### L010 — Plan before writing UI revamps
**Mistake:** Jumped into writing Home.tsx before reading all screens and understanding the navigation structure. Had to redo work when the Library click-through was broken.
**Rule:** For UI revamps: read ALL screens + navigation first, identify broken interactions, then plan the full set of changes before writing a single line.

### L011 — Check what the professor actually requires before building
**Mistake:** Implemented IP-Adapter via Replicate API without confirming whether the professor requires Story-Iter/NAVIS to actually run locally.
**Rule:** When academic requirements are ambiguous, surface the ambiguity early and draft a clarifying message to the professor before over-engineering.
