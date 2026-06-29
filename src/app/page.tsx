export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 px-6">
      <h1 className="text-5xl font-bold text-white tracking-tight">
        SLAY <span className="text-neon-pink">CITY</span>
      </h1>
      <p className="text-lime-green text-xl font-semibold">
        Next.js + TypeScript + Tailwind CSS — работает!
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <span className="px-4 py-2 rounded-2xl bg-neon-pink text-white font-bold">Neon Pink</span>
        <span className="px-4 py-2 rounded-2xl bg-lime-green text-black font-bold">Lime Green</span>
        <span className="px-4 py-2 rounded-2xl bg-cyan text-black font-bold">Cyan</span>
        <span className="px-4 py-2 rounded-2xl bg-purple text-white font-bold">Purple</span>
      </div>
    </main>
  );
}
