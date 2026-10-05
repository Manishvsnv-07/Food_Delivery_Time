"use client";

import { useState } from "react";

interface Answers {
  distance_km: number | null;
  weather: string;
  traffic_level: string;
  time_of_day: string;
  vehicle_type: string;
  prep_time_min: number;
  courier_experience_years: number;
}

interface ChoiceOption {
  value: string;
  label: string;
  emoji: string;
  flavor: string;
}

interface NumberStep {
  kind: "number";
  key: "distance_km";
  chapter: string;
  scene: (a: Answers) => string;
  prompt: string;
  placeholder: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

interface ChoiceStep {
  kind: "choice";
  key: "weather" | "traffic_level" | "time_of_day" | "vehicle_type";
  chapter: string;
  scene: (a: Answers) => string;
  prompt: string;
  options: ChoiceOption[];
}

interface SliderStep {
  kind: "slider";
  key: "prep_time_min" | "courier_experience_years";
  chapter: string;
  scene: (a: Answers) => string;
  prompt: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

type Step = NumberStep | ChoiceStep | SliderStep;

const STEPS: Step[] = [
  {
    kind: "number",
    key: "distance_km",
    chapter: "The Order Drops",
    scene: () =>
      "Somewhere across the city, a hungry customer just hit “order.” The clock starts now — every minute counts.",
    prompt: "How far is the restaurant from the customer?",
    placeholder: "4.5",
    unit: "km",
    min: 0.5,
    max: 50,
    step: 0.1,
  },
  {
    kind: "choice",
    key: "weather",
    chapter: "Stepping Outside",
    scene: (a) =>
      `The bag is sealed and the address is ${
        a.distance_km !== null ? a.distance_km + " km" : "a few kilometres"
      } away. You push the door open and look up at the sky.`,
    prompt: "What's the weather doing out there?",
    options: [
      { value: "Clear", label: "Clear", emoji: "☀️", flavor: "Blue sky, easy riding." },
      { value: "Cloudy", label: "Cloudy", emoji: "☁️", flavor: "Grey, but dry." },
      { value: "Rainy", label: "Rainy", emoji: "🌧️", flavor: "Wet streets, careful turns." },
      { value: "Stormy", label: "Stormy", emoji: "⛈️", flavor: "The sky opens up." },
    ],
  },
  {
    kind: "choice",
    key: "traffic_level",
    chapter: "Onto the Streets",
    scene: (a) =>
      a.weather === "Stormy" || a.weather === "Rainy"
        ? "Rain slicks the asphalt. You pull into traffic and squint through the drops."
        : "You ease into the flow of the city, eyes on the road ahead.",
    prompt: "What's the traffic like?",
    options: [
      { value: "Low", label: "Low", emoji: "🛣️", flavor: "Green lights the whole way." },
      { value: "Medium", label: "Medium", emoji: "🚗", flavor: "Moving, but patient." },
      { value: "High", label: "High", emoji: "🚦", flavor: "Bumper to bumper." },
    ],
  },
  {
    kind: "choice",
    key: "time_of_day",
    chapter: "The Hour",
    scene: () =>
      "You glance at the clock on the dash. The city has its own rhythm, hour by hour.",
    prompt: "What time is this delivery happening?",
    options: [
      { value: "Morning", label: "Morning", emoji: "🌅", flavor: "Breakfast runs and school traffic." },
      { value: "Afternoon", label: "Afternoon", emoji: "🌤️", flavor: "The quiet stretch." },
      { value: "Evening", label: "Evening", emoji: "🌆", flavor: "Peak dinner rush." },
      { value: "Night", label: "Night", emoji: "🌙", flavor: "Empty streets, dim lights." },
    ],
  },
  {
    kind: "choice",
    key: "vehicle_type",
    chapter: "Your Ride",
    scene: () =>
      "Every courier has a ride of choice. What is carrying this order tonight?",
    prompt: "What are you riding?",
    options: [
      { value: "Bike", label: "Bike", emoji: "🏍️", flavor: "Quick through any gap." },
      { value: "Scooter", label: "Scooter", emoji: "🛵", flavor: "Zippy in the city." },
      { value: "Car", label: "Car", emoji: "🚗", flavor: "Comfortable, but stuck in traffic." },
    ],
  },
  {
    kind: "slider",
    key: "prep_time_min",
    chapter: "Back at the Kitchen",
    scene: () =>
      "You reach the restaurant. Inside, the kitchen is a blur of steam and shouting — how long until the bag is out the door?",
    prompt: "Preparation time",
    unit: "min",
    min: 5,
    max: 60,
    step: 1,
  },
  {
    kind: "slider",
    key: "courier_experience_years",
    chapter: "The Courier",
    scene: () =>
      "One last thing before the story ends — who is actually making this run?",
    prompt: "Courier experience",
    unit: "years",
    min: 0,
    max: 20,
    step: 1,
  },
];

const INITIAL_ANSWERS: Answers = {
  distance_km: null,
  weather: "",
  traffic_level: "",
  time_of_day: "",
  vehicle_type: "",
  prep_time_min: 15,
  courier_experience_years: 3,
};

export default function Home() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);
  const [distanceInput, setDistanceInput] = useState("");
  const [status, setStatus] = useState<"story" | "loading" | "done" | "error">("story");
  const [prediction, setPrediction] = useState<"On Time" | "Late" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const totalSteps = STEPS.length;
  const step = STEPS[stepIndex];
  const isLast = stepIndex === totalSteps - 1;
  const progress = ((stepIndex + (status === "done" ? 1 : 0)) / totalSteps) * 100;

  function goBack() {
    if (stepIndex === 0) return;

    setStepIndex((i) => i - 1);

    if (status !== "story") {
      setStatus("story");
      setPrediction(null);
      setErrorMsg("");
    }
  }

  function advance() {
    if (stepIndex < totalSteps - 1) {
      setStepIndex((i) => i + 1);
    } else {
      void submit();
    }
  }

  function commitDistance() {
    const parsed = parseFloat(distanceInput);

    if (Number.isNaN(parsed)) return;

    const clamped = Math.min(50, Math.max(0.5, parsed));

    setAnswers((prev) => ({
      ...prev,
      distance_km: clamped,
    }));

    advance();
  }

  function commitChoice(key: ChoiceStep["key"], value: string) {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));

    window.setTimeout(() => advance(), 220);
  }

  function commitSlider(key: SliderStep["key"], value: number) {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function commitSliderAndAdvance(
    key: SliderStep["key"],
    value: number
  ) {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));

    advance();
  }

  async function submit() {
    setStatus("loading");
    setErrorMsg("");

    try {
      const requestData = {
        distance_km: answers.distance_km,
        weather: answers.weather,
        traffic_level: answers.traffic_level,
        time_of_day: answers.time_of_day,
        vehicle_type: answers.vehicle_type,
        prep_time_min: answers.prep_time_min,
        courier_experience_years: answers.courier_experience_years,
      };

      const res = await fetch(`${process.env.BACKEND_URL}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      const data = await res.json();

      if (data.prediction !== "On Time" && data.prediction !== "Late") {
        throw new Error("Unexpected response from /api/predict");
      }

      setPrediction(data.prediction);
      setStatus("done");
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : "Something went wrong."
      );
      setStatus("error");
    }
  }

  function restart() {
    setStepIndex(0);
    setAnswers(INITIAL_ANSWERS);
    setDistanceInput("");
    setStatus("story");
    setPrediction(null);
    setErrorMsg("");
  }

  const canContinueDistance =
    distanceInput.trim() !== "" &&
    !Number.isNaN(parseFloat(distanceInput));

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0B1416] text-slate-100">
      <style>{`
        html,
        body {
          scrollbar-width: none;
          -ms-overflow-style: none;
          overflow-x: hidden;
        }

        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>

      <div
        className="pointer-events-none fixed inset-0 scale-105 bg-cover bg-center bg-no-repeat blur-[1.5px] lg:hidden"
        style={{
          backgroundImage: "url('/hero-mobile.jpg')",
        }}
      />

      <div
        className="pointer-events-none fixed inset-0 hidden scale-105 bg-cover bg-center bg-no-repeat blur-[1.5px] lg:block"
        style={{
          backgroundImage: "url('/hero-desktop.jpg')",
        }}
      />

      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-teal-950/30 via-slate-950/15 to-amber-950/30" />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(251,191,36,0.22),transparent_50%),radial-gradient(circle_at_75%_85%,rgba(45,212,191,0.20),transparent_55%)]" />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.45)_100%)]" />

      <div className="relative mx-auto my-4 flex min-h-[calc(100vh-2rem)] max-w-2xl flex-col rounded-3xl border border-white/12 bg-slate-950/15 px-6 py-10 shadow-2xl shadow-black/40 backdrop-blur-md sm:my-8 sm:min-h-[calc(100vh-4rem)] sm:px-10 sm:py-12">
        <header className="mb-8 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-teal-100/60">
          <span className="font-medium">Delivery Story</span>

          <span>
            {status === "done"
              ? "Epilogue"
              : `Chapter ${stepIndex + 1} of ${totalSteps}`}
          </span>
        </header>

        <div className="mb-10 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-teal-400 transition-all duration-500 ease-out"
            style={{
              width: `${status === "done" ? 100 : progress}%`,
            }}
          />
        </div>

        <div className="flex flex-1 flex-col">
          {status === "done" && prediction ? (
            <RevealScreen
              prediction={prediction}
              answers={answers}
              onRestart={restart}
            />
          ) : (
            <StoryScreen
              step={step}
              answers={answers}
              distanceInput={distanceInput}
              setDistanceInput={setDistanceInput}
              canContinueDistance={canContinueDistance}
              stepIndex={stepIndex}
              isLast={isLast}
              onBack={goBack}
              onCommitDistance={commitDistance}
              onCommitChoice={commitChoice}
              onCommitSlider={commitSlider}
              onSliderContinue={commitSliderAndAdvance}
              status={status}
              errorMsg={errorMsg}
              onRetry={submit}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function StoryScreen(props: {
  step: Step;
  answers: Answers;
  distanceInput: string;
  setDistanceInput: (v: string) => void;
  canContinueDistance: boolean;
  stepIndex: number;
  isLast: boolean;
  onBack: () => void;
  onCommitDistance: () => void;
  onCommitChoice: (key: ChoiceStep["key"], value: string) => void;
  onCommitSlider: (key: SliderStep["key"], value: number) => void;
  onSliderContinue: (
    key: SliderStep["key"],
    value: number
  ) => void;
  status: "story" | "loading" | "done" | "error";
  errorMsg: string;
  onRetry: () => void;
}) {
  const {
    step,
    answers,
    distanceInput,
    setDistanceInput,
    canContinueDistance,
    stepIndex,
    isLast,
    onBack,
    onCommitDistance,
    onCommitChoice,
    onCommitSlider,
    onSliderContinue,
    status,
    errorMsg,
    onRetry,
  } = props;

  const sceneText = step.scene(answers);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-amber-300 [text-shadow:_0_1px_8px_rgba(0,0,0,0.6)]">
        {step.chapter}
      </h1>

      <p className="mb-8 text-lg italic leading-relaxed text-slate-200/85 [text-shadow:_0_1px_8px_rgba(0,0,0,0.6)]">
        {sceneText}
      </p>

      <h2 className="mb-6 text-2xl font-semibold leading-snug text-white [text-shadow:_0_1px_8px_rgba(0,0,0,0.6)] sm:text-3xl">
        {step.prompt}
      </h2>

      {step.kind === "number" && (
        <NumberInputStep
          step={step}
          value={distanceInput}
          setValue={setDistanceInput}
          canContinue={canContinueDistance}
          isLast={isLast}
          onContinue={onCommitDistance}
        />
      )}

      {step.kind === "choice" && (
        <ChoiceInputStep
          step={step}
          answers={answers}
          onCommit={onCommitChoice}
        />
      )}

      {step.kind === "slider" && (
        <SliderInputStep
          step={step}
          answers={answers}
          isLast={isLast}
          onCommit={onCommitSlider}
          onContinue={() =>
            onSliderContinue(step.key, answers[step.key])
          }
        />
      )}

      {status === "error" && (
        <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100 backdrop-blur-md">
          <p className="font-medium">
            The prediction could not be fetched.
          </p>

          <p className="mt-1 text-red-200/80">
            {errorMsg}
          </p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg bg-red-500/25 px-3 py-1.5 text-xs font-semibold text-red-50 hover:bg-red-500/40"
          >
            Try again
          </button>
        </div>
      )}

      {status === "loading" && (
        <div className="mt-8 flex items-center gap-3 text-sm text-teal-100/70">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-300" />
          Analyzing the delivery...
        </div>
      )}

      <div className="mt-auto pt-10">
        {stepIndex > 0 && status !== "loading" && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-teal-100/50 transition-colors hover:text-amber-200"
          >
            ← Go back a chapter
          </button>
        )}
      </div>
    </div>
  );
}

function NumberInputStep({
  step,
  value,
  setValue,
  canContinue,
  isLast,
  onContinue,
}: {
  step: NumberStep;
  value: string;
  setValue: (v: string) => void;
  canContinue: boolean;
  isLast: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3 rounded-2xl border border-white/15 bg-white/[0.05] px-5 py-4 backdrop-blur-md transition-colors focus-within:border-amber-300/70 focus-within:bg-amber-300/[0.08]">
        <input
          type="number"
          inputMode="decimal"
          autoFocus
          value={value}
          min={step.min}
          max={step.max}
          step={step.step}
          placeholder={step.placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canContinue) {
              onContinue();
            }
          }}
          className="w-full bg-transparent text-3xl font-semibold text-white outline-none placeholder:text-slate-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <span className="shrink-0 text-lg font-medium text-teal-100/70">
          {step.unit}
        </span>
      </div>

      <p className="text-xs text-teal-100/50">
        Range: {step.min} – {step.max} {step.unit}
      </p>

      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className={[
          "rounded-2xl px-6 py-4 text-base font-semibold transition-all duration-200",
          canContinue
            ? "bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 hover:shadow-amber-400/40 hover:brightness-110 active:scale-[0.99]"
            : "cursor-not-allowed bg-white/5 text-slate-500",
        ].join(" ")}
      >
        {isLast ? "Reveal the result" : "Continue"}
      </button>
    </div>
  );
}

function ChoiceInputStep({
  step,
  answers,
  onCommit,
}: {
  step: ChoiceStep;
  answers: Answers;
  onCommit: (
    key: ChoiceStep["key"],
    value: string
  ) => void;
}) {
  const current = answers[step.key] as string;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {step.options.map((opt) => {
        const selected = current === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onCommit(step.key, opt.value)}
            className={[
              "group relative overflow-hidden rounded-2xl border p-5 text-left backdrop-blur-md transition-all duration-200",
              "hover:-translate-y-0.5 hover:border-amber-300/60 hover:bg-amber-300/[0.06]",
              selected
                ? "border-amber-300 bg-amber-300/10 shadow-lg shadow-amber-500/20"
                : "border-white/12 bg-white/[0.05]",
            ].join(" ")}
          >
            <div className="mb-2 text-3xl">
              {opt.emoji}
            </div>

            <div className="text-base font-semibold text-white">
              {opt.label}
            </div>

            <div className="mt-1 text-sm text-teal-50/60">
              {opt.flavor}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SliderInputStep({
  step,
  answers,
  isLast,
  onCommit,
  onContinue,
}: {
  step: SliderStep;
  answers: Answers;
  isLast: boolean;
  onCommit: (
    key: SliderStep["key"],
    value: number
  ) => void;
  onContinue: () => void;
}) {
  const value = answers[step.key];

  const pct =
    ((value - step.min) / (step.max - step.min)) * 100;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-white/12 bg-white/[0.05] px-6 py-6 backdrop-blur-md">
        <div className="mb-6 flex items-baseline justify-center gap-3">
          <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-teal-200 bg-clip-text text-6xl font-bold text-transparent">
            {value}
          </span>

          <span className="text-lg font-medium text-teal-100/70">
            {step.unit}
          </span>
        </div>

        <input
          type="range"
          min={step.min}
          max={step.max}
          step={step.step}
          value={value}
          onChange={(e) =>
            onCommit(step.key, Number(e.target.value))
          }
          className="w-full cursor-pointer appearance-none rounded-full
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:w-5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-amber-300
          [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:shadow-amber-500/50
          [&::-moz-range-thumb]:h-5
          [&::-moz-range-thumb]:w-5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:bg-amber-300"
          style={{
            background: `linear-gradient(to right, rgb(252 211 77) 0%, rgb(245 158 11) ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
            height: "6px",
          }}
        />

        <div className="mt-3 flex justify-between text-xs text-teal-100/50">
          <span>
            {step.min} {step.unit}
          </span>

          <span>
            {step.max} {step.unit}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 px-6 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-amber-400/40 hover:brightness-110 active:scale-[0.99]"
      >
        {isLast ? "Reveal the result" : "Continue"}
      </button>
    </div>
  );
}

function RevealScreen({
  prediction,
  answers,
  onRestart,
}: {
  prediction: "On Time" | "Late";
  answers: Answers;
  onRestart: () => void;
}) {
  const isOnTime = prediction === "On Time";

  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-amber-300 [text-shadow:_0_1px_8px_rgba(0,0,0,0.6)]">
        The Verdict
      </p>

      <div className="mb-4">
        <div
          className={[
            "text-6xl font-bold tracking-tight sm:text-8xl",
            isOnTime
              ? "bg-gradient-to-r from-emerald-200 via-teal-300 to-amber-200"
              : "bg-gradient-to-r from-amber-200 via-orange-300 to-red-300",
            "bg-clip-text text-transparent",
          ].join(" ")}
        >
          {prediction}
        </div>
      </div>

      <p className="mb-10 max-w-xl text-lg italic leading-relaxed text-slate-200/85 [text-shadow:_0_1px_8px_rgba(0,0,0,0.6)]">
        {isOnTime
          ? "The route comes together. The order reaches the customer right when it should."
          : "The clock wins this round. Distance, traffic, weather, and preparation push the delivery beyond the expected time."}
      </p>

      <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-5 backdrop-blur-md">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100/60">
          Delivery details
        </h3>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <SummaryRow
            label="Distance"
            value={
              answers.distance_km !== null
                ? `${answers.distance_km} km`
                : "—"
            }
          />

          <SummaryRow
            label="Weather"
            value={answers.weather || "—"}
          />

          <SummaryRow
            label="Traffic"
            value={answers.traffic_level || "—"}
          />

          <SummaryRow
            label="Time of day"
            value={answers.time_of_day || "—"}
          />

          <SummaryRow
            label="Vehicle"
            value={answers.vehicle_type || "—"}
          />

          <SummaryRow
            label="Prep time"
            value={`${answers.prep_time_min} min`}
          />

          <SummaryRow
            label="Courier experience"
            value={`${answers.courier_experience_years} yrs`}
          />
        </dl>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="mt-8 self-start rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-400/40 hover:brightness-110 active:scale-[0.99]"
      >
        Tell another story
      </button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/8 pb-2">
      <dt className="text-teal-100/50">
        {label}
      </dt>

      <dd className="font-medium capitalize text-amber-50">
        {value}
      </dd>
    </div>
  );
}
