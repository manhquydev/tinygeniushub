# Kids Educational Video Engagement Research
**Date:** 2026-02-27
**Target:** Ages 5–8 | Platform: Remotion (React/SVG/CSS) | Canvas: 1920×1080 @ 30fps

---

## 1. Pacing & Attention Span

**Attention span:** 10–20 min per activity but video segments should be ≤5 min for ages 5–8. For a 30-second lesson clip, children are fully captive.

### Frame counts at 30fps for key timing rules:

| Event | Duration | Frames |
|---|---|---|
| Min scene hold (simple visual) | 1.5s | 45f |
| Standard scene hold | 2.5–3s | 75–90f |
| Complex scene (multi-element) | 4–5s | 120–150f |
| Transition (wipe/fade/zoom) | 0.5–0.8s | 15–24f |
| "Pause to process" beat after concept reveal | 1.5–2s | 45–60f |
| Celebration / reward moment | 1.5–2.5s | 45–75f |
| Call-and-response pause ("your turn!") | 3–4s | 90–120f |

**Transition speed rule:** Never faster than 15f (0.5s). Use ease-in-out curves. Hard cuts = cognitive disruption.

**Scene change budget for a 30-second clip (900f total):**
- 4–6 distinct visual scenes max
- Average 5s (150f) per scene + 0.7s (21f) transition = ~170f/scene
- That's ~5 scenes in 900f with room for intro/outro beats

---

## 2. Voice/Narration Visual Cues

Even without audio, show "talking is happening":

### Speech Indicators
- **Speech bubble** from character mouth: rounded rect, white fill, `#333` border 3px, tail pointing to speaker. Show for full narration duration.
- **Bouncing text** in bubble: each word scales 1.0→1.15→1.0 in sync with syllable rhythm (~0.3s per word = 9f bounce)
- **Mouth open/close cycle**: simple oval morph, cycle every 8–12f during speech
- **Text highlight sweep**: if key word appears on screen, sweep a yellow `rgba(255,220,0,0.5)` highlight left→right over the word, duration 15f

### Active Listening Indicator
- Character's eyes track the "learning object" — pupils shift toward it
- Character tilts head 8–12° while listening (ease 20f)
- Ear wiggle (if applicable) 3° oscillation, 2 cycles

### Lip-sync proxy for SVG characters
```
// Mouth states: closed | small-open | wide-open
// Cycle every 8f during speech segments:
// f%24: 0-7=closed, 8-15=small-open, 16-23=wide-open
```

---

## 3. Visual Storytelling Structure (30-second clip)

Based on Numberblocks/Alphablocks 3–5 min episode logic compressed to 30s:

### 30-Second Lesson Arc (900 frames)

| Phase | Frame Range | Duration | What Happens |
|---|---|---|---|
| **Hook** – character greets / shows problem | 0–90 | 3s | Character enters frame (slide from left), waves, speech bubble: "Hey! Can you help me?" |
| **Concept Intro** – show the thing | 91–210 | 4s | Learning object animates in (scale 0→1 with bounce), character points to it |
| **Demonstrate** – show it working | 211–420 | 7s | Core animation: concept plays out (e.g., letter forms, number combines), character reacts with joy |
| **"Your Turn" Pause** | 421–540 | 4s | Character looks at camera, hands out gesture, progress dots pulse, 3-2-1 countdown or empty pause |
| **Reinforce / Repeat** | 541–720 | 6s | Concept replays at 0.85x speed, keyword highlighted, character nods |
| **Celebrate** | 721–840 | 4s | Stars/confetti burst, character jumps, BIG happy expression |
| **Recap / Sign-off** | 841–900 | 2s | Key word/number stays on screen, character waves bye |

### Scene Entry Patterns (from top shows)
- **Alphablocks**: object falls from sky, bounces once, letter animates on. Entry always vertical (top→down).
- **Numberblocks**: blocks slide in from left/right, combine with merge animation.
- **BabyBus**: character runs in from right, stops with overshoot bounce.
- **Khan Academy Kids**: fade-in from center with radial glow background.

Rule: **Always animate-in from one direction per scene. Never two simultaneous entries from different directions.**

---

## 4. Emotional Design – Mascot Characters

### Eye Design (most critical element)
- Eye width: ≥15% of character head width
- Pupil: 60% of iris, black `#1a1a1a`
- Highlight dot: white, 20% pupil size, top-right quadrant — signals life/joy
- Happy eye: arc curve upward (lid droops slightly from top)
- Surprised: iris scales 1.3×, brows raise 8px
- Confused: one brow up, one down (asymmetric)
- All transitions: 8–12f ease-in-out

### Color Psychology Rules
| Emotion | Primary Color | Hex |
|---|---|---|
| Happy/Friendly | Warm yellow | `#FFD93D` |
| Excited | Orange | `#FF6B35` |
| Calm/Safe | Sky blue | `#74C0FC` |
| Learning/Growing | Soft green | `#69DB7C` |
| Surprised | Bright purple | `#CC5DE8` |
| Sad (brief only) | Muted blue | `#74A9C4` |

**Character shape rules:**
- All corners radius ≥ 30% of element size (pillowy round)
- No sharp angles anywhere on main character
- Body proportions: head 50–60% of total height (infant schema = instinctive bonding)

### Emotional Arc Per Scene
Characters should NOT be emotionally static. Minimum 2 expression changes per 30s clip:
1. Neutral/curious at start
2. Surprised/excited at concept reveal
3. Joyful at success

Transition between expressions: 8f morph (not snap).

---

## 5. Learning Reinforcement

### Visual Repetition Pattern
- **Rule of 3**: Show concept 3× — first time at full size (100%), second slightly smaller (85%), third with child "doing it" via pointer/cursor proxy.
- Each repetition should be ~0.85s shorter than previous.

### Call-and-Response Visual Cues
- **"Your Turn" gesture**: Character extends arm forward, hand open, palm up. Accompanied by:
  - Animated arrow pointing to empty space where child should respond
  - Dotted outline/ghost of the expected answer
  - Pulsing glow border on target zone: `box-shadow: 0 0 0 4px rgba(255,200,0,0.8)`, pulse every 30f

### Progress Indicators
- Dot trail: 3–5 dots at bottom center, 24px diameter, fill with gold `#FFD700` as progress advances
- Star burst at milestone: 8 rays, scale 0→1.2→1.0 in 20f

### Celebration Mechanics
- Confetti: 20–30 SVG shapes (stars, circles, hearts), colors `#FF6B6B #FFD93D #6BCB77 #4D96FF`, random trajectories, fade out over 45f
- Character jump: translateY 0→-40px→0 in 20f, slight squash on landing (scaleY 1→0.85→1)
- "Correct!" badge: slides in from top-right, scale bounce 0→1.2→1.0 in 18f

---

## 6. What NOT To Do

| Mistake | Why Harmful | Fix |
|---|---|---|
| Full sentences of text on screen | Split-attention effect, exceeds working memory | Max 3–4 words, large font (≥72px at 1920w) |
| Scene change < 15f (0.5s) | No processing time | Minimum 15f transition always |
| Static character for >3s | Breaks engagement | Idle animation: breathing cycle (scaleY 0.97–1.03 every 60f) |
| Two simultaneous animations in different regions | Attention split | One focal point per scene |
| Background clutter | Distracts from learning content | Max 2–3 background elements, low saturation |
| Text + narration redundancy (reading text aloud word-for-word) | Competes for same cognitive channel | Narration elaborates, text highlights keyword only |
| Rapid color changes in background | Sensory overload | Background color shifts slow (≥60f transition) |
| No emotional response from character to learning success | Breaks emotional investment | Always celebrate with character reaction |
| Hard cut between scenes | Jarring | Minimum: 15f fade or 20f wipe |
| Too many characters on screen | Cognitive overload | Max 2 characters per scene |
| Font < 60px | Unreadable for small screens/mobile | Minimum 72px, bold weight |

---

## 7. Sound Design Visual Proxies (SVG/CSS for silent render)

Even though audio is added later, these visual elements prime the brain for sound:

| Sound Event | Visual Proxy | Implementation |
|---|---|---|
| Happy melody / music | Floating musical notes (♪ ♫) drifting upward, fade out over 40f | SVG text nodes, translateY -60px + opacity 0, staggered 10f apart |
| "Correct!" chime | 5-point star burst + concentric rings expanding outward | Circle scale 0→2, opacity 1→0 in 30f, 3 rings staggered 8f |
| Thinking / silence | Ellipsis "..." animation, dots appear one by one every 12f | Sequential opacity: dot1 at 0f, dot2 at 12f, dot3 at 24f |
| Question / curiosity | Question mark `?` floats above character head, wobbles ±5° every 15f | SVG text with rotation oscillation |
| Surprise / impact | Exclamation `!` pops in (scale 0→1.3→1.0 in 10f) with starburst | Scale keyframe with overshoot |
| Applause / celebration | Confetti + hands clapping SVG icons bounce | translateY oscillation ±10px at 10f cycle |
| Soft background music | Subtle sine wave at bottom of screen, low opacity 0.15 | SVG path animating amplitude |
| Letter/word sound | Letter glows and pulses: scale 1.0→1.1→1.0, color shift to yellow | 15f scale keyframe on SVG text element |

### Musical Note Animation (Remotion CSS)
```css
@keyframes floatNote {
  0%   { transform: translateY(0) rotate(-10deg); opacity: 0.9; }
  100% { transform: translateY(-80px) rotate(10deg); opacity: 0; }
}
/* Duration: 40f = 1.33s at 30fps */
```

### Ripple (correct answer)
```css
@keyframes ripple {
  0%   { transform: scale(0.5); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}
/* 3 rings, staggered 8f, each 30f duration */
```

---

## 8. Key Size Reference (1920×1080)

| Element | Size |
|---|---|
| Main character height | 400–600px |
| Speech bubble width | 300–500px |
| Key word text | 96–120px, bold |
| Supporting text | 72px |
| Progress dot diameter | 32px |
| Celebration star | 80–120px |
| Musical note floating | 48px |
| Safe zone margin | 80px from all edges |
| Character focal zone | Center 960px wide, vertically 200–880px |

---

## Unresolved Questions

1. For the cungcontuhoc owl mascot specifically: does the character have distinct idle/talking/celebrating states already defined in SVG? Knowing this determines how complex lip-sync proxy can be.
2. Should the "your turn" pause have a real countdown timer visual (clock/progress ring), or just an open pause? Depends on whether videos will be interactive vs. passively viewed.
3. Are clips expected to teach a single concept per 30s, or multiple micro-concepts in sequence? This affects scene budget allocation significantly.
