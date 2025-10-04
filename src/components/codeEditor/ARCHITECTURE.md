# Code Editor Architecture

## Two-Stage Pipeline System

### 1. Editor Pipeline (Immediate Response)

```
User Types Code
      ↓
   Lexer (lexer.js)
      ↓
   Renderer (CodeRenderer.js)
      ↓
  Syntax Highlighted Display
```

### 2. Worker Pipeline (Background Analysis)

```
User Types Code
      ↓
   Lexer (lexer.js)
      ↓
   Parser (parser.js)
      ↓
Semantic Analyzer (semanticAnalyzer.js)
      ↓
Enhanced Semantic Highlighting
```

## Data Flow

1. **User types code** → Editor component
2. **Immediate highlighting** → Lexer → Renderer (instant feedback)
3. **Background analysis** → Worker → Lexer → Parser → Semantic Analyzer
4. **Enhanced highlighting** → Merge semantic data with tokens → Renderer
