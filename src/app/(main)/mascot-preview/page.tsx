"use client";

import { useState } from "react";
import { Mascot } from "@/components/mascot";
import type { MascotState, MascotVariant, MascotGesture, MascotActionProp } from "@/components/mascot/types";

const STATES: MascotState[] = [
  "idle", "happy", "thinking", "celebrating", "sad", "sleepy",
  "playful", "proud", "love", "surprised", "excited", "nervous", "angry", "bored",
];

const GESTURES: MascotGesture[] = [
  "none", "pointing", "waving", "nodding", "head-shake", "clapping", "thinking-scratch", "raise-hand",
];

const ACTION_PROPS: MascotActionProp[] = [
  "none", "reading", "space", "magic", "heart", "music",
  "writing", "drawing", "flashcard", "pointing-stick", "trophy", "magnifying-glass",
];

const CHARACTERS: { variant: MascotVariant; name: string; color: string }[] = [
  { variant: "dad", name: "Fox Dad", color: "#065f46" },
  { variant: "big", name: "Mother Fox", color: "#1e3a8a" },
  { variant: "sister", name: "Fox Sister", color: "#7c3aed" },
  { variant: "small", name: "Little Fox", color: "#0ea5e9" },
  { variant: "baby", name: "Fox Em", color: "#ea580c" },
];

const NEW_STATES: MascotState[] = ["surprised", "angry", "nervous", "bored"];

export default function MascotPreviewPage() {
  const [activeState, setActiveState] = useState<MascotState>("happy");
  const [activeGesture, setActiveGesture] = useState<MascotGesture>("none");
  const [activeProp, setActiveProp] = useState<MascotActionProp>("none");

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", background: "#f8fafc", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.25rem" }}>
        Fox Mascot Family — Full Preview
      </h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        5 characters · 14 states · 7 gestures · 11 props · Test interaction
      </p>

      {/* Controls */}
      <div style={{ marginBottom: "2rem" }}>
        <SelectorRow label="Status" items={STATES} active={activeState} onSelect={setActiveState} highlight={NEW_STATES} />
        <SelectorRow label="Gesture" items={GESTURES} active={activeGesture} onSelect={setActiveGesture} />
        <SelectorRow label="Props" items={ACTION_PROPS} active={activeProp} onSelect={setActiveProp} />
      </div>

      {/* Characters with selected state+gesture+prop */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.75rem" }}>
        Character - <span style={{ color: "#10b981" }}>{activeState}</span>
        {activeGesture !== "none" && <span style={{ color: "#8b5cf6" }}> + {activeGesture}</span>}
        {activeProp !== "none" && <span style={{ color: "#f59e0b" }}> + {activeProp}</span>}
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "3rem", alignItems: "flex-end" }}>
        {CHARACTERS.map((c) => (
          <div key={c.variant} style={{ textAlign: "center" }}>
            <div style={{ background: "#fff", borderRadius: "1rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
              <Mascot variant={c.variant} state={activeState} gesture={activeGesture} actionProp={activeProp} size={160} motionLevel="full" />
            </div>
            <div style={{ fontWeight: 700, color: c.color, fontSize: "0.9rem", marginTop: "0.4rem" }}>{c.name}</div>
          </div>
        ))}
      </div>

      {/* NEW: Expressions highlight — the 4 fixed duplicates */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.75rem" }}>
        New expressions (duplicates fixed)
      </h2>
      <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "1rem" }}>
        surprised→wide eyes · angry→angry brows · nervous→sweat drop · bored→drowsy lids
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "3rem" }}>
        {NEW_STATES.map((s) => (
          <div key={s}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem", textAlign: "center" }}>{s}</div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {CHARACTERS.map((c) => (
                <div key={c.variant} style={{ background: "#fff", borderRadius: "0.75rem", padding: "0.4rem", border: "1px solid #f1f5f9", textAlign: "center" }}>
                  <Mascot variant={c.variant} state={s} size={80} motionLevel="full" />
                  <div style={{ fontSize: "0.55rem", color: "#94a3b8" }}>{c.name}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* NEW: Gestures showcase */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.75rem" }}>
        Gesture (Gestures)
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "3rem" }}>
        {GESTURES.filter((g) => g !== "none").map((g) => (
          <div key={g} style={{ textAlign: "center" }}>
            <div style={{ background: "#fff", borderRadius: "0.75rem", padding: "0.5rem", border: "1px solid #f1f5f9" }}>
              <Mascot variant="big" state="happy" gesture={g} size={100} motionLevel="full" />
            </div>
            <div style={{ fontSize: "0.7rem", color: "#8b5cf6", fontWeight: 600, marginTop: "0.3rem" }}>{g}</div>
          </div>
        ))}
      </div>

      {/* NEW: Action Props showcase */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.75rem" }}>
        Educational props (Action Props)
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "3rem" }}>
        {ACTION_PROPS.filter((p) => p !== "none").map((p) => (
          <div key={p} style={{ textAlign: "center" }}>
            <div style={{ background: "#fff", borderRadius: "0.75rem", padding: "0.5rem", border: "1px solid #f1f5f9" }}>
              <Mascot variant="big" state="happy" actionProp={p} size={100} motionLevel="full" />
            </div>
            <div style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600, marginTop: "0.3rem" }}>{p}</div>
          </div>
        ))}
      </div>

      {/* Family variant */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.75rem" }}>
        Family
      </h2>
      <div style={{ background: "#fff", borderRadius: "1rem", padding: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", display: "inline-block", marginBottom: "3rem" }}>
        <Mascot variant="family" state="happy" size={400} motionLevel="full"
          dadState="proud" parentState="love" sisterState="playful" childState="celebrating" babyState="excited" />
      </div>

      {/* Full state grid for all characters */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.75rem" }}>
        All 14 states x 5 characters
      </h2>
      {CHARACTERS.map((c) => (
        <div key={c.variant} style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontWeight: 700, color: c.color, marginBottom: "0.4rem", fontSize: "0.95rem" }}>{c.name}</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {STATES.map((s) => (
              <div key={s} style={{ textAlign: "center", background: "#fff", borderRadius: "0.5rem", padding: "0.3rem", border: "1px solid #f1f5f9" }}>
                <Mascot variant={c.variant} state={s} size={70} motionLevel="full" />
                <div style={{ fontSize: "0.5rem", color: "#94a3b8" }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SelectorRow<T extends string>({ label, items, active, onSelect, highlight }: {
  label: string; items: T[]; active: T; onSelect: (v: T) => void; highlight?: T[];
}) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginRight: "0.5rem" }}>{label}:</span>
      <div style={{ display: "inline-flex", flexWrap: "wrap", gap: "0.35rem" }}>
        {items.map((item) => (
          <button key={item} onClick={() => onSelect(item)} style={{
            padding: "0.25rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", cursor: "pointer",
            border: active === item ? "2px solid #10b981" : highlight?.includes(item) ? "2px solid #f59e0b" : "1px solid #e2e8f0",
            background: active === item ? "#ecfdf5" : highlight?.includes(item) ? "#fffbeb" : "#fff",
            fontWeight: active === item ? 700 : highlight?.includes(item) ? 600 : 400,
            color: active === item ? "#065f46" : highlight?.includes(item) ? "#92400e" : "#475569",
          }}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
