import React, { forwardRef } from "react";

// Line numbers component for the code editor
const LineNumbers = forwardRef(({ lineCount }, ref) => {
  return (
    <div ref={ref} className="line-numbers" aria-hidden="true">
      {Array.from({ length: lineCount }, (_, i) => (
        <span key={i}>{i + 1}</span>
      ))}
    </div>
  );
});

LineNumbers.displayName = "LineNumbers";

export default LineNumbers;
