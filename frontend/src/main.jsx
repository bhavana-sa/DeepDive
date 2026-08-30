import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

const API_BASE = 'http://127.0.0.1:8000';

// Inject NeetCode-style dark theme & landing styles into document head
const styles = `
.auth-container {
  max-width: 400px;
  margin: 80px auto;
  padding: 30px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}
.auth-tabs {
  display: flex;
  margin-bottom: 24px;
  border-bottom: 2px solid #f1f5f9;
}
.auth-tab {
  flex: 1;
  padding: 10px;
  text-align: center;
  font-weight: bold;
  cursor: pointer;
  color: #64748b;
  border-bottom: 2px solid transparent;
}
.auth-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}
.auth-input {
  width: 100%;
  padding: 10px 14px;
  margin-bottom: 16px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-sizing: border-box;
}
.auth-btn {
  width: 100%;
  padding: 12px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}
.auth-btn:hover {
  background-color: #2563eb;
}
.error-msg {
  color: #dc2626;
  background-color: #fef2f2;
  padding: 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 16px;
  border: 1px solid #fee2e2;
  font-weight: 500;
}

/* Timeline and timeline steps */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 20px 0;
}
.timeline-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.timeline-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #475569;
  font-weight: bold;
}
.timeline-dot.active {
  background-color: #3b82f6;
  color: white;
}
.timeline-content {
  background-color: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  flex-grow: 1;
}

/* Card classes */
.diagnose-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin-top: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.diagnose-section-title {
  font-size: 0.95rem;
  font-weight: bold;
  color: #334155;
  margin-bottom: 8px;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.summary-tag {
  background-color: #f1f5f9;
  color: #475569;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}
.missing-tag {
  background-color: #eff6ff;
  color: #1d4ed8;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}
.misconception-tag {
  background-color: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Player Switcher Tabs */
.method-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.method-tab {
  background-color: #313244;
  color: #a6adc8;
  border: 1px solid #45475a;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
}
.method-tab.active {
  background-color: #89b4fa;
  color: #11111b;
  border-color: #89b4fa;
}

/* Styled text editor */
.editor-textarea {
  flex: 1;
  padding: 10px;
  background-color: transparent;
  color: #cdd6f4;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  white-space: pre;
  overflow-x: auto;
  min-height: 180px;
}

/* Unified Platform Styling */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin-top: 24px;
}
.topic-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 160px;
}
.topic-card:hover:not(.disabled) {
  transform: translateY(-4px);
  border-color: #3b82f6;
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1);
}
.topic-card.disabled {
  background-color: #f8fafc;
  border-color: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.6;
}
.coming-soon-badge {
  font-size: 0.75rem;
  background-color: #e2e8f0;
  color: #475569;
  padding: 2px 8px;
  border-radius: 4px;
  align-self: flex-start;
  font-weight: 600;
}
.breadcrumb-container {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 24px;
  font-weight: 500;
}
.breadcrumb-item {
  cursor: pointer;
  transition: color 0.2s;
}
.breadcrumb-item:hover {
  color: #3b82f6;
}
.breadcrumb-separator {
  color: #cbd5e1;
}
.problem-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}
.problem-row:hover:not(.disabled) {
  border-color: #3b82f6;
  background-color: #f8fafc;
}
.problem-row.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.player-container {
  display: flex;
  flex-direction: column;
  background-color: #1e1e2e;
  border-radius: 12px;
  color: #cdd6f4;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  margin-top: 20px;
}
.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #181825;
  padding: 12px 20px;
  border-bottom: 1px solid #313244;
}
.player-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}
.control-btn {
  background: none;
  border: none;
  color: #cdd6f4;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.control-btn:hover {
  background-color: #313244;
  color: #89b4fa;
}
.control-btn:disabled {
  color: #585b70;
  cursor: not-allowed;
}
.speed-select {
  background-color: #313244;
  color: #cdd6f4;
  border: 1px solid #45475a;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.progress-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: #a6adc8;
}
.player-body {
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  min-height: 480px;
}
@media (max-width: 900px) {
  .player-body {
    grid-template-columns: 1fr;
  }
}
.player-left {
  padding: 24px;
  border-right: 1px solid #313244;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #1e1e2e;
}
.player-right {
  display: flex;
  flex-direction: column;
  background-color: #11111b;
}
.input-bar {
  background-color: #11111b;
  padding: 10px 24px;
  font-family: monospace;
  font-size: 0.9rem;
  color: #f5e0dc;
  border-bottom: 1px solid #313244;
  display: flex;
  gap: 20px;
}
.code-panel {
  padding: 20px;
  font-family: 'Fira Code', Consolas, Monaco, monospace;
  font-size: 0.85rem;
  line-height: 1.7;
  flex-grow: 1;
  overflow-y: auto;
  color: #cdd6f4;
}
.code-line {
  padding: 1px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  white-space: pre-wrap;
}
.code-line.highlighted {
  background-color: rgba(137, 180, 250, 0.15);
  border-left: 3px solid #89b4fa;
  color: #89b4fa;
}
.complexity-panel {
  background-color: #181825;
  padding: 16px 20px;
  border-top: 1px solid #313244;
  font-size: 0.85rem;
}
.complexity-title {
  font-weight: bold;
  color: #89b4fa;
  margin-bottom: 8px;
}
.complexity-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.complexity-item:last-child {
  margin-bottom: 0;
}
.vis-panel-header {
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 12px;
  color: #cdd6f4;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.array-row {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 16px 0;
}
.array-box {
  width: 48px;
  height: 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px solid #45475a;
  border-radius: 8px;
  font-size: 1.15rem;
  font-weight: bold;
  background-color: #313244;
  color: #cdd6f4;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.array-box.highlight {
  border-color: #89b4fa;
  background-color: rgba(137, 180, 250, 0.15);
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(137, 180, 250, 0.25);
}
.array-box.success {
  border-color: #a6e3a1;
  background-color: rgba(166, 227, 161, 0.15);
  color: #a6e3a1;
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(166, 227, 161, 0.25);
}
.array-idx {
  font-size: 0.65rem;
  color: #9399b2;
  position: absolute;
  bottom: 2px;
}
.hash-container {
  background-color: #181825;
  border: 1px dashed #45475a;
  border-radius: 8px;
  padding: 12px;
  min-height: 70px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}
.hash-entry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #313244;
  color: #cdd6f4;
  padding: 4px 10px;
  border-radius: 20px;
  font-family: monospace;
  font-weight: bold;
  font-size: 0.85rem;
  opacity: 0;
  transform: translateY(8px);
  animation: slideUpFade 0.4s forwards cubic-bezier(0.16, 1, 0.3, 1);
  transition: all 0.3s ease;
}
.hash-entry.active-match {
  background-color: #f9e2af;
  color: #11111b;
  border: 1px solid #f9e2af;
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(249, 226, 175, 0.2);
}
@keyframes slideUpFade {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.info-box {
  background-color: #313244;
  border-left: 4px solid #89b4fa;
  color: #cdd6f4;
  padding: 12px 16px;
  margin: 12px 0;
  border-radius: 0 8px 8px 0;
}
.misconception-warning {
  background-color: rgba(249, 226, 175, 0.1);
  border-left: 4px solid #f9e2af;
  color: #f9e2af;
  padding: 12px 16px;
  margin: 12px 0;
  border-radius: 0 8px 8px 0;
  font-weight: 500;
}
.question-section {
  border-top: 1px solid #313244;
  margin-top: 16px;
  padding-top: 16px;
}
.intro-array-animation {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 24px 0;
}
.intro-array-box {
  width: 50px;
  height: 50px;
  border: 2px solid #cbd5e1;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border-radius: 8px;
  font-size: 1.1rem;
  color: #334155;
  opacity: 0;
  transform: scale(0.8);
  animation: popIn 0.4s forwards;
}
@keyframes popIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}
`;

const styleEl = document.createElement('style');
styleEl.innerHTML = styles;
document.head.appendChild(styleEl);

// State representations of Brute Force spec locally (or dynamically backed up)
const LOCAL_BF_SPEC = {
  type: "comparison",
  id: "two-sum-bf-visual",
  title: "Brute-force pairwise scan — Two Sum",
  layout: { orientation: "left-right" },
  entities: [
    { id: "array-bf", kind: "array", label: "nums = [2, 7, 11, 15]", rows: ["2", "7", "11", "15"] }
  ],
  states: [
    {
      id: "before",
      labels: ["Start: nums = [2, 7, 11, 15], target = 9. Nested loops will compare pairs sequentially."],
      highlight: []
    },
    {
      id: "bf-step",
      labels: [
        "Brute force comparison: checking nums[0] (2) + nums[1] (7) = 9.",
        "✓ Match found! We return index [0, 1] immediately."
      ],
      highlight: ["array-bf"]
    },
    {
      id: "conclusion",
      labels: [
        "Conclusion: In this scenario, j was 1, so the scan finished in 1 step.",
        "However, worst-case scans N * (N - 1) / 2 comparisons, leading to O(N²) time complexity."
      ],
      highlight: ["array-bf"]
    }
  ],
  transitions: [
    { from: "before", to: "bf-step", animation: "fade", durationMs: 900 },
    { from: "bf-step", to: "conclusion", animation: "fade", durationMs: 900 }
  ],
  questions: [
    {
      id: "q_bf_1",
      prompt: "Why does the brute force approach have a time complexity of O(N²)?",
      expectedObservations: ["Nested loops check all pairs", "Worst-case checks all combinations"]
    },
    {
      id: "q_bf_2",
      prompt: "What is the space complexity of the brute force approach?",
      expectedObservations: ["O(1) auxiliary space", "In-place element checking"]
    }
  ]
};

const STATE_TO_LINE_MAP = {
  'brute-force': {
    'before': [1, 2],
    'bf-step': [3, 4],
    'conclusion': [5]
  },
  'hashmap': {
    'before': [1],
    'bf-step': [2],
    'hm-insert': [6],
    'hm-lookup': [3, 4],
    'conclusion': [5]
  }
};

function Breadcrumbs({ path, onNavigate }) {
  return (
    <div className="breadcrumb-container">
      <span className="breadcrumb-item" onClick={() => onNavigate('topics')}>Home</span>
      {path.map((item, idx) => (
        <React.Fragment key={idx}>
          <span className="breadcrumb-separator">/</span>
          <span 
            className="breadcrumb-item" 
            onClick={() => onNavigate(item.target)}
          >
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

function CodeEditor({ code, onChange }) {
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div style={{ display: 'flex', fontFamily: 'monospace', fontSize: '0.85rem', backgroundColor: '#11111b', border: '1px solid #313244', borderRadius: '8px', overflow: 'hidden', marginTop: '10px' }}>
      <div style={{ padding: '10px', backgroundColor: '#181825', borderRight: '1px solid #313244', color: '#585b70', textAlign: 'right', userSelect: 'none', minWidth: '24px' }}>
        {lineNumbers.map(n => <div key={n}>{n}</div>)}
      </div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="editor-textarea"
      />
    </div>
  );
}

function ArrayBoxes({ values, highlightIndices, successIndices }) {
  return (
    <div className="array-row">
      {values.map((val, idx) => {
        const isHighlight = highlightIndices.includes(idx);
        const isSuccess = successIndices.includes(idx);
        let className = "array-box";
        if (isSuccess) className += " success";
        else if (isHighlight) className += " highlight";

        return (
          <div key={idx} className={className}>
            <span>{val}</span>
            <span className="array-idx">{idx}</span>
          </div>
        );
      })}
    </div>
  );
}

function LinkedListNodes({ values, activeState, stateId }) {
  let prevIdx = -1;
  let currIdx = -1;
  let nextIdx = -1;
  let arrows = [true, true, true, true]; // true: right (➔), false: left (🠜), null: disconnected

  const lowerState = (stateId || '').toLowerCase();
  if (lowerState.includes('before') || lowerState === 'start') {
    currIdx = 0;
    nextIdx = 1;
  } else if (lowerState.includes('step') || lowerState.includes('reverse') || lowerState.includes('redirect')) {
    prevIdx = 0;
    currIdx = 1;
    nextIdx = 2;
    arrows[0] = false;
  } else if (lowerState.includes('conclusion') || lowerState.includes('end') || lowerState.includes('finish')) {
    arrows = [false, false, false, false];
    currIdx = 4;
    prevIdx = 4;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {values.map((val, idx) => {
          const isCurr = idx === currIdx;
          const isPrev = idx === prevIdx;
          const isNext = idx === nextIdx;
          
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ height: '18px', fontSize: '0.75rem', fontWeight: 'bold', color: '#f9e2af' }}>
                  {isPrev && 'prev'}
                  {isCurr && (isPrev ? ' / curr' : 'curr')}
                  {isNext && 'next'}
                </div>
                <div style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '8px',
                  border: isCurr ? '2px solid #a6e3a1' : '1px solid #45475a',
                  backgroundColor: isCurr ? '#2a443b' : '#1e1e2e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#cdd6f4',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  {val}
                </div>
              </div>
              {idx < values.length - 1 && (
                <div style={{ 
                  fontSize: '1.4rem', 
                  color: '#89b4fa', 
                  margin: '0 6px', 
                  alignSelf: 'flex-end',
                  marginBottom: '10px'
                }}>
                  {arrows[idx] === true ? '➔' : '🠜'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VisualizationRenderer({ hmSpec, bfSpec, session, onAnswerSubmitted, onNextStep }) {
  const [activeMethod, setActiveMethod] = useState('hashmap'); // 'brute-force' | 'hashmap'
  const [currentStateIdx, setCurrentStateIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [checkpointAnswer, setCheckpointAnswer] = useState('');
  const [submitFeedback, setSubmitFeedback] = useState('');
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  
  // Custom edited code per method (loaded from ConceptModel methods default or modified locally)
  const concept = session.concept_history[0];
  const conceptId = session?.metadata?.concept_id || 'two-sum-hashmap';
  const topicBrief = session?.metadata?.topic_brief || null;

  const bruteMethod = concept?.methods?.find(m => m.id.toLowerCase().includes('brute') || m.id.toLowerCase().includes('naive')) || concept?.methods[0];
  const optMethod = concept?.methods?.find(m => !(m.id.toLowerCase().includes('brute') || m.id.toLowerCase().includes('naive') || (bruteMethod && m.id === bruteMethod.id))) || concept?.methods[1];

  const bruteForceCodeDefault = bruteMethod?.code ||
    (topicBrief ? "# Method implementation details not provided." :
     "def twoSum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i]+nums[j] == target:\n                return [i, j]\n    return []");
  const hashmapCodeDefault = optMethod?.code ||
    (topicBrief ? "# Method implementation details not provided." :
     "def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []");

  const [codeBf, setCodeBf] = useState(bruteForceCodeDefault);
  const [codeHm, setCodeHm] = useState(hashmapCodeDefault);

  const bfComplexity = bruteMethod?.complexity || { time: 'O(N²)', space: 'O(1)' };
  const optComplexity = optMethod?.complexity || { time: 'O(N) average', space: 'O(N)' };

  const CURATED_INPUTS = {
    'contains-duplicate': "nums = [1, 2, 3, 1]",
    'valid-anagram': "s = 'anagram', t = 'nagaram'",
    'best-time-stock': "prices = [7, 1, 5, 3, 6, 4]",
    'max-subarray': "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
    'valid-parentheses': "s = '([]){}'",
    'reverse-linked-list': "head = [1 -> 2 -> 3 -> 4 -> 5]",
    'group-anagrams': "strs = ['eat','tea','tan','ate','nat','bat']",
    'product-except-self': "nums = [1, 2, 3, 4]",
    'top-k-frequent': "nums = [1,1,1,2,2,3], k = 2",
    'longest-consecutive': "nums = [100, 4, 200, 1, 3, 2]"
  };
  const CURATED_VALUES = {
    'contains-duplicate': [1, 2, 3, 1],
    'valid-anagram': ['a', 'n', 'a', 'g', 'r', 'a', 'm'],
    'best-time-stock': [7, 1, 5, 3, 6, 4],
    'max-subarray': [-2, 1, -3, 4, -1, 2, 1, -5, 4],
    'valid-parentheses': ['(', '[', ']', ')', '{', '}'],
    'group-anagrams': ["eat","tea","tan","ate","nat","bat"],
    'product-except-self': [1, 2, 3, 4],
    'top-k-frequent': [1, 1, 1, 2, 2, 3],
    'longest-consecutive': [100, 4, 200, 1, 3, 2]
  };

  const inputDisplay = topicBrief
    ? (topicBrief.input_display || topicBrief.title)
    : (CURATED_INPUTS[conceptId] || "nums = [2, 7, 11, 15], target = 9");
  const arrayValues = topicBrief
    ? (topicBrief.example_values?.length ? topicBrief.example_values : ['step 1', 'step 2', 'step 3'])
    : (CURATED_VALUES[conceptId] || [2, 7, 11, 15]);
  const isLinkedListConcept = conceptId === 'reverse-linked-list';

  const timerRef = useRef(null);

  const activeSpec = activeMethod === 'hashmap' ? hmSpec : (bfSpec || LOCAL_BF_SPEC);
  const totalStates = activeSpec.states.length;

  // Reset step counter if method changes
  useEffect(() => {
    setCurrentStateIdx(0);
    setIsPlaying(false);
    setActiveQuestionIdx(0);
    setCheckpointAnswer('');
    setSubmitFeedback('');
  }, [activeMethod]);

  const currentState = activeSpec.states[currentStateIdx];
  const stateId = currentState ? currentState.id : '';

  // Filter questions for the current method spec - only active at the conclusion state
  const currentQuestions = activeSpec.questions || [];
  const showQuestionSection = currentStateIdx === totalStates - 1;
  const currentQuestion = showQuestionSection && currentQuestions.length > 0 ? currentQuestions[activeQuestionIdx % currentQuestions.length] : null;

  useEffect(() => {
    if (isPlaying) {
      const duration = 2000 / speed;
      timerRef.current = setTimeout(() => {
        if (currentStateIdx < totalStates - 1) {
          setCurrentStateIdx(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentStateIdx, speed]);

  // Determine array indices to highlight
  let bfHighlight = [];
  let bfSuccess = [];
  let hmHighlight = [];
  let hmSuccess = [];
  let showMapEntries = [];

  if (conceptId === 'two-sum-hashmap') {
    if (activeMethod === 'brute-force') {
      if (stateId === 'bf-step') {
        bfHighlight = [0, 1];
        bfSuccess = [0, 1];
      } else if (stateId === 'conclusion') {
        bfSuccess = [0, 1];
      }
    } else {
      if (stateId === 'bf-step') {
        hmHighlight = [0, 1];
      } else if (stateId === 'hm-insert') {
        hmHighlight = [0];
        showMapEntries = [{ key: '2', val: '0' }];
      } else if (stateId === 'hm-lookup') {
        hmHighlight = [1];
        showMapEntries = [{ key: '2', val: '0', highlighted: true }];
      } else if (stateId === 'conclusion') {
        hmSuccess = [0, 1];
        showMapEntries = [{ key: '2', val: '0' }];
      }
    }
  } else if (topicBrief) {
    // Custom synthesized topic: light boxes up progressively as states advance
    const highlights = currentStateIdx > 0 ? Array.from({ length: Math.min(currentStateIdx + 1, arrayValues.length) }, (_, i) => i) : [];
    if (activeMethod === 'brute-force') {
      bfHighlight = highlights;
      if (stateId.toLowerCase().includes('conclusion')) bfSuccess = highlights;
    } else {
      hmHighlight = highlights;
      if (stateId.toLowerCase().includes('conclusion')) hmSuccess = highlights;
      const lowered = stateId.toLowerCase();
      if (lowered.includes('insert') || lowered.includes('add') || lowered.includes('step') || lowered.includes('track')) {
        showMapEntries = arrayValues.slice(0, Math.min(currentStateIdx + 1, 3)).map((v, i) => ({ key: String(v), val: String(i), highlighted: i === currentStateIdx - 1 }));
      }
    }
  } else {
    // Dynamic highlights based on state highlights parsing
    const highlights = currentState ? (currentState.highlight || []) : [];
    if (activeMethod === 'brute-force') {
      bfHighlight = highlights.map(h => parseInt(h)).filter(v => !isNaN(v));
      if (stateId === 'conclusion') {
        bfSuccess = [0, 1, 2, 3];
      }
    } else {
      hmHighlight = highlights.map(h => parseInt(h)).filter(v => !isNaN(v));
      if (stateId === 'conclusion') {
        hmSuccess = [0, 1, 2, 3];
      }
      if (conceptId === 'valid-parentheses') {
        if (stateId.includes('push') || stateId.includes('insert') || stateId.includes('step')) {
          showMapEntries = [{ key: '(', val: '0' }];
        }
      } else {
        if (stateId.includes('insert') || stateId.includes('seen') || stateId.includes('add')) {
          showMapEntries = [{ key: '1', val: '0' }];
        }
      }
    }
  }

  const handleNext = () => {
    if (currentStateIdx < totalStates - 1) {
      setCurrentStateIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStateIdx > 0) {
      setCurrentStateIdx(prev => prev - 1);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleNextQuestion = () => {
    if (activeQuestionIdx < currentQuestions.length - 1) {
      setActiveQuestionIdx(prev => prev + 1);
      setCheckpointAnswer('');
      setSubmitFeedback('');
    }
  };

  const handlePrevQuestion = () => {
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx(prev => prev - 1);
      setCheckpointAnswer('');
      setSubmitFeedback('');
    }
  };

  const handleAnswerSubmit = async (qId) => {
    if (!checkpointAnswer.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/api/session/answer`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        },
        body: JSON.stringify({
          session_id: session.session_id,
          question_id: qId,
          answer: checkpointAnswer,
        }),
      });
      if (response.ok) {
        setSubmitFeedback('Saved!');
        onAnswerSubmitted(qId, checkpointAnswer);
      } else {
        setSubmitFeedback('Failed to save.');
      }
    } catch (err) {
      setSubmitFeedback('Error: ' + err.message);
    }
  };

  // Sync edits to the parent session Answers store
  const handleCodeChange = (newVal) => {
    if (activeMethod === 'brute-force') {
      setCodeBf(newVal);
      onAnswerSubmitted('edited-code-bf', newVal);
    } else {
      setCodeHm(newVal);
      onAnswerSubmitted('edited-code-hm', newVal);
    }
  };

  const currentCode = activeMethod === 'brute-force' ? codeBf : codeHm;
  const methodLines = currentCode.split('\n');

  // Determine line highlights from mapping
  const currentLineMapping = STATE_TO_LINE_MAP[activeMethod] || {};
  const activeCodeLines = currentLineMapping[stateId] || [];

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Tab Switcher */}
      <div className="method-tabs">
        <button
          className={`method-tab ${activeMethod === 'brute-force' ? 'active' : ''}`}
          onClick={() => setActiveMethod('brute-force')}
        >
          {bruteMethod?.name || "Naive / Brute Force"}
        </button>
        <button
          className={`method-tab ${activeMethod === 'hashmap' ? 'active' : ''}`}
          onClick={() => setActiveMethod('hashmap')}
        >
          {optMethod?.name || "Optimized / Efficient"}
        </button>
      </div>

      <div className="player-container">
        {/* Header Controls */}
        <div className="player-header">
          <div className="player-controls">
            <button className="control-btn" onClick={handlePrev} disabled={currentStateIdx === 0} title="Step Back">
              ⏮
            </button>
            <button className="control-btn" onClick={handlePlayPause} title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="control-btn" onClick={handleNext} disabled={currentStateIdx === totalStates - 1} title="Step Forward">
              ⏭
            </button>
            <select 
              className="speed-select" 
              value={speed} 
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
            >
              <option value="0.5">0.5x</option>
              <option value="1">1.0x</option>
              <option value="2">2.0x</option>
            </select>
          </div>
          <div className="progress-text">
            Step {currentStateIdx + 1} / {totalStates}
          </div>
        </div>

        {/* Input panel */}
        <div className="input-bar">
          <span><strong>Input:</strong> {inputDisplay}</span>
        </div>

        {/* Visualizer and Code Grid */}
        <div className="player-body">
          
          {/* Left panel: Visualizations */}
          <div className="player-left">
            {activeMethod === 'brute-force' ? (
              <div style={{ border: '1px solid #313244', borderRadius: '8px', padding: '16px', backgroundColor: '#181825' }}>
                <div className="vis-panel-header">
                  <span>{bruteMethod?.name || "Naive Approach"}</span>
                  <span style={{ fontSize: '0.75rem', background: '#313244', padding: '2px 8px', borderRadius: '4px', color: '#f38ba8' }}>{bfComplexity.time}</span>
                </div>
                {(() => {
                  if (isLinkedListConcept) {
                    return <LinkedListNodes values={arrayValues} activeState={currentState} stateId={stateId} />;
                  }
                  return <ArrayBoxes values={arrayValues} highlightIndices={bfHighlight} successIndices={bfSuccess} />;
                })()}
              </div>
            ) : (
              <div style={{ border: '1px solid #313244', borderRadius: '8px', padding: '16px', backgroundColor: '#181825' }}>
                <div className="vis-panel-header">
                  <span>{optMethod?.name || "Optimized Approach"}</span>
                  <span style={{ fontSize: '0.75rem', background: '#313244', padding: '2px 8px', borderRadius: '4px', color: '#a6e3a1' }}>{optComplexity.time}</span>
                </div>
                {(() => {
                  if (isLinkedListConcept) {
                    return <LinkedListNodes values={arrayValues} activeState={currentState} stateId={stateId} />;
                  }

                  return (
                    <>
                      <ArrayBoxes values={arrayValues} highlightIndices={hmHighlight} successIndices={hmSuccess} />
                      <div style={{ fontSize: '0.8rem', color: '#a6adc8', marginBottom: '6px', fontWeight: 'bold' }}>
                        {conceptId === 'valid-parentheses' ? 'Stack Structure:' : 'Auxiliary Memory / Map / Set:'}
                      </div>
                      <div className="hash-container">
                        {showMapEntries.length === 0 ? (
                          <span style={{ color: '#585b70', fontSize: '0.8rem', fontStyle: 'italic' }}>empty</span>
                        ) : (
                          showMapEntries.map((entry, idx) => (
                            <div key={idx} className={`hash-entry ${entry.highlighted ? 'active-match' : ''}`}>
                              {conceptId === 'valid-parentheses' ? (
                                <span>char: {entry.key}</span>
                              ) : (
                                <>
                                  <span>{entry.key}</span>
                                  <span>:</span>
                                  <span>seen</span>
                                </>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* State explanations */}
            <div>
              {currentState && currentState.labels.map((lbl, idx) => {
                const isWarning = lbl.startsWith('⚠');
                return (
                  <div key={idx} className={isWarning ? 'misconception-warning' : 'info-box'}>
                    {lbl}
                  </div>
                );
              })}
            </div>

            {/* Checkpoint Question Section */}
            {currentQuestion && (
              <div className="question-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f9e2af' }}>
                    Checkpoint Check ({activeQuestionIdx + 1} / {currentQuestions.length})
                  </div>
                  {currentQuestions.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={handlePrevQuestion} 
                        disabled={activeQuestionIdx === 0}
                        style={{ padding: '2px 8px', fontSize: '0.75rem', background: '#313244', border: '1px solid #45475a', color: '#cdd6f4', borderRadius: '4px', cursor: activeQuestionIdx === 0 ? 'not-allowed' : 'pointer', opacity: activeQuestionIdx === 0 ? 0.5 : 1 }}
                      >
                        ← Prev Q
                      </button>
                      <button 
                        onClick={handleNextQuestion} 
                        disabled={activeQuestionIdx === currentQuestions.length - 1}
                        style={{ padding: '2px 8px', fontSize: '0.75rem', background: '#313244', border: '1px solid #45475a', color: '#cdd6f4', borderRadius: '4px', cursor: activeQuestionIdx === currentQuestions.length - 1 ? 'not-allowed' : 'pointer', opacity: activeQuestionIdx === currentQuestions.length - 1 ? 0.5 : 1 }}
                      >
                        Next Q →
                      </button>
                    </div>
                  )}
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#cdd6f4' }}>
                  {currentQuestion.prompt}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={checkpointAnswer}
                    onChange={(e) => setCheckpointAnswer(e.target.value)}
                    placeholder="Answer..."
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #45475a', backgroundColor: '#11111b', color: '#cdd6f4' }}
                  />
                  <button
                    onClick={() => handleAnswerSubmit(currentQuestion.id)}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#a6e3a1', color: '#11111b', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Submit
                  </button>
                </div>
                {submitFeedback && (
                  <div style={{ fontSize: '0.8rem', color: '#a6e3a1', marginTop: '6px', fontWeight: 'bold' }}>
                    {submitFeedback}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right panel: Monospace Code Editor */}
          <div className="player-right">
            <div style={{ padding: '16px 20px 0 20px', fontSize: '0.8rem', color: '#89d4fa', fontWeight: 'bold' }}>
              Editable Editor Pane (Read / Write):
            </div>
            
            <div className="code-panel">
              <div style={{ display: 'flex', fontFamily: 'monospace', fontSize: '0.85rem', backgroundColor: '#11111b', border: '1px solid #313244', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '10px', backgroundColor: '#181825', borderRight: '1px solid #313244', color: '#585b70', textAlign: 'right', userSelect: 'none', minWidth: '24px' }}>
                  {methodLines.map((_, idx) => (
                    <div key={idx} style={{ color: activeCodeLines.includes(idx) ? '#89b4fa' : '#585b70', fontWeight: activeCodeLines.includes(idx) ? 'bold' : 'normal' }}>
                      {idx + 1}
                    </div>
                  ))}
                </div>
                <textarea
                  value={currentCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="editor-textarea"
                />
              </div>
            </div>

            {/* Complexity display */}
            <div className="complexity-panel">
              <div className="complexity-title">Complexity Analysis</div>
              <div className="complexity-item">
                <span style={{ color: '#a6adc8' }}>Time Complexity:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: activeMethod === 'brute-force' ? '#f38ba8' : '#a6e3a1' }}>
                  {activeMethod === 'brute-force' ? bfComplexity.time : optComplexity.time}
                </span>
              </div>
              <div className="complexity-item">
                <span style={{ color: '#a6adc8' }}>Space Complexity:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: activeMethod === 'brute-force' ? '#a6e3a1' : '#f9e2af' }}>
                  {activeMethod === 'brute-force' ? bfComplexity.space : optComplexity.space}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button 
          onClick={onNextStep}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
        >
          Proceed to Practice →
        </button>
      </div>
    </div>
  );
}

function AuthScreen({ onAuthSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');

    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'An error occurred during authentication.');
      } else {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', data.username);
        onAuthSuccess(data.token, data.username);
      }
    } catch (err) {
      setError('Connection refused. Is backend running?');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-tabs">
        <div className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</div>
        <div className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>Sign Up</div>
      </div>
      
      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Username</label>
        <input 
          type="text" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          className="auth-input" 
          placeholder="Enter username"
        />
        
        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Password</label>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="auth-input" 
          placeholder="Enter password"
        />

        <button type="submit" className="auth-btn">
          {tab === 'login' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}

const PROBLEM_DETAILS = {
  'two-sum-hashmap': {
    title: "Two Sum",
    description: (
      <>
        <p style={{ margin: '0 0 12px 0' }}>
          Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices</em> of the two numbers such that they add up to <code>target</code>.
        </p>
        <p style={{ margin: '0 0 12px 0' }}>
          You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice. You can return the answer in any order.
        </p>
      </>
    ),
    examples: (
      <>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '12px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 1:</strong>
          <div style={{ marginTop: '4px' }}>Input: nums = [2,7,11,15], target = 9</div>
          <div>Output: [0,1]</div>
          <div style={{ color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].</div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 2:</strong>
          <div style={{ marginTop: '4px' }}>Input: nums = [3,2,4], target = 6</div>
          <div>Output: [1,2]</div>
        </div>
      </>
    ),
    constraints: (
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
        <li><code>2 &lt;= nums.length &lt;= 10⁴</code></li>
        <li><code>-10⁹ &lt;= nums[i] &lt;= 10⁹</code></li>
        <li><code>-10⁹ &lt;= target &lt;= 10⁹</code></li>
        <li>Only one valid answer exists.</li>
      </ul>
    )
  },
  'contains-duplicate': {
    title: "Contains Duplicate",
    description: (
      <>
        <p style={{ margin: '0 0 12px 0' }}>
          Given an array of integers <code>nums</code>, return <code>true</code> if any value appears <strong>at least twice</strong> in the array, and return <code>false</code> if every element is distinct.
        </p>
      </>
    ),
    examples: (
      <>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '12px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 1:</strong>
          <div style={{ marginTop: '4px' }}>Input: nums = [1,2,3,1]</div>
          <div>Output: true</div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 2:</strong>
          <div style={{ marginTop: '4px' }}>Input: nums = [1,2,3,4]</div>
          <div>Output: false</div>
        </div>
      </>
    ),
    constraints: (
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
        <li><code>1 &lt;= nums.length &lt;= 10⁵</code></li>
        <li><code>-10⁹ &lt;= nums[i] &lt;= 10⁹</code></li>
      </ul>
    )
  },
  'valid-anagram': {
    title: "Valid Anagram",
    description: (
      <>
        <p style={{ margin: '0 0 12px 0' }}>
          Given two strings <code>s</code> and <code>t</code>, return <code>true</code> if <code>t</code> is an anagram of <code>s</code>, and <code>false</code> otherwise.
        </p>
        <p style={{ margin: '0 0 12px 0' }}>
          An <strong>anagram</strong> is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.
        </p>
      </>
    ),
    examples: (
      <>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '12px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 1:</strong>
          <div style={{ marginTop: '4px' }}>Input: s = "anagram", t = "nagaram"</div>
          <div>Output: true</div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 2:</strong>
          <div style={{ marginTop: '4px' }}>Input: s = "rat", t = "car"</div>
          <div>Output: false</div>
        </div>
      </>
    ),
    constraints: (
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
        <li><code>1 &lt;= s.length, t.length &lt;= 5 * 10⁴</code></li>
        <li><code>s</code> and <code>t</code> consist of lowercase English letters.</li>
      </ul>
    )
  },
  'best-time-stock': {
    title: "Best Time to Buy and Sell Stock",
    description: (
      <>
        <p style={{ margin: '0 0 12px 0' }}>
          You are given an array <code>prices</code> where <code>prices[i]</code> is the price of a given stock on the <code>i<sup>th</sup></code> day.
        </p>
        <p style={{ margin: '0 0 12px 0' }}>
          You want to maximize your profit by choosing a <strong>single day</strong> to buy one stock and choosing a <strong>different day in the future</strong> to sell that stock.
        </p>
        <p style={{ margin: '0 0 12px 0' }}>
          Return <em>the maximum profit you can achieve from this transaction</em>. If you cannot achieve any profit, return <code>0</code>.
        </p>
      </>
    ),
    examples: (
      <>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '12px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 1:</strong>
          <div style={{ marginTop: '4px' }}>Input: prices = [7,1,5,3,6,4]</div>
          <div>Output: 5</div>
          <div style={{ color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5. Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell.</div>
        </div>
      </>
    ),
    constraints: (
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
        <li><code>1 &lt;= prices.length &lt;= 10⁵</code></li>
        <li><code>0 &lt;= prices[i] &lt;= 10⁴</code></li>
      </ul>
    )
  },
  'max-subarray': {
    title: "Maximum Subarray",
    description: (
      <>
        <p style={{ margin: '0 0 12px 0' }}>
          Given an integer array <code>nums</code>, find the contiguous subarray (containing at least one number) which has the largest sum and return <em>its sum</em>.
        </p>
      </>
    ),
    examples: (
      <>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '12px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 1:</strong>
          <div style={{ marginTop: '4px' }}>Input: nums = [-2,1,-3,4,-1,2,1,-5,4]</div>
          <div>Output: 6</div>
          <div style={{ color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>Explanation: The subarray [4,-1,2,1] has the largest sum = 6.</div>
        </div>
      </>
    ),
    constraints: (
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
        <li><code>1 &lt;= nums.length &lt;= 10⁵</code></li>
        <li><code>-10⁴ &lt;= nums[i] &lt;= 10⁴</code></li>
      </ul>
    )
  },
  'valid-parentheses': {
    title: "Valid Parentheses",
    description: (
      <>
        <p style={{ margin: '0 0 12px 0' }}>
          Given a string <code>s</code> containing just the characters <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code> and <code>']'</code>, determine if the input string is valid.
        </p>
        <p style={{ margin: '0 0 12px 0' }}>
          An input string is valid if:
        </p>
        <ol style={{ margin: '0 0 12px 0', paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
          <li>Open brackets must be closed by the same type of brackets.</li>
          <li>Open brackets must be closed in the correct order.</li>
          <li>Every close bracket has a corresponding open bracket of the same type.</li>
        </ol>
      </>
    ),
    examples: (
      <>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '12px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 1:</strong>
          <div style={{ marginTop: '4px' }}>Input: s = "()[]{}"</div>
          <div>Output: true</div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 2:</strong>
          <div style={{ marginTop: '4px' }}>Input: s = "(]"</div>
          <div>Output: false</div>
        </div>
      </>
    ),
    constraints: (
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
        <li><code>1 &lt;= s.length &lt;= 10⁴</code></li>
        <li><code>s</code> consists of parentheses only <code>'()[]{}'</code>.</li>
      </ul>
    )
  },
  'reverse-linked-list': {
    title: "Reverse Linked List",
    description: (
      <>
        <p style={{ margin: '0 0 12px 0' }}>
          Given the <code>head</code> of a singly linked list, reverse the list, and return <em>the reversed list</em>.
        </p>
      </>
    ),
    examples: (
      <>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '12px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 1:</strong>
          <div style={{ marginTop: '4px' }}>Input: head = [1,2,3,4,5]</div>
          <div>Output: [5,4,3,2,1]</div>
        </div>
      </>
    ),
    constraints: (
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
        <li>The number of nodes in the list is in the range <code>[0, 5000]</code>.</li>
        <li><code>-5000 &lt;= Node.val &lt;= 5000</code></li>
      </ul>
    )
  },
  'group-anagrams': {
    title: "Group Anagrams",
    description: (
      <>
        <p style={{ margin: '0 0 12px 0' }}>
          Given an array of strings <code>strs</code>, group the <strong>anagrams</strong> together. You can return the answer in <strong>any order</strong>.
        </p>
      </>
    ),
    examples: (
      <>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '12px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 1:</strong>
          <div style={{ marginTop: '4px' }}>Input: strs = ["eat","tea","tan","ate","nat","bat"]</div>
          <div>Output: [["bat"],["nat","tan"],["ate","eat","tea"]]</div>
        </div>
      </>
    ),
    constraints: (
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
        <li><code>1 &lt;= strs.length &lt;= 10⁴</code></li>
        <li><code>0 &lt;= strs[i].length &lt;= 100</code></li>
        <li><code>strs[i]</code> consists of lowercase English letters.</li>
      </ul>
    )
  },
  'product-except-self': {
    title: "Product of Array Except Self",
    description: (
      <>
        <p style={{ margin: '0 0 12px 0' }}>
          Given an integer array <code>nums</code>, return <em>an array</em> <code>answer</code> <em>such that</em> <code>answer[i]</code> <em>is equal to the product of all the elements of</em> <code>nums</code> <em>except</em> <code>nums[i]</code>.
        </p>
        <p style={{ margin: '0 0 12px 0' }}>
          You must write an algorithm that runs in <code>O(n)</code> time and without using the division operation.
        </p>
      </>
    ),
    examples: (
      <>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '12px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 1:</strong>
          <div style={{ marginTop: '4px' }}>Input: nums = [1,2,3,4]</div>
          <div>Output: [24,12,8,6]</div>
        </div>
      </>
    ),
    constraints: (
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
        <li><code>2 &lt;= nums.length &lt;= 10⁵</code></li>
        <li><code>-30 &lt;= nums[i] &lt;= 30</code></li>
        <li>The product of any prefix or suffix of <code>nums</code> is guaranteed to fit in a 32-bit integer.</li>
      </ul>
    )
  },
  'top-k-frequent': {
    title: "Top K Frequent Elements",
    description: (
      <>
        <p style={{ margin: '0 0 12px 0' }}>
          Given an integer array <code>nums</code> and an integer <code>k</code>, return <em>the</em> <code>k</code> <em>most frequent elements</em>. You may return the answer in <strong>any order</strong>.
        </p>
      </>
    ),
    examples: (
      <>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '12px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 1:</strong>
          <div style={{ marginTop: '4px' }}>Input: nums = [1,1,1,2,2,3], k = 2</div>
          <div>Output: [1,2]</div>
        </div>
      </>
    ),
    constraints: (
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
        <li><code>1 &lt;= nums.length &lt;= 10⁵</code></li>
        <li><code>-10⁴ &lt;= nums[i] &lt;= 10⁴</code></li>
        <li><code>k</code> is in the range <code>[1, the number of unique elements in the array]</code>.</li>
        <li>It is guaranteed that the answer is unique.</li>
      </ul>
    )
  },
  'longest-consecutive': {
    title: "Longest Consecutive Sequence",
    description: (
      <>
        <p style={{ margin: '0 0 12px 0' }}>
          Given an unsorted array of integers <code>nums</code>, return <em>the length of the longest consecutive elements sequence</em>.
        </p>
        <p style={{ margin: '0 0 12px 0' }}>
          You must write an algorithm that runs in <code>O(n)</code> time.
        </p>
      </>
    ),
    examples: (
      <>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '12px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          <strong>Example 1:</strong>
          <div style={{ marginTop: '4px' }}>Input: nums = [100,4,200,1,3,2]</div>
          <div>Output: 4</div>
          <div style={{ color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>Explanation: The longest consecutive elements sequence is [1, 2, 3, 4]. Therefore its length is 4.</div>
        </div>
      </>
    ),
    constraints: (
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
        <li><code>0 &lt;= nums.length &lt;= 10⁵</code></li>
        <li><code>-10⁹ &lt;= nums[i] &lt;= 10⁹</code></li>
      </ul>
    )
  }
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('auth_token') || '');
  const [user, setUser] = useState(localStorage.getItem('auth_user') || '');
  const [screen, setScreen] = useState(token ? 'topics' : 'auth'); // 'auth', 'topics', 'subtopics', 'intro', 'session', 'learn', 'topic_brief'
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  // Diagnose text input state
  const [typedApproach, setTypedApproach] = useState('');
  const [practiceAnswer, setPracticeAnswer] = useState('');
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [activeConceptId, setActiveConceptId] = useState('two-sum-hashmap');
  // Learn Anything: free-text topic synthesis
  const [customTopic, setCustomTopic] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Sync token from localStorage
  useEffect(() => {
    if (!token) {
      setScreen('auth');
    }
  }, [token]);

  // Auto-advance through evaluate state
  useEffect(() => {
    if (session && session.session_status === 'evaluate' && !isDiagnosing) {
      nextStep();
    }
  }, [session?.session_status]);

  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setScreen('topics');
  };

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken('');
    setUser('');
    setSession(null);
    setScreen('auth');
  };

  const startSession = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/session/start`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          concept_id: activeConceptId,
          student_profile: {
            name: user,
            current_level: 'beginner',
            goals: ['Learn optimized solutions for ' + activeConceptId],
            known_concepts: ['arrays', 'loops'],
            difficult_concepts: [],
            time_budget_minutes: 25,
          },
        }),
      });
      if (response.status === 401) {
        handleSignOut();
        return;
      }
      const data = await response.json();
      setSession(data);
      setScreen('session');
      setTypedApproach('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const startCustomSession = async (topicText) => {
    if (!topicText) return;
    setIsSynthesizing(true);
    try {
      const response = await fetch(`${API_BASE}/api/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          topic_request: topicText,
          student_profile: {
            name: user,
            current_level: 'beginner',
            goals: ['Understand ' + topicText],
            known_concepts: [],
            difficult_concepts: [],
            time_budget_minutes: 25,
          },
        }),
      });
      if (response.status === 401) {
        handleSignOut();
        return;
      }
      const data = await response.json();
      setSession(data);
      setActiveConceptId(data.metadata?.concept_id || 'custom-topic');
      setScreen('topic_brief');
      setCustomTopic('');
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const nextStep = async (ansText = null) => {
    if (!session) return;
    setIsDiagnosing(true);
    try {
      const response = await fetch(`${API_BASE}/api/session/advance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ 
          session_id: session.session_id,
          answer: ansText
        }),
      });
      if (response.status === 401) {
        handleSignOut();
        return;
      }
      const data = await response.json();
      setSession(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const getBreadcrumbPath = () => {
    const path = [];
    if (screen === 'subtopics') {
      path.push({ label: 'DSA', target: 'subtopics' });
    }

    // Custom synthesized topic: Home / Custom Topic / brief-or-session
    const isCustom = activeConceptId.startsWith('custom-');
    if (isCustom) {
      path.push({ label: 'Learn Anything', target: 'topics' });
      path.push({ label: session?.active_topic || 'Custom Topic', target: 'topic_brief' });
      return path;
    }

    const isLinkedList = activeConceptId === 'reverse-linked-list';
    const catLabel = isLinkedList ? 'Linked Lists' : 'Arrays';
    const catTarget = isLinkedList ? 'intro_linked_list' : 'intro';

    if (screen === 'intro' || screen === 'intro_linked_list') {
      path.push({ label: 'DSA', target: 'subtopics' });
      path.push({ label: catLabel, target: catTarget });
    }
    if (screen === 'problem_statement') {
      path.push({ label: 'DSA', target: 'subtopics' });
      path.push({ label: catLabel, target: catTarget });
      path.push({ label: PROBLEM_DETAILS[activeConceptId]?.title || 'Problem', target: 'problem_statement' });
    }
    if (screen === 'session') {
      path.push({ label: 'DSA', target: 'subtopics' });
      path.push({ label: catLabel, target: catTarget });
      path.push({ label: PROBLEM_DETAILS[activeConceptId]?.title || 'Problem', target: 'problem_statement' });
    }
    return path;
  };

  if (screen === 'auth') {
    return (
      <div style={{ fontFamily: 'sans-serif', padding: '24px' }}>
        <h1 style={{ textAlign: 'center', color: '#0f172a', margin: '40px 0 10px 0' }}>⚡ Antigravity Learning</h1>
        <p style={{ textAlign: 'center', color: '#64748b', margin: 0 }}>Adaptive concepts, visualized code debuggers, real diagnostic loops.</p>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px', maxWidth: '1100px', margin: '0 auto', color: '#1e293b' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer' }} onClick={() => setScreen('topics')}>
          ⚡ Antigravity
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 'bold' }}>
            User: <span style={{ color: '#3b82f6' }}>{user}</span>
          </span>
          <button 
            onClick={handleSignOut}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      {screen !== 'topics' && <Breadcrumbs path={getBreadcrumbPath()} onNavigate={setScreen} />}

      {error && <div className="error-msg">{error}</div>}

      {/* Screen 1: Domain grid */}
      {screen === 'topics' && (
        <div>
          <h2 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>Welcome, {user}!</h2>
          <p style={{ color: '#64748b', margin: '0 0 24px 0' }}>Pick a curated track below — or type literally any topic you want to learn.</p>

          {/* Learn Anything: free-text topic entry, synthesized on the fly */}
          <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>🪄 Learn Anything</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '0.9rem', color: '#475569' }}>
              Type any topic — photosynthesis, TLS encryption, the French Revolution — and DeepDive will synthesize a
              full diagnostic → visualization → practice loop for it on the fly.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {['How does TLS encryption work?', 'Photosynthesis', 'Big-O notation', 'Supply and demand'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => startCustomSession(chip)}
                  disabled={isSynthesizing}
                  style={{ padding: '6px 14px', borderRadius: '16px', border: '1px solid #a5b4fc', background: '#ffffff', color: '#4338ca', fontSize: '0.85rem', fontWeight: 'bold', cursor: isSynthesizing ? 'not-allowed' : 'pointer', opacity: isSynthesizing ? 0.6 : 1 }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && customTopic.trim() && !isSynthesizing) startCustomSession(customTopic.trim()); }}
                placeholder="...or type any topic you want to learn"
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
              <button
                onClick={() => startCustomSession(customTopic.trim())}
                disabled={!customTopic.trim() || isSynthesizing}
                style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: 'white', fontWeight: 'bold', cursor: !customTopic.trim() || isSynthesizing ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
              >
                {isSynthesizing ? 'Synthesizing...' : 'Build My Learning Path →'}
              </button>
            </div>
          </div>

          <div className="card-grid">
            <div className="topic-card" onClick={() => setScreen('subtopics')}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Data Structures & Algorithms</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Complexity, sorting, graphs, arrays, and maps.</p>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold', marginTop: '12px' }}>Explore DSA →</span>
            </div>

            <div className="topic-card disabled">
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Python Development</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Memory model, GIL, decorators, and typing system.</p>
              </div>
              <span className="coming-soon-badge">Coming soon</span>
            </div>

            <div className="topic-card disabled">
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Security Fundamentals</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Encryption, network security, authentication, and protocols.</p>
              </div>
              <span className="coming-soon-badge">Coming soon</span>
            </div>
          </div>
        </div>
      )}

      {/* Screen 2: Subtopics */}
      {screen === 'subtopics' && (
        <div>
          <h2 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>DSA Subtopics</h2>
          <p style={{ color: '#64748b', margin: '0 0 24px 0' }}>Select a directory to study Arrays and Hash Map semantics.</p>

          <div className="card-grid">
            <div className="topic-card" onClick={() => setScreen('intro')}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Arrays & Strings</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Linear sequences, lookup tables, and element scanning.</p>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold', marginTop: '12px' }}>Study →</span>
            </div>

            <div className="topic-card" onClick={() => setScreen('intro_linked_list')}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Linked Lists</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Nodes, pointer directions, iteration, and recursion.</p>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold', marginTop: '12px' }}>Study →</span>
            </div>

            <div className="topic-card disabled">
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Stacks & Queues</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>LIFO and FIFO data access and buffer control models.</p>
              </div>
              <span className="coming-soon-badge">Coming soon</span>
            </div>
          </div>
        </div>
      )}

      {/* Screen 3: Intro + Problems */}
      {screen === 'intro' && (
        <div>
          <h2 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>Arrays & Strings</h2>
          
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Sequential Memory Layout</h3>
            <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
              An **array** stores elements sequentially in memory. Accessing an element at an index (e.g. index 2) takes **O(1) time** because memory offsets can be computed instantly.
              However, finding a specific value or matching pairs requires scanning the elements (**O(N²) time** for brute force). That is where **Hash Maps** come in, indexing elements for **O(1) average lookup**!
            </p>
            
            <div className="intro-array-animation">
              {[2, 7, 11, 15].map((val, idx) => (
                <div key={idx} className="intro-array-box" style={{ animationDelay: `${idx * 0.15}s` }}>
                  <span>{val}</span>
                  <span style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '2px' }}>idx {idx}</span>
                </div>
              ))}
            </div>
          </div>

          <h3 style={{ color: '#0f172a', margin: '24px 0 12px 0' }}>Problem Challenges</h3>
          
          <div className="problem-row" onClick={() => { setActiveConceptId('two-sum-hashmap'); setScreen('problem_statement'); }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Two Sum</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Identify indices of two numbers that sum up to target.</p>
            </div>
            <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' }}>
              View Details & Start →
            </span>
          </div>

          <div className="problem-row" onClick={() => { setActiveConceptId('contains-duplicate'); setScreen('problem_statement'); }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Contains Duplicate</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Verify if any value appears at least twice in the array.</p>
            </div>
            <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' }}>
              View Details & Start →
            </span>
          </div>

          <div className="problem-row" onClick={() => { setActiveConceptId('valid-anagram'); setScreen('problem_statement'); }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Valid Anagram</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Determine if one string is an anagram of another.</p>
            </div>
            <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' }}>
              View Details & Start →
            </span>
          </div>

          <div className="problem-row" onClick={() => { setActiveConceptId('best-time-stock'); setScreen('problem_statement'); }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Best Time to Buy and Sell Stock</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Find the maximum single-transaction profit in prices.</p>
            </div>
            <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' }}>
              View Details & Start →
            </span>
          </div>

          <div className="problem-row" onClick={() => { setActiveConceptId('max-subarray'); setScreen('problem_statement'); }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Maximum Subarray</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Find the contiguous subarray with the largest sum.</p>
            </div>
            <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' }}>
              View Details & Start →
            </span>
          </div>

          <div className="problem-row" onClick={() => { setActiveConceptId('valid-parentheses'); setScreen('problem_statement'); }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Valid Parentheses</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Check if brackets close in LIFO order using stack.</p>
            </div>
            <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' }}>
              View Details & Start →
            </span>
          </div>

          <div className="problem-row" onClick={() => { setActiveConceptId('group-anagrams'); setScreen('problem_statement'); }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Group Anagrams</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Group strings that share the exact same letter frequencies.</p>
            </div>
            <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' }}>
              View Details & Start →
            </span>
          </div>

          <div className="problem-row" onClick={() => { setActiveConceptId('product-except-self'); setScreen('problem_statement'); }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Product of Array Except Self</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Compute element products without division in linear time.</p>
            </div>
            <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' }}>
              View Details & Start →
            </span>
          </div>

          <div className="problem-row" onClick={() => { setActiveConceptId('top-k-frequent'); setScreen('problem_statement'); }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Top K Frequent Elements</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Identify the k most frequent values in an array.</p>
            </div>
            <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' }}>
              View Details & Start →
            </span>
          </div>

          <div className="problem-row" onClick={() => { setActiveConceptId('longest-consecutive'); setScreen('problem_statement'); }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Longest Consecutive Sequence</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Find the longest running run of consecutive integers in O(N).</p>
            </div>
            <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' }}>
              View Details & Start →
            </span>
          </div>
        </div>
      )}

      {/* Screen 3b: Intro Linked List + Problems */}
      {screen === 'intro_linked_list' && (
        <div>
          <h2 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>Linked Lists</h2>
          
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Node-Based Sequential Access</h3>
            <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
              A **linked list** consists of nodes where each node contains data and a pointer to the next node. Unlike arrays, nodes are not stored contiguously, so random access is **O(N) time**. Reversing a list is done by iteratively changing pointer references rather than copying or swapping node values!
            </p>
            
            <div className="intro-array-animation" style={{ gap: '24px' }}>
              {[1, 2, 3, 4].map((val, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="intro-array-box" style={{ animationDelay: `${idx * 0.15}s` }}>
                    <span>{val}</span>
                  </div>
                  {idx < 3 && <span style={{ color: '#3b82f6', fontSize: '1.2rem', fontWeight: 'bold' }}>➔</span>}
                </div>
              ))}
            </div>
          </div>

          <h3 style={{ color: '#0f172a', margin: '24px 0 12px 0' }}>Problem Challenges</h3>
          
          <div className="problem-row" onClick={() => { setActiveConceptId('reverse-linked-list'); setScreen('problem_statement'); }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Reverse Linked List</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Iteratively or recursively reverse a singly linked list.</p>
            </div>
            <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' }}>
              View Details & Start →
            </span>
          </div>
        </div>
      )}

      {/* Screen: Dynamic Topic Brief (synthesized "Learn Anything" topic) */}
      {screen === 'topic_brief' && session?.metadata?.topic_brief && (() => {
        const brief = session.metadata.topic_brief;
        return (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '28px', marginTop: '16px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', background: '#eef2ff', color: '#4338ca', padding: '2px 10px', borderRadius: '10px', fontWeight: 'bold' }}>✦ SYNTHESIZED TOPIC</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>generated by the Topic Synthesis Agent</span>
            </div>
            <h2 style={{ color: '#0f172a', margin: '8px 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              {brief.title} — Topic Brief
            </h2>

            <div style={{ color: '#334155', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
              {brief.canonical_definition}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', margin: '0 0 10px 0', color: '#1e293b' }}>Prerequisites We'll Build On</h3>
              <div className="tag-list">
                {(brief.prerequisites || []).filter(Boolean).map((p, i) => <span key={i} className="missing-tag">{p}</span>)}
              </div>
            </div>

            {(brief.misconceptions || []).filter(Boolean).length > 0 && (
              <div style={{ marginBottom: '24px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 10px 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠️</span> Common Misconceptions to Watch Out For
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#78350f', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {(brief.misconceptions || []).filter(Boolean).map((m, i) => <li key={i} style={{ marginBottom: '4px' }}>{m}</li>)}
                </ul>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', margin: '0 0 10px 0', color: '#1e293b' }}>Worked Example (the visualizer will animate this)</h3>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', fontSize: '0.9rem', fontFamily: 'monospace', color: '#334155' }}>
                {brief.example_walkthrough}
              </div>
              {(brief.example_values || []).filter(Boolean).length > 0 && (
                <div className="intro-array-animation" style={{ margin: '16px 0 0 0' }}>
                  {(brief.example_values || []).filter(Boolean).slice(0, 6).map((val, idx) => (
                    <div key={idx} className="intro-array-box" style={{ animationDelay: `${idx * 0.15}s`, width: 'auto', minWidth: '50px', padding: '0 8px', fontSize: '0.9rem' }}>
                      <span>{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <button
                onClick={() => { setSession(null); setScreen('topics'); }}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', color: '#475569' }}
              >
                ← Back
              </button>
              <button
                onClick={() => setScreen('session')}
                style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Continue to Assessment →
              </button>
            </div>
          </div>
        );
      })()}

      {/* Screen: Problem Statement */}
      {screen === 'problem_statement' && (() => {
        const details = PROBLEM_DETAILS[activeConceptId] || PROBLEM_DETAILS['two-sum-hashmap'];
        return (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '28px', marginTop: '16px', boxSizing: 'border-box' }}>
            <h2 style={{ color: '#0f172a', margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              {details.title} — Problem Statement
            </h2>
            
            <div style={{ color: '#334155', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
              {details.description}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', margin: '0 0 10px 0', color: '#1e293b' }}>Examples</h3>
              {details.examples}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', margin: '0 0 10px 0', color: '#1e293b' }}>Constraints</h3>
              {details.constraints}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <button 
                onClick={() => setScreen(activeConceptId === 'reverse-linked-list' ? 'intro_linked_list' : 'intro')}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', color: '#475569' }}
              >
                ← Back
              </button>
              <button 
                onClick={startSession}
                style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Continue to Assessment →
              </button>
            </div>
          </div>
        );
      })()}

      {/* Screen 4: Active Session steps */}
      {screen === 'session' && session && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <h2 style={{ margin: 0, color: '#0f172a' }}>
              Topic Stage: <span style={{ textTransform: 'capitalize', color: '#3b82f6' }}>{session.session_status}</span>
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Session ID: {session.session_id}</span>
          </div>

          {/* Active diagnose/plan/explain screens replacing raw JSON */}
          
          {/* STAGE: new (shows the text box to submit approach) */}
          {session.session_status === 'new' && (
            <div className="diagnose-card">
              <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Initial Assessment</h3>
              <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                Before we formulate your plan and view the code debugger, let's gauge your current strategy.
                <br />
                <strong>How would you approach {session.active_topic || 'this topic'}?</strong> (For example, how would you start — what steps or ideas come to mind?)
              </p>
              <textarea
                value={typedApproach}
                onChange={(e) => setTypedApproach(e.target.value)}
                placeholder="E.g., I would start by..., or I think it works like..."
                style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginBottom: '16px', fontFamily: 'sans-serif' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => nextStep(typedApproach)}
                  disabled={!typedApproach.trim() || isDiagnosing}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: !typedApproach.trim() || isDiagnosing ? 'not-allowed' : 'pointer' }}
                >
                  {isDiagnosing ? 'Running Diagnosis...' : 'Submit Response'}
                </button>
                <button
                  type="button"
                  onClick={() => nextStep("I don't really know anything about this.")}
                  disabled={isDiagnosing}
                  style={{ background: 'none', border: 'none', color: '#ef4444', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', padding: 0 }}
                >
                  I don't know how to solve this — just teach me
                </button>
              </div>
            </div>
          )}

          {/* STAGE: diagnose */}
          {session.session_status === 'diagnose' && session.diagnosis && (
            <div className="diagnose-card">
              <h3 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>Diagnostic Feedback</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <div className="diagnose-section-title">Concept Understanding Detected:</div>
                <div className="tag-list">
                  {session.diagnosis.understanding.length > 0 ? (
                    session.diagnosis.understanding.map((t, i) => <span key={i} className="summary-tag">{t}</span>)
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>None detected</span>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div className="diagnose-section-title">Missing Prerequisite Targets:</div>
                <div className="tag-list">
                  {session.diagnosis.missing_prerequisites.map((t, i) => <span key={i} className="missing-tag">{t}</span>)}
                </div>
              </div>

              {session.diagnosis.misconceptions.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div className="diagnose-section-title">Flagged Misconceptions (Needs Correction):</div>
                  <div className="tag-list">
                    {session.diagnosis.misconceptions.map((t, i) => <span key={i} className="misconception-tag">⚠ {t}</span>)}
                  </div>
                </div>
              )}

              <div style={{ borderLeft: '4px solid #3b82f6', background: '#eff6ff', padding: '12px 16px', borderRadius: '0 8px 8px 0', margin: '20px 0' }}>
                <h4 style={{ margin: '0 0 6px 0', color: '#1e40af' }}>Diagnostic Summary</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e3a8a', lineHeight: '1.5' }}>
                  {session.diagnosis.summary}
                </p>
              </div>

              <button 
                onClick={() => nextStep()}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Create Learning Plan →
              </button>
            </div>
          )}

          {/* STAGE: plan */}
          {session.session_status === 'plan' && session.learning_plan && (
            <div className="diagnose-card">
              <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Adaptive Learning Roadmap</h3>
              <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '0.9rem' }}>We formulated a structured track covering this topic's core mechanism.</p>

              <div style={{ margin: '16px 0', padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <strong>Session Goal:</strong> {session.learning_plan.goal}
                <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#475569' }}>
                  <strong>Rationale:</strong> {session.learning_plan.rationale}
                </div>
              </div>

              <div className="timeline">
                {session.learning_plan.steps.map((st, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-dot active">{idx + 1}</div>
                    <div className="timeline-content">
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{st}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => nextStep()}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px' }}
              >
                Begin Lesson Explanation →
              </button>
            </div>
          )}

          {/* STAGE: explain */}
          {session.session_status === 'explain' && session.concept_history && session.concept_history.length > 0 && (
            <div className="diagnose-card">
              <h2 style={{ color: '#0f172a', margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                {session.concept_history[0].title}
              </h2>

              <div style={{ background: '#f8fafc', padding: '16px', borderLeft: '4px solid #3b82f6', borderRadius: '0 8px 8px 0', marginBottom: '20px' }}>
                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Definition: </span>
                <span style={{ color: '#475569', lineHeight: '1.5' }}>{session.concept_history[0].canonical_definition}</span>
              </div>

              <h3 style={{ color: '#334155', fontSize: '1.1rem', margin: '20px 0 8px 0' }}>Core Conceptual Truths</h3>
              <ul style={{ margin: '0 0 20px 0', paddingLeft: '20px', color: '#475569', lineHeight: '1.6' }}>
                {(session.concept_history[0].key_facts || []).filter(Boolean).map((fact, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>{fact}</li>
                ))}
              </ul>

              <h3 style={{ color: '#334155', fontSize: '1.1rem', margin: '20px 0 8px 0' }}>Concept Breakdown Summary</h3>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                {session.concept_history[0].explanation_summary}
              </p>

              <h3 style={{ color: '#334155', fontSize: '1.1rem', margin: '20px 0 8px 0' }}>Topic Emphasis Areas</h3>
              <div className="tag-list">
                {(session.concept_history[0].teaching_emphasis || []).filter(Boolean).map((item, idx) => (
                  <span key={idx} className="summary-tag" style={{ background: '#eff6ff', color: '#1d4ed8' }}>{item}</span>
                ))}
              </div>

              <button 
                onClick={() => nextStep()}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}
              >
                Proceed to Visualization Player →
              </button>
            </div>
          )}

          {/* STAGE: visualize */}
          {session.session_status === 'visualize' && session.interaction_state.current_visualization && (
            <VisualizationRenderer 
              hmSpec={session.interaction_state.current_visualization} 
              bfSpec={session.interaction_state.current_visualization_bf} 
              session={session} 
              onNextStep={() => nextStep()}
              onAnswerSubmitted={(qId, ans) => {
                setSession(prev => ({
                  ...prev,
                  student_answers: [
                    ...prev.student_answers.filter(a => a.question_id !== qId),
                    { question_id: qId, answer: ans }
                  ]
                }));
              }}
            />
          )}

          {/* STAGE: practice */}
          {session.session_status === 'practice' && (
            <div className="diagnose-card">
              <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Practice Challenge</h3>
              <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                {session.interaction_state.current_question || "Please answer the practice question."}
              </p>
              <textarea
                value={practiceAnswer}
                onChange={(e) => setPracticeAnswer(e.target.value)}
                placeholder="Type your explanation here..."
                style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginBottom: '16px', fontFamily: 'sans-serif' }}
              />
              <button 
                onClick={() => {
                  nextStep(practiceAnswer);
                  setPracticeAnswer('');
                }}
                disabled={!practiceAnswer.trim() || isDiagnosing}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {isDiagnosing ? 'Submitting...' : 'Submit Practice'}
              </button>
            </div>
          )}

          {/* STAGE: evaluate */}
          {session.session_status === 'evaluate' && (
            <div className="diagnose-card" style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#3b82f6' }}>🤖</div>
              <h4 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>Auto-Grading Progress</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                Evaluating your reasoning quality and diagnosing misconceptions...
              </p>
            </div>
          )}

          {/* STAGE: adapt */}
          {session.session_status === 'adapt' && (
            <div className="diagnose-card">
              <h3 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>Assessment Results</h3>
              
              {/* Evaluation Result */}
              {session.interaction_state.latest_evaluation && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
                      Your Score: <span style={{ color: session.interaction_state.latest_evaluation.passed ? '#10b981' : '#f59e0b' }}>
                        {(session.interaction_state.latest_evaluation.score * 100).toFixed(0)}%
                      </span>
                    </span>
                    <span style={{ 
                      background: session.interaction_state.latest_evaluation.passed ? '#d1fae5' : '#fef3c7', 
                      color: session.interaction_state.latest_evaluation.passed ? '#065f46' : '#92400e', 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold', 
                      padding: '4px 10px', 
                      borderRadius: '12px' 
                    }}>
                      {session.interaction_state.latest_evaluation.passed ? 'PASSED' : 'NEEDS PRACTICE'}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.9rem', marginBottom: '10px', color: '#475569' }}>
                    <strong>Reasoning Quality:</strong> {session.interaction_state.latest_evaluation.reasoning_quality}
                  </div>
                  
                  <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                    <strong>Feedback:</strong> {session.interaction_state.latest_evaluation.feedback}
                  </div>
                </div>
              )}

              {/* Adaptation Decision */}
              {session.adaptation_log && session.adaptation_log.length > 0 && (() => {
                const decision = session.adaptation_log[session.adaptation_log.length - 1];
                let buttonText = "Continue";
                if (decision.action === 're-teach') buttonText = "Review Comparison Visualizer";
                else if (decision.action === 'continue') buttonText = "Finish Session";
                else if (['hint', 'simplify', 'flag_misconception'].includes(decision.action)) buttonText = "Try Again";
                
                return (
                  <div>
                    <div style={{ borderLeft: '4px solid #3b82f6', background: '#eff6ff', padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: '24px' }}>
                      <h4 style={{ margin: '0 0 6px 0', color: '#1e40af' }}>Instructor Recommendation</h4>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#1e3a8a', lineHeight: '1.5' }}>
                        {decision.reason}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => nextStep()}
                        style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
                      >
                        {buttonText}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* STAGE: completed */}
          {session.session_status === 'completed' && (
            <div className="diagnose-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.4rem' }}>Session Completed!</h3>
              <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0 0 24px 0', lineHeight: '1.5' }}>
                Great job! You have successfully completed the learning loop for <strong>{session.active_topic || 'this topic'}</strong>.
              </p>
              <button 
                onClick={() => setScreen('topics')}
                style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
              >
                Back to Topics
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
