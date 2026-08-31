# DeepDive — An Adaptive, Agentic Computer Science Learning Engine

DeepDive is an agentic computer science learning platform that shifts studying from passive consumption to checkable, active understanding. 

---

## 👥 Intended User & Current Bottleneck

### The User
CS students and new-grad software engineering candidates preparing for technical interviews. They are typically studying under time pressure, balancing coding practice with job hunting, and need high-density, high-retention study methods.

### The Bottleneck
**Self-Diagnosis**. When candidates read static articles (e.g. GeeksforGeeks) or watch video explanations, they feel like they understand. However, they frequently carry silent misconceptions (e.g., believing a hash map "sorts" keys internally for O(1) search, or that binary search is applicable to unsorted lists). 
* **LeetCode** grades the *syntax* and output correctness but cannot detect if their reasoning is flawed.
* **ChatGPT** explains the code but does not map their specific mental model, probe their prerequisite knowledge, or adapt the curriculum if they remain confused.

### Why Solving This is Valuable
By closing the learning loop, DeepDive saves students hundreds of hours of passive studying. It diagnoses conceptual gaps *before* presenting visualizations, grades *causal reasoning* rather than keyword matching after checkpoint tasks, and dynamically routes candidates back through tailored animations rather than simply giving a grade and moving on.

---

## 🛠️ System Architecture

DeepDive is managed by a centralized session state orchestrator running a sequence of 8 specialized agents:

```text
Student Interaction Layer (sign-up/sign-in → topic selection)
    │
    ▼
Orchestrator (deterministic state machine)
    │
    ├─ 1. Learner Diagnostic Agent  → DiagnosticReport (Flag misconceptions, check prerequisites)
    ├─ 2. Learning Planner Agent    → LearningPlan (Chronological roadmap)
    ├─ 3. Concept Agent             → ConceptModel (Generate custom narrative, pitfalls, facts)
    ├─ 4. Visualization Agent       → VisualizationSpec (Structured JSON scene graph for renderer)
    ├─ 5. Practice Agent            → ExerciseSet (Dynamic checkpoint questions)
    ├─ 6. Evaluation Agent          → EvaluationResult (Grades reasoning quality against facts)
    ├─ 7. Adaptation Agent          → AdaptationDecision (Pivot route: simplify / re-teach / retry)
    │
    ▼
Deterministic CSS Renderer (Array / Comparison / Flow / Stack visualization primitives)
    │
    ▼
Session Cache Store (In-Memory Session Caching & Token Validation)
```

### Why Each Agent is Genuinely Agentic:
1. **Diagnostic Agent**: Reasons over free-text student input against prerequisite trees and misconception registries to determine diagnostic confidence.
2. **Concept Agent**: Adapts pedagogical depth and Pitfall warnings *conditioned on* the Diagnostic Report.
3. **Planner Agent**: Customizes the active study plan based on student level.
4. **Visualization Agent**: Emits a structured scene graph (actors, positions, timeline states, highlights) separating logical explanation from rendering layout.
5. **Practice Agent**: Builds targeted checkpoint challenges tailored to the concept.
6. **Evaluation Agent**: Evaluates the semantic correctness of the student's *explanation reasoning*, not syntax keywords.
7. **Adaptation Agent**: Executes actual curriculum routing transitions (e.g. `flag_misconception`, `simplify`, or `completed`).

---

## 📂 Project Directory Structure

```text
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI REST endpoints & HTTP validation
│   │   ├── orchestrator.py     # State machine transitions & backward routing
│   │   ├── agents.py           # Prompt instructions, structured schemas & LLM calls
│   │   ├── schemas.py          # Strict Pydantic types & SceneActor validations
│   │   ├── llm_client.py       # Groq/Gemini client with fallback-to-stub routing
│   │   ├── state_store.py      # Session cache database
│   │   └── domain.py           # Pre-seeded concept blueprints (Two Sum, Photosynthesis, Digestive System)
│   ├── verify_session_flow.py  # End-to-end integration test suite
│   ├── run_eval_comparison.py  # Pipeline vs Baseline grading test
│   └── run_five_problems_eval.py # Multi-problem validation suite
├── frontend/
│   ├── src/
│   │   ├── screens/            # Auth, Lesson, Visualizer, Challenge, Feedback, Summary
│   │   ├── viz/                # ScenePlayer & DiagramRenderer
│   │   ├── components/         # Common UI & Mascot Chatbot
│   │   └── main.jsx            # Core routing & app entrypoint
│   └── package.json            # Frontend build configs
├── README.md                   # Platform Overview & Changelog
├── CHANGELOG.md                # Detailed development timeline
├── REPRODUCTION_GUIDE.md       # Environment setup & script execution manual
├── SUBMISSION.md               # Checked submission package
└── agent_trajectories.md       # End-to-end trace transcripts of all 5 agents
```

---

## 📈 Improvement Changelog

| Stage | What We Tried | Guided Evidence / Feedback | Decision / Kept or Removed |
|---|---|---|---|
| **Baseline** | Single direct LLM prompt: "Explain Two Sum and solve it." | Explanations were generic, lengthy, and completely blind to student level. | **Replaced** with structured 8-agent state machine. |
| **Iteration 1** | Session machine with 8 stubs (fake JSON outputs), no API integrations. | End-to-end route verified via `verify_session_flow.py`. | **Kept**: Proved state transitions work before spending API tokens. |
| **Iteration 2** | Real LLM calls for Diagnostic + Concept agents using Groq `gpt-oss-120b`. | Inputs properly identified key misconceptions (e.g., "HashMap sorts keys") with >0.85 confidence. | **Kept**: Validated diagnostic-conditioning works. |
| **Iteration 3** | Paused timeline animations mid-playback for interactive questions. | Broken autoplay flow. Stalled step-through timeline. | **Removed**: Questions moved to final (`conclusion`) playback state. |
| **Iteration 4** | Dual-visualizer comparison (Brute Force vs. Hash Map) side-by-side. | Swapping tabs dynamically synchronizes code, explanation, and visual states. | **Kept**: Vital for comparison-based learning. |
| **Iteration 5** | Wired real Evaluation + Adaptation agents. | Test cases (correct/wrong/vague) triggered correct pivots (e.g., `flag_misconception` routing back). | **Kept**: Closed the learning loop. |
| **Iteration 6** | Coordinate-based timeline rendering in flow layouts. | Stale exiting elements ("here" pointer, lightbulb) and squeezed cards on small screens. | **Removed coordinate grid**: Refactored to horizontal flexbox (`gap: 12px`) with SVG arrows and bottom fact cards. |
| **Iteration 7** | Backward Navigation support. | Users got stuck at practice challenges or summaries with no way to revisit lessons. | **Kept**: Implemented `/api/session/regress` endpoint and bound styled Back buttons. |
| **Iteration 8** | Completion card mastery mapping. | Mastery and reasoning scores stuck at 0% when reloading completed sessions. | **Kept**: Read scores from both `latest_evaluation` and `mastery_trend` fallbacks. |
| **Iteration 9** | Custom Topic Synthesis layout sorting. | Custom topics (like the Water Cycle) generated descriptive stage IDs (e.g., evaporation) which broke index-based parsing and sorting. | **Kept**: Refactored the stage filter to dynamically include all box/node entities and sorted them by horizontal x-coordinate to ensure correct layouts. |

---

## ⚠️ Main Failure Mode & Mitigation

### Failure Mode: API Quota Exhaustion (429 Rate Limits)
The primary failure mode is hitting API limits during consecutive testing or concurrent grading calls, causing the system to fall back to stubs.
* **Mitigation**:
  1. We built a robust **multi-provider retry queue** (`llm_client.py`) that falls back from Groq `gpt-oss-120b` to secondary Groq models (`qwen3.8-27b`, `gpt-oss-20b`) and then to Gemini `gemini-3.6-flash`.
  2. For curated topics (DSA, Photosynthesis, Digestive System), we pre-seeded complete custom blueprints. Even if *all* API providers return 429 errors, the system falls back to a deterministic scene builder that still renders a gorgeous, highly specific visual step-through instead of generic "start-process-result" boxes.

---

## 🔥 Hot Take

**Grading is not the bottleneck; actions are.**
Most AI tutoring tools focus entirely on grading accuracy—how well an LLM can classify a student's answer. But modern LLMs are already excellent at this out of the box. The real bottleneck is *closing the loop*: keeping track of the state, identifying the specific misconception from step one, and taking a structured curriculum action (routing to retry, adjusting visualization emphasis) based on the grade. An agentic architecture is worth its complexity for the *routing*, not the *grading*.
