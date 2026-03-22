import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-4xl font-bold">PAX Motorsport</h1>
      <p className="mt-4 text-slate-300">Narrative-first career simulation.</p>
      <Link className="mt-6 inline-block rounded bg-blue-600 px-4 py-2" href="/new-career">
        Start New Career
      </Link>
    </main>
  );
}
