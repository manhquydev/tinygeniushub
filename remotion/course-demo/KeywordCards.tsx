import { useCurrentFrame, spring } from "remotion";

const VOWELS = new Set(["a", "e", "i", "o", "u", "A", "E", "I", "O", "U"]);

// Card border colors cycle for variety
const CARD_COLORS = ["#4D96FF", "#FF6B6B", "#6BCB77", "#FFD93D", "#C77DFF"];

function PhonicsChar({ char }: { char: string }) {
  const isVowel = VOWELS.has(char);
  const isLetter = /[a-zA-Z]/.test(char);
  const color = isLetter ? (isVowel ? "#FF6B6B" : "#4D96FF") : "#1e293b";
  return <span style={{ color }}>{char}</span>;
}

interface KeywordCardsProps {
  keywords: string[];
  startFrame?: number; // global frame when this component starts animating
}

// Staggered keyword cards for demonstrate phase.
// Each card: 220x130px, white bg, colored border, 6-frame stagger.
export function KeywordCards({ keywords, startFrame = 0 }: KeywordCardsProps) {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      {keywords.map((keyword, idx) => {
        const cardFrame = Math.max(0, frame - startFrame - idx * 6);
        const scale = spring({
          frame: cardFrame,
          fps: 30,
          config: { damping: 7, stiffness: 85 },
          from: 0,
          to: 1,
        });

        const borderColor = CARD_COLORS[idx % CARD_COLORS.length];

        return (
          <div
            key={idx}
            style={{
              width: 220,
              height: 130,
              background: "white",
              borderRadius: 24,
              border: `4px solid ${borderColor}`,
              boxShadow: `0 4px 16px ${borderColor}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${scale})`,
              transformOrigin: "left center",
            }}
          >
            <span
              style={{
                fontSize: 56,
                fontWeight: 800,
                fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              {keyword.split("").map((char, ci) => (
                <PhonicsChar key={ci} char={char} />
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
