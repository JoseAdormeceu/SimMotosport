'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCareerStore } from '@/lib/store/career-store';

export default function NewCareerPage() {
  const createCareer = useCareerStore((s) => s.createCareer);
  const [name, setName] = useState('Ari Vega');

  return (
    <div className="mx-auto max-w-xl space-y-4 p-8">
      <h1 className="text-2xl font-semibold">Create Career</h1>
      <input
        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        className="rounded bg-blue-600 px-4 py-2"
        onClick={() => createCareer({ name, nationality: 'ESP', archetype: 'prodigy', seed: 7 })}
      >
        Create Career
      </button>
      <div>
        <Link className="text-blue-300 underline" href="/career/local">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
