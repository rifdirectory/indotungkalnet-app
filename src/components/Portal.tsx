'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Portal({ children, targetId = 'header-actions-portal' }: { children: React.ReactNode, targetId?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const target = document.getElementById(targetId);
  if (!target) return null;

  return createPortal(children, target);
}
