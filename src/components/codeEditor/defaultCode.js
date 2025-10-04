// Default code example for the syntax highlighter editor
export const defaultCode = `/**
 * Welcome to the Syntax Highlighter!
 * This editor is built from the ground up with its 
 * own lexer, parser, and semantic analysis engine 
 * running in a background web worker to keep the UI smooth.
 */

const user = { id: 1 }; // Note: Object parsing is not supported yet
const userKeys = Object.keys(user);

const names = ["Alice", "Bob"];
const greetings = names.map(function(name) {
  return \`Hello, \${name}!\`;
});

setTimeout(function() {
  // .log and .join are green due to type inference!
  console.log(greetings.join(", "));
}, 500);

// --- FEATURES SUPPORTED ---
// Basic JS syntax (const, function)
// Semantic highlighting (functions vs. variables)
// Type inference for Arrays (notice .map is green)
// Built-in globals (console, setTimeout, Object)
// A 100-line limit to ensure performance.

// Limitations: No arrow functions, complex expressions, 
// or object literals supported yet and a lot of other things.

`;
