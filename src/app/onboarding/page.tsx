"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      router.push("/map");
    }
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 px-6">
      <div className="w-full max-w-xs">
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-neon-pink" : "bg-white/20"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-bold text-white">What&apos;s your name?</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-neon-pink"
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-bold text-white">How old are you?</h2>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Your age"
              min={4}
              max={18}
              className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-neon-pink"
            />
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={step === 1 ? !name.trim() : !age}
          className="mt-8 w-full py-4 rounded-2xl bg-neon-pink text-white font-bold text-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {step === 2 ? "Enter the City →" : "Next →"}
        </button>
      </div>
    </main>
  );
}
