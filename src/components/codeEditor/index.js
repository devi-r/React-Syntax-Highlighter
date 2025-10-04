// Main exports for the code editor components
//
// Architecture Overview:
//
// Editor Pipeline (Immediate):     Lexer → Renderer
// Worker Pipeline (Background):    Lexer → Parser → Semantic Analyzer
//
// The editor uses the lexer for immediate syntax highlighting,
// while the worker performs full parsing and semantic analysis
// for enhanced highlighting with type inference.
export { default as Editor } from "./Editor";
export { default as CodeRenderer } from "./CodeRenderer";
export { default as LineNumbers } from "./LineNumbers";
export { simpleJsLexer, tokenTypes } from "./lexer";
export { simpleJsParser } from "./parser";
export { analyzeSemantics, standardLibrary, walk } from "./semanticAnalyzer";
export { defaultCode } from "./defaultCode";
