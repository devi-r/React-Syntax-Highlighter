import React, { forwardRef } from "react";

// --- STAGE 3: RENDERER (Editor Pipeline) ---
// Final stage of the editor pipeline for displaying syntax-highlighted tokens
const CodeRenderer = forwardRef(({ tokens, semanticTokenMap, code }, ref) => {
  return (
    <pre ref={ref} className="code-renderer" aria-hidden="true">
      <code>
        {tokens.map((token, index) => {
          const semanticType = semanticTokenMap.get(token);
          const className = `token ${
            semanticType
              ? `token-semantic-${semanticType}`
              : `token-${token.type.toLowerCase()}`
          }`;
          return (
            <span key={index} className={className}>
              {token.value}
            </span>
          );
        })}
        {/* If the code ends with a newline, render a zero-width space.
              This forces the final line to have height, preventing the textarea and
              renderer from having different scroll heights, which fixes cursor
              misalignment when clicking at the end of the file. */}
        {code.endsWith("\n") && "\u200B"}
      </code>
    </pre>
  );
});

CodeRenderer.displayName = "CodeRenderer";

export default CodeRenderer;
