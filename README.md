# React Syntax Highlighter

This is a web-based code editor with syntax highlighting built from scratch using React, with its own lexer, parser, and semantic analysis engine running in a background web worker to keep the UI smooth.

The editor was developed through an incremental process, addressing complex challenges at each stage to build a basic responsive tool with limited functionalities.

## Demo

**Live Preview:** [https://react-syntax-highlighter.onrender.com/](https://react-syntax-highlighter.onrender.com/)

## The Journey: An Evolutionary Build

The editor was built incrementally, with each new feature revealing deeper challenges and requiring more sophisticated solutions. This journey reflects a real-world process of iterative development and refinement.

### V1: The Foundation - A Simple Syntax Highlighter

The initial version used a simple lexer (tokenizer) with regular expressions to convert a code string into an array of tokens. A React component then rendered these tokens as styled `<span>` elements. A key learning was that the renderer's requirements are as important as the parser's; every character, including whitespace, must be tokenized to maintain the code's visual structure.

### V2: Adding Intelligence - The Parser & AST

To understand the code's grammatical structure, a recursive descent parser was introduced. This component transforms the flat list of tokens into a hierarchical Abstract Syntax Tree (AST), enabling the editor to understand concepts like "Variable Declaration." A primary challenge involved making the parser robust enough to handle syntax errors without getting stuck in infinite loops.

### V3: From Syntax to Semantics

The AST enabled semantic highlighting. A "Semantic Analyzer" stage was added to walk the AST and understand the role of each token (e.g., "this is a function declaration"). This allowed for more meaningful coloring, such as distinguishing function names from variables.

### V4: Achieving a Professional Feel - UI Polish

This phase focused on UI polish. Line numbers and a status bar were added. The core challenge was achieving perfect pixel-for-pixel alignment between the invisible `<textarea>` and the visible code renderer. This was solved through specific CSS fixes, including moving from Flexbox to a more rigid Grid layout and normalizing typography to combat sub-pixel rendering differences in browsers.

### V5: Building the "Standard Library" - Advanced Type Inference

To highlight built-in methods like `.map` or `Object.keys`, the semantic analyzer was expanded with a concept of a runtime environment. This included a simple type inference engine and a "standard library" of known globals and prototypes. A key challenge was teaching the analyzer about the return types of common functions (e.g., knowing that `Array.prototype.map` returns another array) to enable chained method highlighting.

### V6: Architecture for Scale - The Web Worker

To prevent UI lag on large files, the entire **Lexer → Parser → Semantic Analyzer** pipeline was moved into a Web Worker. The main UI thread is now only responsible for rendering. This is a fundamental pattern for building responsive, high-performance applications and demonstrates an understanding of browser concurrency.

### V7: The Final Polish - The UX of Performance

The Web Worker introduced a slight highlighting delay. To solve this, a dual-pipeline "optimistic update" architecture was implemented:

- **Instant Feedback**: On every keystroke, a lightweight lexer runs on the main thread for an immediate, basic re-render.
- **Progressive Enhancement**: The full analysis runs in the background worker. When it completes, it sends the rich semantic data back, triggering a second render with enhanced highlighting.

The challenge with this approach was a visual "flicker" between the two renders. The solution was to use a subtle CSS transition to turn the jarring blink into a smooth crossfade, demonstrating a focus on perceived performance and a mature approach to UX trade-offs.

## Final Architecture

### UI Thread:

- Manages code state and renders all UI components
- Performs an optimistic update on code change by running a lightweight lexer for an instant re-render
- Sends the new code to the worker (debounced)
- Listens for results from the worker to trigger a final, semantically rich re-render

### Worker Thread:

- Listens for code messages
- Runs the full pipeline: **Lexer → Parser → Semantic Analyzer**
- Posts the comprehensive results back to the main thread

## Enhancements (WIP)

- **Virtualization**: Integrate a library like `react-window` to render only the visible lines, allowing the editor to handle files with hundreds of thousands of lines

## Additiona Notes

- This application is configured as a **remote microfrontend** setup using CRACO (Create React App Configuration Override). The microfrontend architecture allows this to be consumed by other applications while maintaining its own development and deployment lifecycle.

## Author

- **[Devi R](https://www.linkedin.com/in/devi-r-06bb94a7)**
