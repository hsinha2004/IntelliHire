import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { staggerContainer, staggerItem } from "../lib/motion";

function SkillGapRow({ skill, yourLevel, requiredLevel, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const gap = requiredLevel - yourLevel;
  const hasGap = gap > 0;

  return (
    <motion.div ref={ref} variants={staggerItem} style={{ marginBottom: 16 }}>
      {/* Skill name + gap badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(0,0,0,0.8)",
          }}
        >
          {skill}
        </span>
        {hasGap && (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.06 + 0.8 }}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#E8521A",
              background: "rgba(232,82,26,0.08)",
              border: "1px solid rgba(232,82,26,0.2)",
              padding: "2px 8px",
              borderRadius: 9999,
            }}
          >
            -{gap}% gap
          </motion.span>
        )}
      </div>

      {/* Your level bar */}
      <div style={{ marginBottom: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 3,
          }}
        >
          <span style={{ fontSize: 11, color: "rgba(0,0,0,0.4)" }}>
            Your level
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#9b8ec4" }}>
            {yourLevel}%
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: "rgba(0,0,0,0.07)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={inView ? { width: `${yourLevel}%` } : {}}
            transition={{
              duration: 0.9,
              ease: [0.16, 1, 0.3, 1],
              delay: index * 0.06,
            }}
            style={{
              height: "100%",
              borderRadius: 3,
              background: "linear-gradient(90deg, #9b8ec4, #b8aed4)",
            }}
          />
        </div>
      </div>

      {/* Required level bar */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 3,
          }}
        >
          <span style={{ fontSize: 11, color: "rgba(0,0,0,0.4)" }}>
            Required
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#E8521A" }}>
            {requiredLevel}%
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: "rgba(0,0,0,0.07)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={inView ? { width: `${requiredLevel}%` } : {}}
            transition={{
              duration: 0.9,
              ease: [0.16, 1, 0.3, 1],
              delay: index * 0.06 + 0.15,
            }}
            style={{
              height: "100%",
              borderRadius: 3,
              background: hasGap
                ? "linear-gradient(90deg, #E8521A, #f07a52)"
                : "linear-gradient(90deg, #34d399, #6ee7b7)",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function SkillGapChart({ skillGaps = [] }) {
  return (
    <motion.div
      variants={staggerContainer(0.05, 0.07)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
    >
      {skillGaps.map((item, index) => (
        <SkillGapRow
          key={item.skill || index}
          skill={item.skill}
          yourLevel={item.yourLevel}
          requiredLevel={item.requiredLevel}
          index={index}
        />
      ))}
    </motion.div>
  );
}

export default SkillGapChart;
