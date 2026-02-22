"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { CheckCircle2, Delete, X } from "lucide-react";

interface MathChallenge {
  left: number;
  right: number;
}

interface ParentGateDialogProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}

const NUMPAD_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["C", "0", "⌫"],
] as const;

function createChallenge(): MathChallenge {
  return {
    left: Math.floor(Math.random() * 8) + 3,
    right: Math.floor(Math.random() * 8) + 3,
  };
}

export function ParentGateDialog({ open, onClose, onVerified }: ParentGateDialogProps) {
  const prefersReducedMotion = useReducedMotion();
  const [challenge] = useState<MathChallenge>(() => createChallenge());
  const [answer, setAnswer] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const expected = useMemo(() => challenge.left * challenge.right, [challenge.left, challenge.right]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [open]);

  const triggerInvalid = () => {
    setIsInvalid(false);
    window.requestAnimationFrame(() => {
      setIsInvalid(true);
    });
  };

  const verifyAnswer = () => {
    if (Number(answer) === expected) {
      onVerified();
      return;
    }
    triggerInvalid();
  };

  const handleKeypad = (key: string) => {
    if (key === "C") {
      setAnswer("");
      setIsInvalid(false);
      return;
    }

    if (key === "⌫") {
      setAnswer((current) => current.slice(0, -1));
      setIsInvalid(false);
      return;
    }

    setAnswer((current) => `${current}${key}`.slice(0, 4));
    setIsInvalid(false);
  };

  return (
    <AnimatePresence>
      {open ? (
        <m.div
          className="parent-gate-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <m.div
            className="parent-gate-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="parent-gate-title"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={
              isInvalid && !prefersReducedMotion
                ? { opacity: 1, scale: 1, y: 0, x: [0, -10, 10, -8, 8, 0] }
                : { opacity: 1, scale: 1, y: 0, x: 0 }
            }
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={
              isInvalid && !prefersReducedMotion
                ? { duration: 0.42, ease: "easeInOut" }
                : { type: "spring", stiffness: 320, damping: 24 }
            }
          >
            <div className="parent-gate-head">
              <h2 id="parent-gate-title">Xác nhận phụ huynh</h2>
              <button type="button" className="parent-gate-close" onClick={onClose} aria-label="Đóng xác nhận phụ huynh">
                <X size={20} />
              </button>
            </div>

            <p className="parent-gate-copy">{`Vui lòng nhập kết quả của ${challenge.left} x ${challenge.right} để tiếp tục`}</p>

            <div className={`parent-gate-answer ${isInvalid ? "parent-gate-answer-error" : ""}`}>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={answer}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "");
                  setAnswer(digits.slice(0, 4));
                  setIsInvalid(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    verifyAnswer();
                  }
                }}
                aria-label="Kết quả phép tính xác nhận phụ huynh"
                placeholder="..."
              />
            </div>

            <div className="parent-gate-numpad">
              {NUMPAD_KEYS.flat().map((key) => {
                const isAction = key === "C" || key === "⌫";
                return (
                  <button
                    key={key}
                    type="button"
                    className={`parent-gate-key ${isAction ? "parent-gate-key-action" : ""}`}
                    onClick={() => handleKeypad(key)}
                  >
                    {key === "⌫" ? <Delete size={20} /> : key}
                  </button>
                );
              })}
            </div>

            {isInvalid ? <p className="parent-gate-error">Sai kết quả. Vui lòng thử lại.</p> : null}

            <button type="button" className="parent-gate-submit" onClick={verifyAnswer} disabled={answer.length === 0}>
              <CheckCircle2 size={18} />
              <span>Tiếp tục</span>
            </button>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
