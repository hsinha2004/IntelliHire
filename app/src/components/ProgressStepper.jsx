import React from "react";
import { motion } from "framer-motion";

export function ProgressStepper({
  hasResume,
  hasSkills,
  hasMatches,
  hasFeedback,
  onStepClick,
}) {
  const steps = [
    {
      id: "upload",
      label: "Upload Resume",
      description: "Upload your PDF resume",
      icon: "📄",
      completed: hasResume,
      active: !hasResume,
    },
    {
      id: "skills",
      label: "Analyse Skills",
      description: "View your extracted skills",
      icon: "⚡",
      completed: hasSkills,
      active: hasResume && !hasSkills,
    },
    {
      id: "jobs",
      label: "Match Jobs",
      description: "Find your best job fits",
      icon: "🎯",
      completed: hasMatches,
      active: hasSkills && !hasMatches,
    },
    {
      id: "ai_feedback",
      label: "AI Feedback",
      description: "Get resume improvement tips",
      icon: "✦",
      completed: hasFeedback,
      active: hasMatches && !hasFeedback,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "#FAFAF8",
        border: "1px solid rgba(232,82,26,0.12)",
        borderRadius: 16,
        padding: "24px 28px",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle terracotta tint in top-right corner */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          background:
            "radial-gradient(circle, rgba(232,82,26,0.06), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: "rgba(0,0,0,0.85)",
              letterSpacing: "-0.02em",
            }}
          >
            Your Progress
          </h3>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 13,
              color: "rgba(0,0,0,0.45)",
            }}
          >
            {completedCount} of {steps.length} steps completed
          </p>
        </div>
        {/* Overall progress pill */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", damping: 20 }}
          style={{
            padding: "4px 14px",
            borderRadius: 9999,
            background:
              completedCount === steps.length
                ? "rgba(232,82,26,0.1)"
                : "rgba(155,142,196,0.1)",
            border: `1px solid ${
              completedCount === steps.length
                ? "rgba(232,82,26,0.25)"
                : "rgba(155,142,196,0.25)"
            }`,
            color: completedCount === steps.length ? "#E8521A" : "#9b8ec4",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {Math.round(progressPercent)}%
        </motion.div>
      </div>

      {/* Progress track */}
      <div
        style={{
          position: "relative",
          height: 4,
          background: "rgba(0,0,0,0.07)",
          borderRadius: 2,
          marginBottom: 24,
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{
            height: "100%",
            borderRadius: 2,
            background: "linear-gradient(90deg, #E8521A, #9b8ec4)",
          }}
        />
      </div>

      {/* Steps */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          position: "relative",
        }}
      >
        {steps.map((step, index) => (
          <motion.button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.1 + 0.1,
              type: "spring",
              damping: 24,
              stiffness: 200,
            }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Step circle */}
            <motion.div
              animate={{
                background: step.completed
                  ? "linear-gradient(135deg, #E8521A, #9b8ec4)"
                  : step.active
                  ? "#FAFAF8"
                  : "rgba(0,0,0,0.06)",
                borderColor: step.completed
                  ? "#E8521A"
                  : step.active
                  ? "#E8521A"
                  : "rgba(0,0,0,0.12)",
                boxShadow: step.active
                  ? "0 0 0 4px rgba(232,82,26,0.12)"
                  : "none",
              }}
              transition={{ duration: 0.3 }}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "2px solid",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              {step.completed ? (
                <motion.span
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    damping: 15,
                    stiffness: 300,
                  }}
                  style={{ fontSize: 14, filter: "brightness(10)" }}
                >
                  ✓
                </motion.span>
              ) : (
                <span>{step.icon}</span>
              )}
            </motion.div>

            {/* Step label */}
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: step.completed
                    ? "#E8521A"
                    : step.active
                    ? "rgba(0,0,0,0.85)"
                    : "rgba(0,0,0,0.4)",
                  letterSpacing: "-0.01em",
                  transition: "color 0.2s ease",
                }}
              >
                {step.label}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 11,
                  color: "rgba(0,0,0,0.35)",
                  lineHeight: 1.3,
                }}
              >
                {step.description}
              </p>
            </div>

            {/* Pulsing ring on active step */}
            {step.active && (
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  top: 4,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "2px solid #E8521A",
                  pointerEvents: "none",
                }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default ProgressStepper;
