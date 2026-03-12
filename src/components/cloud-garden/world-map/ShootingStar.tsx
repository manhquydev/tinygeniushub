import "../cloud-garden.css";

/**
 * ShootingStar — Animated shooting star that crosses the sky.
 *
 * A single white-to-peach gradient `span` that plays the
 * `gardenShootingStar` CSS keyframe on repeat.
 * Three instances staggered in time for a natural feel.
 *
 * SERVER component — pure CSS, no JavaScript animation.
 */
export function ShootingStar() {
  return (
    <>
      {/* Primary shooting star */}
      <span
        className="cg-shooting-star"
        style={{
          top: "6%",
          left: "2%",
          width: 110,
          animationDuration: "10s",
          animationDelay: "2s",
        }}
      />
      {/* Secondary — different path */}
      <span
        className="cg-shooting-star"
        style={{
          top: "14%",
          left: "8%",
          width: 70,
          animationDuration: "14s",
          animationDelay: "8s",
          opacity: 0,
        }}
      />
      {/* Tertiary — slower faint one */}
      <span
        className="cg-shooting-star"
        style={{
          top: "4%",
          left: "40%",
          width: 85,
          animationDuration: "18s",
          animationDelay: "14s",
          opacity: 0,
        }}
      />
    </>
  );
}
