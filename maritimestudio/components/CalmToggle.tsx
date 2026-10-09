'use client';

import { useEffect, useState } from 'react';
import { CALM_EVENT, CALM_KEY } from '@/lib/motion';

export function CalmToggle() {
  const [calm, setCalm] = useState(false);

  useEffect(() => {
    setCalm(document.documentElement.classList.contains('reduce-motion'));
  }, []);

  const toggle = () => {
    const next = !calm;
    setCalm(next);
    document.documentElement.classList.toggle('reduce-motion', next);
    try {
      localStorage.setItem(CALM_KEY, next ? '1' : '0');
    } catch {
      /* storage blocked: the switch still works for this visit */
    }
    window.dispatchEvent(new CustomEvent(CALM_EVENT, { detail: next }));
  };

  return (
    <button className="calm-toggle" type="button" aria-pressed={calm} onClick={toggle}>
      <span className="calm-track" aria-hidden="true">
        <span className="calm-knob" />
      </span>
      Calm mode
    </button>
  );
}
