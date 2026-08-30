from __future__ import annotations

import json
import logging
from typing import Any

from .domain import get_concept_node, get_topic_brief
from .llm_client import call_structured_llm
from .schemas import (
    AdaptationDecision,
    ConceptModel,
    DiagnosticReport,
    EvaluationResult,
    ExerciseSet,
    ExerciseTask,
    LearningPlan,
    MethodModel,
    StudentSession,
    TopicBlueprint,
    VisualizationEntity,
    VisualizationQuestion,
    VisualizationRelation,
    VisualizationSpec,
    VisualizationState,
    VisualizationTransition,
)


LOGGER = logging.getLogger(__name__)


def log_agent_call(session: StudentSession, agent_name: str, payload: dict[str, Any]) -> None:
    trace = session.metadata.setdefault("agent_trace", [])
    trace.append({"agent": agent_name, "payload": payload})


# ── Topic Synthesis Agent: builds a curriculum node for ANY free-text topic ──

def _topic_synthesis_fallback(topic_request: str) -> TopicBlueprint:
    """Deterministic blueprint built from the raw topic text (no LLM needed)."""
    topic = (topic_request or "").strip() or "A new topic"
    slug = "custom-" + "".join(
        ch if ch.isalnum() else "-" for ch in topic.lower()
    ).strip("-")[:40]
    title = topic if len(topic) <= 80 else topic[:77] + "..."
    return TopicBlueprint(
        concept_id=slug,
        title=title,
        domain="Custom",
        subdomain="Learner Requested",
        canonical_definition=(
            f"A structured walkthrough of {title}: what it is, why it matters, and how its "
            "core mechanism works step by step."
        ),
        key_facts=[
            f"What {title} fundamentally is",
            f"How {title} works step by step",
            f"Where {title} applies and where it breaks down",
        ],
        prerequisites=["basic background knowledge"],
        misconceptions=[
            f"memorizing the definition of {title} is the same as understanding it",
            "the steps can be performed in any order",
            "understanding the summary means no need to work an example",
        ],
        explanation_depths=[
            f"simple intuition: what {title} is in one sentence",
            "mechanism: the step-by-step process",
            "application: where and why it is used",
        ],
        input_display=title,
        example_values=["step 1", "step 2", "step 3"],
        example_walkthrough=f"A concrete example of {title} worked through step by step.",
        practice_challenge=f"Explain in your own words how {title} works and why.",
    )


def topic_synthesis_agent(topic_request: str, student_level: str = "beginner") -> TopicBlueprint:
    """Synthesize a full curriculum blueprint for an arbitrary learner-requested topic."""
    system_prompt = (
        "You are a curriculum-synthesis agent for an adaptive learning platform. "
        "A learner wants to learn ANY topic they typed — it may be computer science, science, "
        "history, economics, a language, a tool, or anything else. "
        "Design a focused micro-lesson blueprint for that topic.\n"
        "Rules:\n"
        "  1. concept_id: a short kebab-case slug prefixed with 'custom-'.\n"
        "  2. title: a clean human-readable lesson title (max ~80 chars).\n"
        "  3. canonical_definition: 2-4 sentences defining the topic precisely.\n"
        "  4. key_facts: 3-5 ground-truth statements a correct explanation MUST contain. "
        "These are used later as grading criteria, so make them specific and verifiable.\n"
        "  5. prerequisites: 2-4 things worth knowing first.\n"
        "  6. misconceptions: 3-4 common wrong beliefs about this topic, phrased the way a "
        "student would state them (first person, specific, falsifiable). These are matched "
        "against student answers later, so do not make them vague.\n"
        "  7. explanation_depths: 3 entries from simple intuition to mechanism to application.\n"
        "  8. input_display: ONE short line (max ~60 chars) showing a concrete input/state the "
        "animated visualizer can display, e.g. 'array = [4, -2, 7], target = 5' or "
        "'stage: pollination' or 'plaintext -> [encrypt] -> ciphertext'.\n"
        "  9. example_values: 3-6 short single-word/single-token strings (max 8 chars each) that "
        "represent the concrete example states the visualizer will animate as boxes.\n"
        "  10. example_walkthrough: a concrete worked example of the topic in 3-5 discrete steps, "
        "with real values. The visualization agent will animate exactly this.\n"
        "  11. practice_challenge: ONE open question asking the student to explain the core "
        "mechanism in their own words — answerable by typing a short paragraph."
    )
    user_prompt = json.dumps({
        "topic_request": topic_request,
        "student_level": student_level,
        "output_type": "TopicBlueprint",
    })
    return call_structured_llm(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        response_model=TopicBlueprint,
        fallback=lambda: _topic_synthesis_fallback(topic_request),
    )


def _diagnostic_fallback(session: StudentSession) -> DiagnosticReport:
    concept_id = session.metadata.get("concept_id", "two-sum-hashmap")
    node = get_concept_node(concept_id)
    return DiagnosticReport(
        understanding=["basic programming"],
        missing_prerequisites=node.prerequisites,
        misconceptions=[],
        confidence=0.5,
        summary=f"No prior diagnosis available for {node.title}."
    )


def _concept_fallback(session: StudentSession) -> ConceptModel:
    concept_id = session.metadata.get("concept_id", "two-sum-hashmap")
    node = get_concept_node(concept_id)
            
    # Mock fallback methods depending on the concept
    fallback_methods = [
        MethodModel(
            id="brute-force",
            name="Naive / Brute Force Approach",
            explanation=f"A naive O(N²) comparison approach to solve {node.title}.",
            complexity={"time": "O(N²)", "space": "O(1)"},
            code="# Naive approach implementation\npass",
            visualization_spec_ref="bf-visual"
        ),
        MethodModel(
            id="optimized",
            name="Optimized Approach",
            explanation=f"An efficient O(N) optimized approach to solve {node.title}.",
            complexity={"time": "O(N)", "space": "O(N)"},
            code="# Optimized approach implementation\npass",
            visualization_spec_ref="optimized-visual"
        )
    ]
    
    return ConceptModel(
        concept_id=node.concept_id,
        title=node.title,
        canonical_definition=node.canonical_definition,
        key_facts=[f"Core fact for {node.title}: " + fact for fact in node.explanation_depths],
        prerequisites=node.prerequisites,
        misconceptions=node.misconceptions,
        explanation_summary=node.canonical_definition,
        teaching_emphasis=[node.title],
        methods=fallback_methods
    )


def _guard_against_ground_truth(model: ConceptModel, node) -> ConceptModel:
    if node.concept_id != "two-sum-hashmap":
        return model
    ground_truth_keywords = [
        "brute force",
        "hash map",
        "target - current_value",
        "average lookup",
        "O(n) average time",
    ]
    joined = " ".join(model.key_facts).lower()
    if not all(keyword in joined for keyword in ["brute force", "hash map", "target - current_value"]) and model.concept_id == node.concept_id:
        LOGGER.warning("LLM concept facts conflict with adapter ground truth; using domain adapter truth instead.")
        model.key_facts = [
            "Brute force checks every pair of numbers",
            "A hash map stores values already seen",
            "For each value, the relevant check is target - current_value",
            "Average lookup in a hash map is O(1), so the algorithm becomes O(n) average time"
        ]
        model.canonical_definition = node.canonical_definition
        model.prerequisites = node.prerequisites
        model.misconceptions = node.misconceptions
    return model


def diagnostic_agent_real(session: StudentSession) -> DiagnosticReport:
    concept_id = session.metadata.get("concept_id", "two-sum-hashmap")
    node = get_concept_node(concept_id)
            
    student_text = (session.student_profile.self_description or "").strip() or session.student_profile.current_level
    system_prompt = (
        "You are a careful student-diagnostic agent for an adaptive learning system. "
        "Ground your reasoning only in the given concept prerequisites and misconceptions list. "
        "Do not invent new misconceptions. Be conservative: if evidence is weak, say low confidence and no clear misconception."
    )
    user_prompt = json.dumps({
        "student_text": student_text,
        "concept_title": node.title,
        "prerequisites": node.prerequisites,
        "misconceptions": node.misconceptions,
        "output_type": "DiagnosticReport",
    })
    try:
        model = call_structured_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_model=DiagnosticReport,
            fallback=lambda: _diagnostic_fallback(session),
        )
        log_agent_call(session, "DiagnosticAgent", {"student_profile": session.student_profile.model_dump(), "llm_output": model.model_dump()})
        return model
    except Exception:
        fallback = _diagnostic_fallback(session)
        log_agent_call(session, "DiagnosticAgent", {"student_profile": session.student_profile.model_dump(), "fallback_used": True})
        return fallback


def concept_agent_real(session: StudentSession) -> ConceptModel:
    concept_id = session.metadata.get("concept_id", "two-sum-hashmap")
    node = get_concept_node(concept_id)

    diagnosis = session.diagnosis or DiagnosticReport(
        understanding=[],
        missing_prerequisites=node.prerequisites,
        misconceptions=[],
        confidence=0.5,
        summary="No prior diagnosis available."
    )
    system_prompt = (
        "You are a concept-explainer agent. Use the provided ground-truth concept node as the source of truth. "
        "Keep the explanation in plain language, tailored to the student's current skill level and misconceptions. "
        "If the student seems to believe a listed misconception, explicitly correct it. "
        "Do not contradict the domain adapter's core facts.\n"
        "You must generate a list of 2-3 different approaches in the 'methods' field. "
        f"For {node.title}, include an initial/naive approach (id should contain 'brute' or 'naive') and "
        "one or two better approaches that solve, apply, or explain this concept. "
        "The topic may be any subject (CS, science, history, etc.): for computational topics the approaches are "
        "algorithms with time/space complexity; for non-computational topics the approaches are different ways to "
        "model, execute, or understand the process, and the complexity dictionary should use the keys 'time' and "
        "'space' with honest values (use 'n/a' when a dimension genuinely does not apply). "
        "Each method must have: id, name, explanation, complexity dictionary (with keys 'time' and 'space'), "
        "and clean code or pseudocode in 'code' that demonstrates the approach."
    )
    user_prompt = json.dumps({
        "concept": node.model_dump(),
        "diagnostic_report": diagnosis.model_dump(),
        "output_type": "ConceptModel",
    })
    try:
        model = call_structured_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_model=ConceptModel,
            fallback=lambda: _concept_fallback(session),
        )
        model = _guard_against_ground_truth(model, node)
        log_agent_call(session, "ConceptAgent", {"target": session.active_topic, "llm_output": model.model_dump()})
        return model
    except Exception:
        fallback = _concept_fallback(session)
        log_agent_call(session, "ConceptAgent", {"target": session.active_topic, "fallback_used": True})
        return fallback


def diagnostic_agent_stub(session: StudentSession) -> DiagnosticReport:
    log_agent_call(session, "DiagnosticAgent", {"student_profile": session.student_profile.model_dump()})
    return _diagnostic_fallback(session)


def planner_agent_stub(session: StudentSession) -> LearningPlan:
    log_agent_call(session, "PlannerAgent", {"active_topic": session.active_topic})
    topic = session.active_topic
    brief = get_topic_brief(session.metadata.get("concept_id", ""))
    prereq_step = (
        f"Identify the missing prerequisite: {brief.prerequisites[0]}"
        if brief and brief.prerequisites
        else "Identify the missing prerequisite knowledge"
    )
    return LearningPlan(
        goal=f"Explain how {topic} works and verify real understanding, not just recognition",
        target_concept=topic,
        steps=[
            prereq_step,
            f"Walk through the naive/initial approach to {topic}",
            f"Compare with the optimized/best approach and why it wins",
            "Check prediction and reasoning before moving on"
        ],
        time_budget_minutes=25,
        rationale=f"The student's diagnosis shows the real gap; the plan targets the core mechanism of {topic} before its details."
    )


def concept_agent_stub(session: StudentSession) -> ConceptModel:
    log_agent_call(session, "ConceptAgent", {"target": session.active_topic})
    return _concept_fallback(session)


def _visualization_fallback(session: StudentSession) -> VisualizationSpec:
    concept_id = session.metadata.get("concept_id", "two-sum-hashmap")
    node = get_concept_node(concept_id)

    # Determine type
    vis_type = "comparison"

    # Dynamic states based on concept prerequisites and title
    states = [
        VisualizationState(
            id="before",
            labels=[f"Start: {node.title} input is loaded."],
            highlight=["input"]
        ),
        VisualizationState(
            id="step-1",
            labels=[f"Stepping through optimized approach: scanning element/node."],
            highlight=["optimized"]
        ),
        VisualizationState(
            id="conclusion",
            labels=[f"Conclusion: Optimized approach resolved successfully."],
            highlight=["conclusion"]
        )
    ]

    return VisualizationSpec(
        type=vis_type,
        id=f"{concept_id}-visual",
        title=f"Visualization fallback — {node.title}",
        layout={"orientation": "left-right"},
        entities=[
            VisualizationEntity(id="input", kind="array", label="input values"),
            VisualizationEntity(id="optimized", kind="node", label="optimized process"),
            VisualizationEntity(id="conclusion", kind="node", label="result"),
        ],
        relations=[],
        states=states,
        transitions=[
            VisualizationTransition(**{"from": "before", "to": "step-1", "animation": "fade", "durationMs": 600}),
            VisualizationTransition(**{"from": "step-1", "to": "conclusion", "animation": "fade", "durationMs": 600}),
        ],
        questions=[
            VisualizationQuestion(
                id="q1",
                prompt=f"What is the time complexity of the optimized approach?",
                expectedObservations=["O(N)"]
            )
        ],
        expectedObservations=[]
    )


def _visualization_bf_fallback(session: StudentSession) -> VisualizationSpec:
    concept_id = session.metadata.get("concept_id", "two-sum-hashmap")
    node = get_concept_node(concept_id)

    vis_type = "comparison"

    states = [
        VisualizationState(
            id="before",
            labels=[f"Start: Naive approach input is loaded."],
            highlight=["input"]
        ),
        VisualizationState(
            id="bf-step",
            labels=[f"Stepping through naive approach sequentially."],
            highlight=["naive"]
        ),
        VisualizationState(
            id="conclusion",
            labels=[f"Conclusion: Naive approach has finished scanning."],
            highlight=["conclusion"]
        )
    ]

    return VisualizationSpec(
        type=vis_type,
        id=f"{concept_id}-bf-visual",
        title=f"Brute force visualization fallback — {node.title}",
        layout={"orientation": "left-right"},
        entities=[
            VisualizationEntity(id="input", kind="array", label="input values"),
            VisualizationEntity(id="naive", kind="node", label="naive process"),
            VisualizationEntity(id="conclusion", kind="node", label="result"),
        ],
        relations=[],
        states=states,
        transitions=[
            VisualizationTransition(**{"from": "before", "to": "bf-step", "animation": "fade", "durationMs": 600}),
            VisualizationTransition(**{"from": "bf-step", "to": "conclusion", "animation": "fade", "durationMs": 600}),
        ],
        questions=[
            VisualizationQuestion(
                id="q_bf_1",
                prompt=f"Why is the naive approach less efficient?",
                expectedObservations=["Nested scanning or extra work"]
            )
        ],
        expectedObservations=[]
    )


def _guard_visualization_spec(spec: VisualizationSpec, diagnosis) -> VisualizationSpec:
    """Ensure misconception-correcting labels are present when the diagnostic flagged them."""
    if diagnosis is None:
        return spec
    has_sort_misconception = "HashMap sorts data" in (diagnosis.misconceptions or [])
    if not has_sort_misconception:
        return spec

    correction = "The hash map does NOT sort data. Speed comes from O(1) average hash-based lookup, not ordering."
    # Check if any state label already mentions the correction
    all_labels = [lbl for st in spec.states for lbl in st.labels]
    already_corrected = any("sort" in lbl.lower() or "sorting" in lbl.lower() for lbl in all_labels)
    if already_corrected:
        return spec

    # Inject correction into the first state that highlights the hashmap entity
    for st in spec.states:
        if any("hash" in h.lower() or "map" in h.lower() for h in st.highlight):
            st.labels.insert(0, f"⚠ Misconception check: {correction}")
            break
    else:
        # fallback: inject into last state
        if spec.states:
            spec.states[-1].labels.insert(0, f"⚠ Misconception check: {correction}")
    return spec


def visualization_agent_real(session: StudentSession) -> VisualizationSpec:
    concept = session.concept_history[0] if session.concept_history else None
    diagnosis = session.diagnosis

    if concept is None:
        LOGGER.warning("No concept model in session; using fallback visualization spec")
        return _visualization_fallback(session)

    concept_id = session.metadata.get("concept_id", "two-sum-hashmap")

    # Define standard examples for each concept
    examples = {
        "two-sum-hashmap": "nums=[2,7,11,15], target=9",
        "contains-duplicate": "nums=[1,2,3,1]",
        "valid-anagram": "s='anagram', t='nagaram'",
        "best-time-stock": "prices=[7,1,5,3,6,4]",
        "max-subarray": "nums=[-2,1,-3,4,-1,2,1,-5,4]",
        "valid-parentheses": "s='([]){}'",
        "reverse-linked-list": "head=[1,2,3,4,5]",
        "group-anagrams": "strs=['eat','tea','tan','ate','nat','bat']",
        "product-except-self": "nums=[1,2,3,4]",
        "top-k-frequent": "nums=[1,1,1,2,2,3], k=2",
        "longest-consecutive": "nums=[100,4,200,1,3,2]"
    }
    brief = get_topic_brief(concept_id)
    if brief:
        example_str = (
            f"input/state: {brief.input_display or brief.title}. "
            f"Concrete example to animate step by step: {brief.example_walkthrough}"
        )
        type_rule = (
            "  1. type must be one of 'process', 'timeline', 'flow', or 'comparison' — choose whichever best "
            "matches how this topic's example unfolds (a repeating transformation -> 'process'; a historical or "
            "sequential development -> 'timeline').\n"
            "  2. entities: represent the example's stages, actors, or components as entities (kind: 'node' for "
            "stages, 'array' for ordered values, 'metric' for quantities, 'flow' for processes).\n"
        )
    else:
        example_str = examples.get(concept_id, "nums=[2,7,11,15], target=9")
        type_rule = (
            "  1. type must be exactly 'comparison', 'stack', or 'linked-list' (use 'stack' ONLY if validating brackets/parentheses, use 'linked-list' ONLY if reversing a linked list).\n"
            "  2. entities: include relevant visualization entities representing arrays, strings, stacks, hash-maps, links, nodes, edges, or metrics as appropriate.\n"
        )

    system_prompt = (
        "You are a visualization-design agent for an adaptive learning system. "
        "You produce ONLY a VisualizationSpec JSON that drives a CSS-animated comparison UI.\n"
        f"For the concept '{concept.title}', create a step-by-step visualization spec matching the problem dynamics.\n"
        "Rules:\n"
        + type_rule +
        "  3. states: produce exactly 3 to 5 states (e.g. 'before', 'step-1', 'step-2', 'conclusion') explaining the process. "
        "     Each state has a 'labels' list (1-3 strings) and a 'highlight' list referencing entity ids.\n"
        "  4. transitions: link states sequentially with appropriate animations.\n"
        "  5. questions: exactly 2 to 3 questions covering time complexity, space complexity, and common misconceptions.\n"
        f"  6. Ground the example values in: {example_str}.\n"
        "  7. Do not add extra fields beyond the schema."
    )

    user_prompt = json.dumps({
        "concept": concept.model_dump(),
        "diagnostic_report": diagnosis.model_dump() if diagnosis else {},
        "output_type": "VisualizationSpec",
        "instruction": (
            f"Produce a VisualizationSpec JSON for the comparison of brute-force vs optimized methods for {concept.title}. "
            "Tailor state labels to the student's specific misconceptions listed in diagnostic_report."
        ),
    })

    try:
        spec = call_structured_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_model=VisualizationSpec,
            fallback=lambda: _visualization_fallback(session),
        )
        if concept_id == "two-sum-hashmap":
            spec = _guard_visualization_spec(spec, diagnosis)
        log_agent_call(session, "VisualizationAgent", {"llm_spec_id": spec.id, "states": len(spec.states)})
        return spec
    except Exception as exc:
        LOGGER.warning("VisualizationAgent LLM call failed: %s; using fallback", exc)
        fallback = _visualization_fallback(session)
        log_agent_call(session, "VisualizationAgent", {"fallback_used": True})
        return fallback


def visualization_agent_bf_real(session: StudentSession) -> VisualizationSpec:
    concept = session.concept_history[0] if session.concept_history else None
    diagnosis = session.diagnosis

    if concept is None:
        LOGGER.warning("No concept model in session; using brute force fallback visualization spec")
        return _visualization_bf_fallback(session)

    concept_id = session.metadata.get("concept_id", "two-sum-hashmap")

    examples = {
        "two-sum-hashmap": "nums=[2,7,11,15], target=9",
        "contains-duplicate": "nums=[1,2,3,1]",
        "valid-anagram": "s='anagram', t='nagaram'",
        "best-time-stock": "prices=[7,1,5,3,6,4]",
        "max-subarray": "nums=[-2,1,-3,4,-1,2,1,-5,4]",
        "valid-parentheses": "s='([]){}'",
        "reverse-linked-list": "head=[1,2,3,4,5]",
        "group-anagrams": "strs=['eat','tea','tan','ate','nat','bat']",
        "product-except-self": "nums=[1,2,3,4]",
        "top-k-frequent": "nums=[1,1,1,2,2,3], k=2",
        "longest-consecutive": "nums=[100,4,200,1,3,2]"
    }
    brief = get_topic_brief(concept_id)
    if brief:
        example_str = (
            f"input/state: {brief.input_display or brief.title}. "
            f"Concrete naive/initial example to animate step by step: {brief.example_walkthrough}"
        )
    else:
        example_str = examples.get(concept_id, "nums=[2,7,11,15], target=9")

    system_prompt = (
        "You are a visualization-design agent for an adaptive learning system. "
        "You produce ONLY a VisualizationSpec JSON for the brute force/naive approach.\n"
        f"For the concept '{concept.title}', create a step-by-step naive visualization spec.\n"
        "Rules:\n"
        "  1. type must be exactly 'comparison', 'stack', or 'linked-list' (use 'stack' ONLY if validating brackets/parentheses, use 'linked-list' ONLY if reversing a linked list).\n"
        "  2. entities: include relevant visualization entities representing arrays, strings, links, nodes, edges, or metrics.\n"
        "  3. states: produce exactly 3 states (e.g. 'before', 'bf-step', 'conclusion'). "
        "     Each state has a 'labels' list (1-3 strings) and a 'highlight' list referencing entity ids.\n"
        "  4. transitions: link states sequentially.\n"
        "  5. questions: exactly 2 questions asking about the naive time and space complexity.\n"
        f"  6. Ground the example values in: {example_str}.\n"
        "  7. Do not add extra fields beyond the schema."
    )

    user_prompt = json.dumps({
        "concept": concept.model_dump(),
        "diagnostic_report": diagnosis.model_dump() if diagnosis else {},
        "output_type": "VisualizationSpec",
        "instruction": (
            f"Produce a VisualizationSpec JSON for the brute-force or naive explanation of {concept.title}."
        ),
    })

    try:
        spec = call_structured_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_model=VisualizationSpec,
            fallback=lambda: _visualization_bf_fallback(session),
        )
        log_agent_call(session, "VisualizationAgentBF", {"llm_spec_id": spec.id, "states": len(spec.states)})
        return spec
    except Exception as exc:
        LOGGER.warning("VisualizationAgent BF LLM call failed: %s; using fallback", exc)
        return _visualization_bf_fallback(session)


def visualization_agent_stub(session: StudentSession) -> VisualizationSpec:
    log_agent_call(session, "VisualizationAgent", {"active_topic": session.active_topic})
    return VisualizationSpec(
        type="comparison",
        id="two-sum-hashmap-visual",
        title="HashMap lookup vs brute force scan",
        layout={"orientation": "left-right"},
        entities=[
            {"id": "array", "kind": "array", "label": "nums = [2, 7, 11, 15]", "rows": ["2", "7", "11", "15"]},
            {"id": "target", "kind": "metric", "label": "target = 9", "value": 9},
            {"id": "bruteforce", "kind": "flow", "label": "brute force: check every pair"},
            {"id": "hashmap", "kind": "node", "label": "hash map: store seen values"},
            {"id": "lookup", "kind": "node", "label": "lookup complement"}
        ],
        relations=[
            {"from": "array", "to": "bruteforce", "label": "scan all pairs"},
            {"from": "array", "to": "hashmap", "label": "add seen values"},
            {"from": "hashmap", "to": "lookup", "label": "check if target - current exists"}
        ],
        states=[
            {"id": "before", "labels": ["array is unsorted and values are unprocessed"], "highlight": ["array"]},
            {"id": "during", "labels": ["current value 2 -> complement is 7"], "highlight": ["lookup", "hashmap"]},
            {"id": "after", "labels": ["match found without scanning all pairs"], "highlight": ["lookup"]}
        ],
        transitions=[
            {"from": "before", "to": "during", "animation": "highlight-complement", "durationMs": 700},
            {"from": "during", "to": "after", "animation": "resolve-match", "durationMs": 700}
        ],
        questions=[
            {"id": "q1", "prompt": "Why is it faster to check whether target - current is already in a hash map than to compare against every other number?", "expectedObservations": ["You avoid an O(n^2) scan", "Lookup checks one complement directly"]}
        ],
        expectedObservations=[
            "A brute-force approach compares each value with every other value.",
            "A hash map directly checks whether the complement exists.",
            "This reduces the average work from quadratic to linear."
        ]
    )


def practice_agent_stub(session: StudentSession) -> ExerciseSet:
    log_agent_call(session, "PracticeAgent", {"topic": session.active_topic})
    brief = get_topic_brief(session.metadata.get("concept_id", ""))
    prompt = (
        brief.practice_challenge
        if brief and brief.practice_challenge
        else "For nums = [2, 7, 11, 15], target = 9, what is the complement of 2 and why is it useful?"
    )
    hints = (
        ["Think about the key facts from the explanation", "Walk through the example step by step"]
        if brief
        else ["Think about target - current_value", "You are looking for the other number, not a sorted order"]
    )
    return ExerciseSet(
        exercises=[
            ExerciseTask(
                id="task-1",
                type="prediction",
                prompt=prompt,
                expected_reasoning="; ".join(brief.key_facts) if brief and brief.key_facts else "Explanation grounded in the concept's key facts.",
                hints=hints
            )
        ],
        summary="Practice is focused on explaining the core mechanism in the student's own words."
    )


def _evaluation_fallback(session: StudentSession) -> EvaluationResult:
    return EvaluationResult(
        passed=False,
        score=0.0,
        reasoning_quality="Unable to auto-grade.",
        misconception_detected=[],
        feedback="Auto-grading failed. Marked for manual review."
    )


def evaluation_agent_real(session: StudentSession) -> EvaluationResult:
    concept = session.concept_history[0] if session.concept_history else None
    diagnosis = session.diagnosis
    answers = session.student_answers

    if not concept:
        return _evaluation_fallback(session)

    system_prompt = (
        "You are an expert grading and evaluation agent for a computer science learning platform.\n"
        "Your task is to evaluate the student's answers to checkpoint questions against the ground truth ConceptModel.\n\n"
        "Evaluate the following criteria:\n"
        "1. Factual Correctness: Is the answer correct, partially correct, or incorrect judged against the ConceptModel key facts?\n"
        "2. Reasoning Quality: Does the answer reflect a real understanding of the core concept and optimized solution (based on the ConceptModel key facts), or is it a superficial/correct-sounding guess without justification?\n"
        "3. Misconceptions: Does the answer show the originally suspected misconception (from the DiagnosticReport or Concept misconceptions list), a different misconception, or none?\n\n"
        "Strictly return an EvaluationResult JSON object matching the requested schema."
    )

    user_prompt = json.dumps({
        "concept_key_facts": concept.key_facts,
        "concept_misconceptions": concept.misconceptions,
        "original_diagnosis": diagnosis.model_dump() if diagnosis else {},
        "student_answers": answers,
        "output_type": "EvaluationResult"
    })

    try:
        model = call_structured_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_model=EvaluationResult,
            fallback=lambda: _evaluation_fallback(session),
        )
        return model
    except Exception as exc:
        LOGGER.warning("EvaluationAgent LLM call failed: %s; using fallback", exc)
        return _evaluation_fallback(session)


def _adaptation_fallback(session: StudentSession) -> AdaptationDecision:
    return AdaptationDecision(
        action="continue",
        reason="Let's continue to the next concept.",
        next_step="completed",
        updated_difficulty="moderate"
    )


def adaptation_agent_real(session: StudentSession) -> AdaptationDecision:
    # Find the latest evaluation from agent_trace
    latest_eval = None
    for trace in reversed(session.metadata.get("agent_trace", [])):
        if trace.get("agent") == "EvaluationAgent" and "result" in trace:
            latest_eval = trace["result"]
            break

    diagnosis = session.diagnosis
    concept = session.concept_history[0] if session.concept_history else None

    system_prompt = (
        "You are an adaptive curriculum coordinator agent.\n"
        "Based on the student's EvaluationResult and the original DiagnosticReport, select the next best adaptation action.\n\n"
        "Possible Actions:\n"
        "- 'continue': The student understood the core concepts. Move them to completed.\n"
        "- 'simplify': The student is struggling with basic concepts. Re-explain with simpler terms.\n"
        "- 're-teach': The student has partial understanding but needs a different representation (e.g., compare with brute force).\n"
        "- 'hint': The student is very close but made a minor mistake. Provide a helpful hint.\n"
        "- 'flag_misconception': The student still exhibits the originally suspected misconception or a new one. Address it directly and correct it.\n\n"
        "Provide a short human-readable explanation in the 'reason' field that the student will see directly.\n"
        "Set 'next_step' to:\n"
        "- 'completed' if action is 'continue'\n"
        "- 'visualize' if action is 're-teach', 'hint', 'simplify', or 'flag_misconception' (so they go back to the visualization/practice loop).\n"
        "Set 'updated_difficulty' to 'easy', 'moderate', or 'hard'."
    )

    user_prompt = json.dumps({
        "evaluation_result": latest_eval,
        "original_diagnosis": diagnosis.model_dump() if diagnosis else {},
        "concept": concept.model_dump() if concept else {},
        "output_type": "AdaptationDecision"
    })

    try:
        model = call_structured_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_model=AdaptationDecision,
            fallback=lambda: _adaptation_fallback(session),
        )
        return model
    except Exception as exc:
        LOGGER.warning("AdaptationAgent LLM call failed: %s; using fallback", exc)
        return _adaptation_fallback(session)
