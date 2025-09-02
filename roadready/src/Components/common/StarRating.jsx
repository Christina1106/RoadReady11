import React from "react";

export default function StarRating({
  value = 0,          // 0..5
  onChange,           // (n) => void
  readOnly = false,
  size = 18,
  className = "",
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={className} style={{ display: "inline-flex", gap: 4, lineHeight: 0 }}>
      {stars.map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          onClick={() => !readOnly && onChange?.(n)}
          role={readOnly ? "img" : "button"}
          aria-label={`${n} star`}
          style={{
            cursor: readOnly ? "default" : "pointer",
            fill: n <= Math.round(value) ? "#FFC107" : "#E5E7EB",
            transition: "fill .15s ease",
          }}
        >
          <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.4 8.168L12 18.897l-7.334 3.869 1.4-8.168L.132 9.211l8.2-1.193z" />
        </svg>
      ))}
    </div>
  );
}
