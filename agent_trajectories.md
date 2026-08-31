# Representative Agent Trajectories

This document walks through a single complete, end-to-end execution of a student session on **Two Sum**, demonstrating the instructions, inputs, reasoning, and outputs of each of the 5 implemented agents.

---

## 1. Learner Diagnostic Agent

### Agent Instructions (System Prompt)
```text
You are a diagnostic computer science education agent.
Your task is to analyze the student's self-described strategy or answer to the diagnostic quiz.
Identify which prerequisites they already understand, which misconceptions they exhibit, and output a confidence score.
```

### Trajectory Input
* **Student Input**: *"I would solve Two Sum by sorting the numbers first so we can search it faster, maybe using binary search."*

### Agent Action & Output
The agent parses the input against the Two Sum prerequisite tree (`arrays`, `loops`, `hashmaps`) and the misconception list (`sorting is required first`, `binary search on unsorted`). It reasons that the student understands basic array structures and searching, but incorrectly believes sorting is a prerequisite.

**Structured JSON Output (`DiagnosticReport`):**
```json
{
  "confidence": 0.88,
  "suspected_misconceptions": [
    "sorting is required first"
  ],
  "verified_prerequisites": [
    "arrays",
    "loops"
  ],
  "missing_prerequisites": [
    "hashmaps"
  ],
  "beginner_track_recommended": false
}
```

---

## 2. Concept Agent

### Agent Instructions (System Prompt)
```text
You are a concept professor agent.
Your task is to generate a comprehensive conceptual model for the topic.
CRITICAL: If the DiagnosticReport flags specific misconceptions, you MUST customize your narrative to directly address and correct those misconceptions, adding dedicated pitfall sections.
```

### Trajectory Input
* **Topic**: Two Sum (Array/DSA)
* **Diagnostic Report**: `{"suspected_misconceptions": ["sorting is required first"], ...}`

### Agent Action & Output
The agent writes custom narrative intuition and pitfalls directly targeting the sorting misconception, showing that while sorting works, it increases time complexity to $O(N \log N)$ and ruins index preservation, which is why a hash map is preferred.

**Structured JSON Output (`ConceptModel`):**
```json
{
  "concept_id": "two-sum-hashmap",
  "title": "Two Sum — Linear Lookup via Hash Maps",
  "narrative_intuition": "Think of it as looking for a matching pair of gloves. Instead of sorting all gloves first (which takes O(N log N) time), you scan them one by one. If you see a left glove, you check your basket to see if you already kept its matching right glove. If yes, you're done in one pass!",
  "deep_mechanism": "We iterate through the array once. For each element, we compute its complement (target - value). We perform a constant-time O(1) average lookup in our Hash Map. If found, we return the indices. Otherwise, we store the current value and index in the map.",
  "common_pitfalls": [
    "PITFALL: Believing you must sort the array first. Sorting the array destroys the original indices and takes O(N log N) time, whereas a Hash Map solves it in O(N) time while keeping indices intact.",
    "Forgetting that target - current_value is the key you need to search."
  ],
  "key_facts": [
    "A hash map provides average O(1) lookup time.",
    "Sorting the array takes O(N log N) time and loses original index positions.",
    "The complement value is target minus the current number."
  ]
}
```

---

## 3. Visualization Agent

### Agent Instructions (System Prompt)
```text
You are a visualization designer agent.
Generate a structured VisualizationSpec scene graph describing the actors and timeline steps.
Do not generate HTML or CSS. Use the following primitives: flow, array, node, edge, highlight, transition, pointer, info.
```

### Trajectory Input
* **Concept Model**: `{"concept_id": "two-sum-hashmap", "key_facts": [...]}`
* **Methods**: Brute Force, Hash Map

### Agent Action & Output
The agent emits a scene graph containing the array cells, complement calculation actor, and the hash map actor. It defines steps that move the pointer index-by-index, highlights comparisons, and outputs corresponding captions.

**Structured JSON Output (`VisualizationSpec`):**
```json
{
  "type": "comparison",
  "id": "two-sum-visual",
  "title": "Two Sum Visualizer",
  "layout": { "orientation": "left-right" },
  "entities": [
    { "id": "arr", "kind": "array", "label": "[2, 7, 11, 15]" },
    { "id": "hash", "kind": "node", "label": "HashMap" },
    { "id": "ptr", "kind": "pointer", "label": "i" }
  ],
  "states": [
    { "id": "s0", "labels": ["Start"] },
    { "id": "s1", "labels": ["Index 0: Seen 2, check for 7"] },
    { "id": "s2", "labels": ["Index 1: Found 7, match!"] }
  ],
  "transitions": [
    { "from": "s0", "to": "s1", "animation": "slide" },
    { "from": "s1", "to": "s2", "animation": "highlight" }
  ]
}
```

---

## 4. Evaluation Agent

### Agent Instructions (System Prompt)
```text
You are a grading agent.
Grade the student's answer against the ConceptModel's key_facts.
Check if the explanation is causally correct, or if they still show misconceptions.
```

### Trajectory Input
* **Student Answer**: *"A hash map works because it sorts the array items as they are added, so we can run a fast O(1) binary search to find the matching pair."*
* **Key Facts**: `["A hash map provides average O(1) lookup", "Sorting takes O(N log N)"]`

### Agent Action & Output
The agent compares the student's explanation against the facts. It flags that the student still believes a hash map sorts keys and that binary search is used, which is factually incorrect.

**Structured JSON Output (`EvaluationResult`):**
```json
{
  "passed": false,
  "score": 0.0,
  "reasoning_quality": "Incorrect. The candidate incorrectly claims that a hash map sorts the data and uses binary search.",
  "misconception_detected": [
    "HashMap sorts data"
  ],
  "feedback": "No, a hash map does not sort data. Hash maps use a hash function to map keys to bucket indices, enabling O(1) average lookup time. Sorting is not involved in a hash map's lookup."
}
```

---

## 5. Adaptation Agent

### Agent Instructions (System Prompt)
```text
You are a curriculum coordinator agent.
Decide the next pedagogical step based on the EvaluationResult and the original DiagnosticReport.
Pivots: continue (if passed), simplify, re-teach, hint, flag_misconception.
```

### Trajectory Input
* **Evaluation Result**: `{"passed": false, "score": 0.0, "misconception_detected": ["HashMap sorts data"]}`
* **Diagnostic Report**: `{"suspected_misconceptions": ["sorting is required first"]}`

### Agent Action & Output
The agent sees that the student failed the practice task because of a persistent misconception about hash maps sorting data. It decides to trigger the `flag_misconception` action, routing them back to the `visualize` step to re-watch the Hash Map animation with a custom warning about sorting.

**Structured JSON Output (`AdaptationDecision`):**
```json
{
  "action": "flag_misconception",
  "reason": "The student still believes hash maps sort data to enable fast lookups. Let's redirect them to the Hash Map visualizer and highlight how items are placed in random buckets, not sorted.",
  "next_step": "visualize",
  "updated_difficulty": "easy"
}
```