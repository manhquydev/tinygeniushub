"use client";

/**
 * ValuePropStrip - 3 visual benefit cards
 * 
 * Benefits:
 * 1. Clear roadmap from easy to hard (Seedling icon)
 * 2. Unlock new tiers based on child progress (Cloud icon)
 * 3. Weekly report for parents (Trophy icon)
 * 
 * Responsive: 1 col mobile, 3 col desktop
 * Framer Motion entrance animations
 */

import { motion } from "framer-motion";
import { Sprout, Cloud, Trophy } from "lucide-react";

const benefits = [
  {
    icon: Sprout,
    title: "Clear roadmap",
    description: "From easy to difficult, suitable for your child's level",
  },
  {
    icon: Cloud,
    title: "Open floors according to progress",
    description: "Each milestone reached unlocks new content",
  },
  {
    icon: Trophy,
    title: "Weekly report",
    description: "Parents monitor their children's progress",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeInOut" as const,
    },
  },
};

export function ValuePropStrip() {
  return (
    <section 
      className="cgh-value-props"
      style={{
        padding: "3rem 0",
        backgroundColor: "rgba(255, 255, 255, 0.6)",
      }}
    >
      <div className="cgh-shell">
        <motion.div
          className="value-props-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem",
          }}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                className="value-prop-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "1.8rem 1.2rem",
                  borderRadius: "16px",
                  backgroundColor: "#fff",
                  border: "1px solid rgba(15, 159, 134, 0.15)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
                variants={itemVariants}
              >
                <div
                  className="icon-wrapper"
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "var(--cgh-mint)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <Icon size={28} color="var(--cgh-teal)" strokeWidth={2.5} />
                </div>

                <h3
                  style={{
                    margin: "0 0 0.5rem 0",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--cgh-ink)",
                  }}
                >
                  {benefit.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                    color: "var(--cgh-ink)",
                    opacity: 0.8,
                  }}
                >
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
