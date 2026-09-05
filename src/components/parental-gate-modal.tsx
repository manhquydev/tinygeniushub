"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, CheckCircle, AlertCircle, ShieldAlert } from "lucide-react";

interface ParentalGateModalProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function ParentalGateModal({ onSuccess, onCancel }: ParentalGateModalProps) {
    const t = useTranslations("chrome.parentGate.modal");
    const tActions = useTranslations("common.actions");
    const [num1, setNum1] = useState(() => Math.floor(Math.random() * 8) + 3);
    const [num2, setNum2] = useState(() => Math.floor(Math.random() * 8) + 3);
    const [answer, setAnswer] = useState("");
    const [error, setError] = useState(false);

    const generateQuestion = () => {
        // Generate two random numbers between 3 and 10
        const n1 = Math.floor(Math.random() * 8) + 3;
        const n2 = Math.floor(Math.random() * 8) + 3;
        setNum1(n1);
        setNum2(n2);
        setAnswer("");
        setError(false);
    };

    useEffect(() => {
        // Prevent scrolling while modal is open
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAnswer = parseInt(answer, 10);

        if (parsedAnswer === num1 * num2) {
            onSuccess();
        } else {
            setError(true);
            setTimeout(() => {
                generateQuestion();
            }, 1500); // Reset question after showing error for a bit
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-ink-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-4 border-brand-100"
                role="dialog"
                aria-labelledby="gate-title"
                aria-modal="true"
            >
                <div className="bg-brand-50 p-6 flex items-center gap-4 relative">
                    <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                        <ShieldAlert size={28} className="text-brand-600" />
                    </div>
                    <div>
                        <h2 id="gate-title" className="text-xl font-black text-brand-800 tracking-tight">{t("title")}</h2>
                        <p className="text-brand-600 text-sm font-medium">{t("subtitle")}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-2 text-ink-400 hover:text-ink-600 hover:bg-ink-100 rounded-full transition-colors"
                        aria-label={tActions("close")}
                    >
                        <X size={24} strokeWidth={2.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <p className="text-center text-ink-600 font-medium mb-6">
                        {t("prompt")}
                    </p>

                    <div className="flex items-center justify-center gap-4 text-4xl font-black text-ink-800 mb-8 font-display">
                        <span>{num1}</span>
                        <span className="text-brand-500">x</span>
                        <span>{num2}</span>
                        <span className="text-brand-500">=</span>
                        <input
                            type="number"
                            value={answer}
                            onChange={(e) => {
                                setAnswer(e.target.value);
                                setError(false);
                            }}
                            autoFocus
                            className={`w-24 text-center border-b-4 bg-surface-50 rounded-t-xl px-2 py-1 outline-none transition-colors ${error ? "border-red-500 text-red-600" : "border-brand-500 text-ink-800 focus:bg-brand-50"
                                }`}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center justify-center gap-2 text-red-600 font-medium mb-4 animate-in slide-in-from-top-2">
                            <AlertCircle size={20} />
                            <span>{t("wrongAnswer")}</span>
                        </div>
                    )}

                    <div className="flex gap-4 mt-8">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-4 font-bold rounded-2xl bg-surface-100 text-ink-600 hover:bg-surface-200 transition-colors"
                        >
                            {t("back")}
                        </button>
                        <button
                            type="submit"
                            disabled={!answer || error}
                            className="flex-1 py-4 font-bold rounded-2xl bg-brand-500 text-white shadow-lg hover:bg-brand-600 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={20} /> {t("confirm")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
