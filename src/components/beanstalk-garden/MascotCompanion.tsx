"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function MascotCompanion() {
  const [message, setMessage] = useState("Let's climb to the Clouds!");

  useEffect(() => {
    // Randomly change message every 10 seconds to keep it lively
    const messages = [
      "You are so good!",
      "Click on the star to learn!",
      "Come on, you're almost to the top!",
      "The cloud garden is beautiful!",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setMessage(messages[i]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-[100] pointer-events-none flex items-end gap-3">
      {/* Mascot character floating */}
      <motion.div
        animate={{
          y: [0, -15, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-20 h-20 bg-indigo-100 rounded-full border-4 border-indigo-400 shadow-xl flex items-center justify-center text-5xl pointer-events-auto cursor-pointer"
        whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
        onClick={() => setMessage("Coooo! Are you calling me?")}
      >
        🦉
      </motion.div>

      {/* Speech bubble */}
      <motion.div
        key={message} // Re-animate when message changes
        initial={{ opacity: 0, scale: 0.8, x: -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        className="mb-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl rounded-bl-none shadow-lg text-indigo-900 border-2 border-indigo-200 font-bold max-w-[200px]"
      >
        {message}
      </motion.div>
    </div>
  );
}
