import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

export function MatchRing({ percentage, size = 52 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const strokeWidth = 4;
  const r = size / 2 - strokeWidth;
  const circ = 2 * Math.PI * r;
  const filled = (percentage / 100) * circ;

  /* Interpolate color: lilac → terracotta based on % */
  const color =
    percentage >= 80
      ? "#E8521A"
      : percentage >= 60
      ? "#c4805e"
      : percentage >= 40
      ? "#9b8ec4"
      : "rgba(0,0,0,0.2)";

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(0,0,0,0.07)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={
            inView
              ? { strokeDashoffset: circ - filled }
              : { strokeDashoffset: circ }
          }
          transition={{
            duration: 1,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.3,
          }}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: `${size / 2}px ${size / 2}px`,
          }}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.22}
          fontWeight={700}
          fill={color}
          fontFamily="Inter, system-ui, sans-serif"
        >
          {Math.round(percentage)}%
        </text>
      </svg>
    </div>
  );
}

export default MatchRing;
