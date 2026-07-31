# Series 65 Mastery

An Android study app (React Native / Expo) for the **NASAA Series 65 – Uniform
Investment Adviser Law Examination**, built around **mastery learning** and
**spaced repetition**, with a **full-length practice exam generator** and an
**on-device LLM tutor** whose model you choose in Settings.

The curriculum, section weights, and exam rules come directly from the official
*NASAA Series 65 Exam Overview* (Sept 1, 2023): 140 questions (130 scored + 10
pretest), 180 minutes, and a pass mark of 92/130 across four sections weighted
15% / 25% / 30% / 30%.

---

## Features

### 📚 Mastery learning
- The exam blueprint is modeled as **4 sections → 37 topics → subtopics**.
- Every topic tracks a **mastery level** (Beginning → Developing → Proficient →
  Mastered) from a recency‑weighted accuracy (EWMA) tempered by how much of the
  topic's breadth you've covered.
- **Mastery drills** keep serving questions on a topic until you actually master
  it (high accuracy *and* subtopic coverage), the core idea of mastery learning.
- The dashboard shows an **exam‑readiness score** that weights your section
  mastery exactly like the real blueprint.

### 🔁 Spaced repetition
- Each question is scheduled with a **SuperMemo‑2** algorithm so it resurfaces
  right before you'd forget it.
- The **Review** tab surfaces what's *due now*, plus missed and flagged
  questions.

### 📝 Full practice exam
- Generates a **140‑question mock** (130 scored + 10 unscored pretest) drawn
  across all four sections at their blueprint weights.
- Timed to **180 minutes**, with a question navigator/grid, flagging, and
  auto‑submit at time‑out.
- Scored against **92/130**, with a four‑section breakdown that mirrors the real
  score report. Past attempts are saved.

### 🤖 On‑device AI (private, offline)
- Runs **entirely on the phone** — no data leaves the device. Used to **explain
  answers**, act as an interactive **tutor**, and **generate fresh practice
  questions** for any topic.
- Two engines, chosen in **Settings → Choose / manage models**:
  - **Gemini Nano (built‑in)** — Google’s system on‑device model on supported
    Pixel devices, via the **ML Kit GenAI Prompt API** (`com.google.mlkit:genai-prompt`,
    the current/non‑deprecated path over AICore). No download; the app detects
    availability and talks to the system model directly (native local Expo module
    in `modules/gemini-nano`). The models screen groups everything into
    **“On this device”** and **“Download to add.”**
  - **Downloadable GGUF models** via [`llama.rn`](https://github.com/mybigday/llama.rn)
    (llama.cpp): Llama 3.2 1B/3B, Qwen2.5 1.5B, Gemma 2 2B, SmolLM2 1.7B. Tune
    temperature / context size / GPU layers.
  - **LiteRT-LM `.litertlm` models on the GPU** via `com.google.ai.edge.litertlm`
    (native local module in `modules/litert-lm`) — the same engine and files as
    Google’s [AI Edge Gallery](https://github.com/google-ai-edge/gallery): Gemma 4
    E2B, Qwen2.5 1.5B, DeepSeek-R1 Distill. Also discovers `.litertlm` files already
    on the device (dropped into the app’s external files dir) and runs them on the GPU.

### 🎨 Light & dark themes
- Full light and dark palettes with a **Settings → Appearance** toggle
  (System / Light / Dark). "System" follows the OS. Layout respects the status
  bar and the bottom gesture area via safe‑area insets.

### 🧠 Question bank
- **211 original practice questions** with explanations, authored to the
  blueprint and adversarially fact‑checked, plus bundled study notes for every
  topic. Questions are original and do **not** reproduce copyrighted NASAA exam
  items.

---

## Project structure

```
series65-mastery/
├── App.tsx                     # Providers + navigation root
├── app.json                    # Expo config (llama.rn + dev-client plugins, Android package)
└── src/
    ├── data/
    │   ├── curriculum.ts        # Blueprint: sections, topics, subtopics, weights, exam spec
    │   ├── questionBank.ts       # 211 verified questions
    │   ├── studyNotes.ts         # Per-topic study notes
    │   └── models.ts             # Curated on-device GGUF model registry
    ├── mastery/
    │   ├── engine.ts             # Mastery scoring + SuperMemo-2 spaced repetition
    │   └── selection.ts          # Adaptive / weak-area question selection
    ├── exam/
    │   ├── generator.ts          # Blueprint-weighted 140-question assembly
    │   └── scoring.ts            # Scoring + section breakdown vs 92/130
    ├── llm/
    │   ├── LlamaEngine.ts         # llama.rn wrapper (load, stream, stop)
    │   ├── modelManager.ts        # Download / delete GGUF models (resumable)
    │   ├── prompts.ts             # Tutor / explain / generate prompts + JSON parsing
    │   └── LLMProvider.tsx        # React context tying model + settings together
    ├── store/useStore.ts         # Zustand + AsyncStorage (progress, settings)
    ├── components/               # UI kit (cards, buttons, rings, question block)
    ├── navigation/               # Tabs + stack
    └── screens/                  # Dashboard, Learn, Subject, Topic, Quiz, Exam, Review, Settings, Tutor, …
```

---

## Running the app

Requires Node 18+, the Android SDK/NDK, and **JDK 17** (the Android Gradle build
needs 17 specifically — newer JDKs like 21/25 will fail the Gradle run). A quick
portable install:

```bash
curl -L "https://api.adoptium.net/v3/binary/latest/17/ga/linux/x64/jdk/hotspot/normal/eclipse" -o jdk17.tgz
mkdir -p ~/jdks && tar -xzf jdk17.tgz -C ~/jdks
export JAVA_HOME=~/jdks/jdk-17*   # prepend $JAVA_HOME/bin to PATH
```

> **Verified:** this app has been built and launched on an Android 16 (API 36)
> x86_64 emulator via the steps below. To speed up the first native build for an
> emulator, restrict ABIs: set `reactNativeArchitectures=x86_64` in
> `android/gradle.properties` (rebuild compiles llama.cpp for one ABI, not four).

> **On‑device AI needs a development build** (a custom native binary). It does
> **not** run in Expo Go, because `llama.rn` is a native module. Everything else
> (learning, practice, exams, spaced repetition) works in any build.

### 1. Install dependencies
```bash
npm install
```

### 2. Generate the native Android project
```bash
npx expo prebuild --platform android
```

### 3. Build & run on a device/emulator
```bash
npx expo run:android
```
This compiles the native code (including llama.cpp) and installs a development
build. First build takes a while; subsequent JS changes hot‑reload via
`npx expo start --dev-client`.

### Alternative: cloud build with EAS
```bash
npm install -g eas-cli
eas build --profile development --platform android
```

### Using the AI tutor
1. Open **Settings → Choose / manage models**.
2. Download a model that fits your phone's RAM (start with **Llama 3.2 1B**,
   ~0.8 GB). Larger models give better answers but need more memory.
3. Tap **Set active**, then **Load**. The tutor, answer explanations, and AI
   question generation are now available.

---

## How the pieces fit

- **Deterministic core, AI enhancement.** The question bank and exam generator
  are deterministic and reliable; the on‑device LLM *augments* them (explanations,
  tutoring, extra questions) but the app is fully functional without it.
- **Everything is local.** Progress and settings persist via AsyncStorage;
  inference runs on‑device. Only model downloads use the network.

## Disclaimer

Independent study aid — not affiliated with or endorsed by NASAA or FINRA.
Practice questions are original and do not reproduce actual exam questions.
Nothing here is investment advice.
