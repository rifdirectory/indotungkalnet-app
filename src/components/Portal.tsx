'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Portal({ children, targetId = 'header-actions-portal' }: { children: React.ReactNode, targetId?: string }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Initial check
    const el = document.getElementById(targetId);
    if (el) {
      setTarget(el);
      return;
    }

    // Fallback: Observe DOM for target
    const observer = new MutationObserver(() => {
      const found = document.getElementById(targetId);
      if (found) {
        setTarget(found);
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [targetId]);

  if (!target) return null;

  return createPortal(children, target);
}
