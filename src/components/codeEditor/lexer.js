// --- STAGE 1: LEXER (Tokenization) ---
// Used by both the editor (for immediate highlighting) and worker (for full analysis)

// Token types for JavaScript syntax highlighting
export const tokenTypes = [
  { type: "WHITESPACE", pattern: /\s+/ },
  { type: "COMMENT", pattern: /\/\*[\s\S]*?\*\// },
  { type: "COMMENT", pattern: /\/\/.*/ },
  {
    type: "KEYWORD",
    pattern:
      /\b(const|let|var|function|return|if|else|for|while|import|from)\b/,
  },
  { type: "STRING", pattern: /(".*?"|'.*?'|`.*?`)/ },
  { type: "NUMBER", pattern: /\b\d+(\.\d+)?\b/ },
  { type: "BOOLEAN", pattern: /\b(true|false)\b/ },
  { type: "NULL", pattern: /\bnull\b/ },
  { type: "IDENTIFIER", pattern: /\b[a-zA-Z_]\w*\b/ },
  { type: "OPERATOR", pattern: /[=+\-/*%&|<>!]/ },
  { type: "PUNCTUATION", pattern: /[(){}[\];,.:]/ },
];

// Simple JavaScript lexer for optimistic updates
// This runs on the main thread to provide immediate, non-semantic highlighting
export const simpleJsLexer = (code) => {
  const tokens = [];
  let position = 0;
  while (position < code.length) {
    let match = null;
    for (const tokenType of tokenTypes) {
      const regex = new RegExp(`^${tokenType.pattern.source}`);
      const result = regex.exec(code.substring(position));
      if (result) {
        match = { type: tokenType.type, value: result[0] };
        break;
      }
    }
    if (match) {
      tokens.push(match);
      position += match.value.length;
    } else {
      tokens.push({ type: "UNKNOWN", value: code[position] });
      position++;
    }
  }
  return tokens;
};
