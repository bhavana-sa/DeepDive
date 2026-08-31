import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function mapX(x) {
  return Math.max(5, Math.min(95, x));
}

function mapY(y) {
  return Math.max(5, Math.min(95, y));
}

/**
 * For each actor, find the earliest step index where it is made visible via
 * 'appear', 'emit', or 'split'. Actors with no such effect are visible from step 0.
 * Also tracks the step index where 'disappear' last fires (if ever).
 */
function buildVisibilityMap(steps = []) {
  const firstAppear = {};  // actorId -> step index (defaults to 0 if never appeared via effect)
  const lastDisappear = {}; // actorId -> step index

  steps.forEach((step, idx) => {
    (step.effects || []).forEach((e) => {
      const ids = [e.actor];
      if (e.target) ids.push(e.target);
      ids.forEach((id) => {
        if (!id) return;
        if (e.action === 'appear' || e.action === 'emit' || e.action === 'split') {
          if (!(id in firstAppear)) firstAppear[id] = idx;
        }
        if (e.action === 'disappear') {
          lastDisappear[id] = idx;
        }
      });
    });
  });

  return { firstAppear, lastDisappear };
}

export default function DiagramRenderer({ scene, stepIndex }) {
  const actors = scene?.actors || [];
  const steps = scene?.steps || [];
  const currentStep = steps[stepIndex];
  const currentEffects = currentStep?.effects || [];

  const { firstAppear, lastDisappear } = useMemo(
    () => buildVisibilityMap(steps),
    [steps]
  );

  function isActorVisible(actorId) {
    // If this actor is made to appear via an effect, it starts hidden until that step
    const appearStep = actorId in firstAppear ? firstAppear[actorId] : 0;
    if (stepIndex < appearStep) return false;
    // If a 'disappear' effect has fired and not superseded by a later 'appear', hide it
    if (actorId in lastDisappear && lastDisappear[actorId] <= stepIndex) {
      // Check if re-appeared after the last disappear
      const reAppear = steps.findIndex(
        (s, i) => i > lastDisappear[actorId] &&
          (s.effects || []).some((e) => e.actor === actorId && e.action === 'appear')
      );
      if (reAppear === -1) return false;
      if (reAppear > stepIndex) return false;
    }
    return true;
  }

  function isActorActive(actorId) {
    return currentEffects.some(
      (e) => (e.actor === actorId || e.target === actorId) &&
        ['highlight', 'pulse', 'appear', 'connect'].includes(e.action)
    );
  }

  function getActorColor(actorId) {
    const colors = ['#1cb0f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < actorId.length; i++) hash = actorId.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  // Accumulate connections from ALL steps up to (and including) stepIndex
  // so that 'connect' effects persist across steps
  const connections = useMemo(() => {
    const conns = [];
    const seen = new Set();
    steps.slice(0, stepIndex + 1).forEach((step) => {
      (step.effects || []).forEach((e) => {
        if (e.action === 'connect') {
          const key = `${e.actor}-${e.target}`;
          if (!seen.has(key)) {
            const fromActor = actors.find((a) => a.id === e.actor);
            const toActor = actors.find((a) => a.id === e.target);
            if (fromActor && toActor) {
              conns.push({ from: fromActor, to: toActor });
              seen.add(key);
            }
          }
        }
      });
    });
    return conns;
  }, [stepIndex, steps, actors]);

  const visibleActors = actors.filter((a) => isActorVisible(a.id));

  return (
    <div className="stage bg-grid" style={{ position: 'relative', width: '100%', paddingBottom: '65%', minHeight: 360 }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {connections.map((conn, i) => (
          <motion.line
            key={`conn-${conn.from.id}-${conn.to.id}`}
            x1={`${mapX(conn.from.x)}%`}
            y1={`${mapY(conn.from.y)}%`}
            x2={`${mapX(conn.to.x)}%`}
            y2={`${mapY(conn.to.y)}%`}
            stroke="#64748b"
            strokeWidth="0.8"
            strokeDasharray="3 2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        ))}

        {visibleActors.map((actor) => {
          const active = isActorActive(actor.id);
          const color = getActorColor(actor.id);
          return (
            <motion.g
              key={actor.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: active ? 1.18 : 1,
                opacity: active ? 1 : 0.82,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <circle
                cx={`${mapX(actor.x)}%`}
                cy={`${mapY(actor.y)}%`}
                r="4.5"
                fill={active ? color : '#e2e8f0'}
                stroke={color}
                strokeWidth="0.8"
              />
              <text
                x={`${mapX(actor.x)}%`}
                y={`${mapY(actor.y) - 6}%`}
                textAnchor="middle"
                fontSize="3"
                fill="#1e293b"
                fontWeight="700"
              >
                {actor.label}
              </text>
              {actor.icon && (
                <text
                  x={`${mapX(actor.x)}%`}
                  y={`${mapY(actor.y) + 3.5}%`}
                  textAnchor="middle"
                  fontSize="3.5"
                >
                  {actor.icon}
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 60%, rgba(255,255,255,1) 100%)',
            padding: '12px 14px 10px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', lineHeight: 1.4 }}>
            {currentStep?.caption || ''}
          </div>
          {currentStep?.narration && (
            <div style={{ fontWeight: 600, fontSize: 12.5, color: '#475569', marginTop: 2, lineHeight: 1.5 }}>
              {currentStep.narration}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
