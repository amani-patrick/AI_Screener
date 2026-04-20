'use client';

import type { ReactNode } from 'react';

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
      <h2 className="text-lg font-medium">{title}</h2>
      {children}
    </div>
  );
}
