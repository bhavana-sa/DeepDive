import { motion } from 'framer-motion';
import { computeSceneState } from './sceneEngine';

const BIG = new Set(['sun', 'creature']);
const SMALL = new Set(['token', 'chip', 'bubble']);

function splitEmoji(text) {
  if (typeof text !== 'string') return { emoji: '', text: '' };
  const match = text.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji})?\s*(.*)$/u);
  if (match && match[1]) {
    return { emoji: match[1], text: match[2] };
  }
  return { emoji: '', text };
}

function ActorView({ actor, fx }) {
  const { kind, label, icon, value } = actor;
  const cls =
    'actor' +
    (BIG.has(kind) ? ' big' : SMALL.has(kind) ? ' small' : '') +
    (fx === 'pulse' ? ' is-pulse' : '') +
    (fx === 'shake' ? ' is-shake' : '') +
    (fx === 'highlight' ? ' is-highlight' : '') +
    (fx === 'dim' ? ' is-dim' : '');

  let body;
  if (kind === 'box') {
    const { emoji, text: cleanText } = splitEmoji(label || icon);
    body = (
      <span className="boxcard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {emoji && <span className="boxcard-emoji" style={{ fontSize: '1.2em', lineHeight: 1 }}>{emoji}</span>}
        <span className="boxcard-text">{cleanText}</span>
      </span>
    );
  } else if (kind === 'counter') {
    body = (
      <span className="counternum">
        {icon} {value != null ? value : 0}
      </span>
    );
  } else if (kind === 'meter') {
    const pct = typeof value === 'number' ? Math.max(0, Math.min(100, value)) : 50;
    body = <span className="meterbar"><i style={{ width: `${pct}%` }} /></span>;
  } else if (kind === 'lane' || kind === 'stack') {
    body = (
      <span
        className="boxcard"
        style={{ padding: '6px 14px', opacity: 0.75, background: kind === 'stack' ? '#f3e8ff' : '#ddf4ff', borderColor: kind === 'stack' ? '#ce82ff' : '#1cb0f6' }}
      >
        {icon} {label}
      </span>
    );
  } else {
    body = <span className="emo">{icon}</span>;
  }

  const showTag = label && kind !== 'box' && kind !== 'lane' && kind !== 'stack' && kind !== 'meter' && kind !== 'counter';

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cls}
      style={{ left: `${actor.x}%`, top: `${actor.y}%`, zIndex: kind === 'lane' ? 1 : 2 }}
      key={actor.id}
    >
      {body}
      {showTag && <span className="tag">{label}</span>}
    </motion.div>
  );
}

export default function ScenePlayer({ scene, stepIndex }) {
  const { actors, transient, connects } = computeSceneState(scene, stepIndex);
  const bg = `bg-${scene && scene.background ? scene.background : 'default'}`;

  const isFlow = scene?.actors?.some((a) => a.id === 'pointer') || scene?.actors?.some((a) => a.id.startsWith('stage-'));

  if (isFlow) {
    // 1. Get all visible stages (filtering out pointer/info/connectors and sorting by horizontal x position)
    const visibleStages = actors
      .filter((a) => 
        a.id !== 'pointer' && 
        a.id !== 'info' && 
        !a.id.startsWith('flow-') && 
        (a.kind === 'box' || a.kind === 'node' || a.id.startsWith('stage-'))
      )
      .sort((a, b) => a.x - b.x);

    // 2. Determine active stage: prefer the one with a 'highlight' transient fx
    const activeStage = visibleStages.find((s) => transient.get(s.id) === 'highlight');
    const pointerActor = actors.find((a) => a.id === 'pointer');
    const activeStageId = activeStage?.id || (
      pointerActor && visibleStages.length > 0
        ? visibleStages.reduce((prev, curr) =>
            Math.abs(curr.x - pointerActor.x) < Math.abs(prev.x - pointerActor.x) ? curr : prev
          , visibleStages[0])?.id
        : null
    );

    // 3. Info chip
    const infoActor = actors.find((a) => a.id === 'info');

    return (
      <div className={`stage ${bg} is-flow`} style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: 220, height: 'auto', aspectRatio: 'auto', boxSizing: 'border-box',
      }}>
        {/* Horizontal flow strip */}
        <div className="flow-strip">
          {visibleStages.map((stage, idx) => {
            const isActive = stage.id === activeStageId;
            const isDimmed = transient.get(stage.id) === 'dim';
            const { emoji, text: cleanText } = splitEmoji(stage.label || stage.icon || '');

            return (
              <div key={stage.id} className="flow-stage-wrap">
                {idx > 0 && (
                  <span className="flow-connector" aria-hidden>
                    ➜
                  </span>
                )}
                <div className={`flow-box${isActive ? ' is-active' : ''}${isDimmed ? ' is-dim' : ''}`}>
                  {isActive && (
                    <motion.div
                      layoutId="flow-pointer"
                      className="flow-pointer-arrow"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                    >
                      👇
                    </motion.div>
                  )}
                  <div className="flow-box-inner">
                    {emoji && <span style={{ fontSize: '1.15em', lineHeight: 1 }}>{emoji}</span>}
                    <span>{cleanText}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info card — grounded below the flow strip, connected by left border */}
        {infoActor && infoActor.label && (
          <div className="flow-info-card fade-in">
            💡 {infoActor.label}
          </div>
        )}
      </div>
    );
  }


  // Otherwise, render the standard coordinate-based scene player (for Valid Parentheses, contains-duplicate, etc.)
  const renderableActors = actors;

  return (
    <div className={`stage ${bg}`}>
      <div className="ground" />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
        {connects.map((c, i) => (
          <line
            key={`connect-${i}`}
            x1={`${c.from.x}%`}
            y1={`${c.from.y}%`}
            x2={`${c.to.x}%`}
            y2={`${c.to.y}%`}
            stroke="#1cb0f6"
            strokeWidth="3"
            strokeDasharray="7 6"
            strokeLinecap="round"
          />
        ))}
      </svg>
      {renderableActors.map((a) => (
        <ActorView key={a.id} actor={a} fx={transient.get(a.id)} />
      ))}
    </div>
  );
}

