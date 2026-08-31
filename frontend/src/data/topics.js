// Curated DSA topic cards shown on the home grid.
export const TOPICS = [
  {
    id: 'two-sum-hashmap',
    emoji: '🎯',
    title: 'Two Sum',
    blurb: 'Find the pair that hits the target — the smart way.',
    grad: 'linear-gradient(135deg,#1cb0f6,#ce82ff)',
  },
  {
    id: 'contains-duplicate',
    emoji: '🔍',
    title: 'Contains Duplicate',
    blurb: 'Spot repeats without checking everything twice.',
    grad: 'linear-gradient(135deg,#58cc02,#1cb0f6)',
  },
  {
    id: 'valid-anagram',
    emoji: '🔤',
    title: 'Valid Anagram',
    blurb: 'Same letters, same counts — prove it fast.',
    grad: 'linear-gradient(135deg,#ffc800,#ff9600)',
  },
  {
    id: 'best-time-stock',
    emoji: '📈',
    title: 'Best Time to Buy & Sell',
    blurb: 'Buy low, sell high, one pass, no regret.',
    grad: 'linear-gradient(135deg,#ff9600,#ff4b4b)',
  },
  {
    id: 'max-subarray',
    emoji: '🏔️',
    title: 'Max Subarray',
    blurb: "Kadane's trick: drop the baggage, keep the gain.",
    grad: 'linear-gradient(135deg,#ce82ff,#ff4b4b)',
  },
  {
    id: 'valid-parentheses',
    emoji: '🧩',
    title: 'Valid Parentheses',
    blurb: 'Brackets must close in reverse order. Stack it.',
    grad: 'linear-gradient(135deg,#1cb0f6,#58cc02)',
  },
];

// Non-DSA "custom" topics handled via the free-text flow.
// Pre-seeded on the backend so they always work even under quota pressure.
export const CUSTOM_DEMO_TOPICS = [
  {
    topic: 'photosynthesis',
    emoji: '🌿',
    title: 'Photosynthesis',
    blurb: 'How plants turn sunlight into sugar — step by step.',
    grad: 'linear-gradient(135deg,#58cc02,#ffc800)',
  },
  {
    topic: 'how does the digestive system work',
    emoji: '🍎',
    title: 'Digestive System',
    blurb: 'Mouth → esophagus → stomach → intestine. Trace it.',
    grad: 'linear-gradient(135deg,#ff9600,#ce82ff)',
  },
];

export const EXAMPLE_CHIPS = ['How WiFi works 📡', 'Supply & demand 📦', 'Recursion 🔄', 'Black holes 🕳️'];



export function topicEmoji(title = '') {
  const t = title.toLowerCase();
  if (t.includes('sum')) return '🎯';
  if (t.includes('duplicate')) return '🔍';
  if (t.includes('anagram')) return '🔤';
  if (t.includes('stock') || t.includes('buy')) return '📈';
  if (t.includes('subarray')) return '🏔️';
  if (t.includes('paren') || t.includes('bracket')) return '🧩';
  return '✨';
}
