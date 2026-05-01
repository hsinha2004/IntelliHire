import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingHint({
  message,
  icon = "👆",
  storageKey,
  delay = 1500,
  position = "bottom-right",
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`hint_${storageKey}`);
    if (dismissed) return;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [storageKey, delay]);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(`hint_${storageKey}`, "true");
  }

  const positionStyles = {
    "bottom-right": { bottom: 24, right: 24 },
    "bottom-center": {
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
    },
    "top-right": { top: 80, right: 24 },
  }[position];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
          style={{
            position: "fixed",
            zIndex: 999,
            ...positionStyles,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            background: "#FAFAF8",
            border: "1px solid rgba(232,82,26,0.2)",
            borderRadius: 12,
            boxShadow:
              "0 8px 32px rgba(232,82,26,0.12), 0 2px 8px rgba(0,0,0,0.08)",
            fontSize: 13,
            fontWeight: 500,
            color: "rgba(0,0,0,0.75)",
            maxWidth: 280,
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={dismiss}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Pulsing dot */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#E8521A",
              flexShrink: 0,
            }}
          />
          <span>
            {icon} {message}
          </span>
          {/* Dismiss x */}
          <span
            style={{
              marginLeft: "auto",
              opacity: 0.4,
              fontSize: 16,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FloatingHint;
