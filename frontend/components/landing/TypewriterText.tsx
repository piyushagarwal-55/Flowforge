"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

interface TypewriterTextProps {
  phrases: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  cursorClassName?: string;
  showCursor?: boolean;
}

export function TypewriterText({
  phrases,
  className = "",
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseDuration = 2000,
  cursorClassName = "text-emerald-400",
  showCursor = true,
}: TypewriterTextProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentPhrase = phrases[currentPhraseIndex];

  const tick = useCallback(() => {
    if (isPaused) return;

    if (!isDeleting) {
      // Typing
      if (currentText.length < currentPhrase.length) {
        setCurrentText(currentPhrase.slice(0, currentText.length + 1));
      } else {
        // Finished typing, pause then start deleting
        setIsPaused(true);
        setTimeout(() => {
          setIsPaused(false);
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      // Deleting
      if (currentText.length > 0) {
        setCurrentText(currentText.slice(0, -1));
      } else {
        // Finished deleting, move to next phrase
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }
  }, [currentText, currentPhrase, isDeleting, isPaused, pauseDuration, phrases.length]);

  useEffect(() => {
    const timeout = setTimeout(
      tick,
      isPaused ? pauseDuration : isDeleting ? deletingSpeed : typingSpeed
    );
    return () => clearTimeout(timeout);
  }, [tick, isPaused, isDeleting, deletingSpeed, typingSpeed, pauseDuration]);

  return (
    <span className={className}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentText}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          className="inline"
        >
          {currentText}
        </motion.span>
      </AnimatePresence>
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          className={`inline-block ml-0.5 ${cursorClassName}`}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

// Static text with highlight animation
export function HighlightText({
  children,
  className = "",
  highlightColor = "rgba(16,185,129,0.2)",
  delay = 0,
}: {
  children: string;
  className?: string;
  highlightColor?: string;
  delay?: number;
}) {
  return (
    <motion.span
      className={`relative inline-block ${className}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      <motion.span
        className="absolute inset-0 -z-10"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.3, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          background: highlightColor,
          transformOrigin: "left",
          borderRadius: "4px",
        }}
      />
      {children}
    </motion.span>
  );
}
