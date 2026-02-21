"use client";

import { useState } from "react";
import * as m from "motion/react-m";
import { Play, Check } from "lucide-react";
import { LessonWizardFlow } from "./lesson-wizard-flow";
import { useReducedMotion } from "motion/react";

interface LessonStartCardProps {
    childId: string;
    lessonId: string;
    title: string;
    objective: string;
    estimatedMinutes: number;
    videoSource?: string | null;
}

export function LessonStartCard(props: LessonStartCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const prefersReducedMotion = useReducedMotion();

    return (
        <>
            <m.article
                className="list-item stack-item lesson-flow-card flex flex-col items-center text-center gap-4"
                layout
                style={{ border: "4px solid var(--surface-200)", padding: "2rem", borderRadius: "24px", background: "white" }}
            >
                <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center text-3xl mb-2">
                    🚀
                </div>
                <strong style={{ fontSize: "1.5rem", color: "var(--brand-700)", lineHeight: "1.2" }}>{props.title}</strong>
                <p className="text-ink-500" style={{ fontSize: "1.1rem" }}>{props.objective}</p>
                <p className="muted-text text-sm">Thời lượng: <strong>{props.estimatedMinutes} phút</strong></p>

                <m.button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="solid-button w-full mt-4 flex items-center justify-center gap-2"
                    whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.05 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                    style={{ padding: "1.2rem", fontSize: "1.2rem", borderRadius: "100px", background: "var(--brand-500)", color: "white" }}
                >
                    <Play size={24} fill="currentColor" /> Bắt đầu bài học
                </m.button>
            </m.article>

            {isOpen && (
                <LessonWizardFlow {...props} onClose={() => setIsOpen(false)} />
            )}
        </>
    );
}
