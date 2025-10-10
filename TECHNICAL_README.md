This document details the architecture, implementation, and code logic 

***

# CodeCraft Editor: Architecture & Implementation Details

This document outlines the architecture, implementation, and core logic of the CodeCraft editor, a custom code editor built from scratch using React.

## 1. High-Level Architecture

The editor is designed around a **two-thread architecture** to ensure the user interface remains fast and responsive at all times, even while processing large amounts of code.

* **UI Thread (Main Thread):**
    * Handles all user interactions (typing, scrolling, clicking).
    * Renders the React components (`Editor`, `CodeRenderer`, `LineNumbers`, etc.).
    * Manages the editor's state (`code`, `tokens`, `ast`).
    * Performs an "optimistic" lightweight analysis for instant feedback.
    * Orchestrates the Web Worker.

* **Worker Thread (Background Thread):**
    * Runs the entire heavy computation pipeline: **Lexer → Parser → Semantic Analyzer**.
    * Receives code from the UI thread, processes it, and sends the results back.
    * This prevents expensive parsing operations from ever blocking the UI, eliminating input lag.



---

## 2. The Analysis Pipeline (Code Logic)

The core "intelligence" of the editor lives in a three-stage pipeline that runs inside the Web Worker.

### 2.1. Lexer (`lexer.js`)

* **Purpose:** To convert the raw code string into a flat array of "tokens." This process is also called tokenization.
* **Implementation:** The lexer uses an ordered array of regular expressions. It iterates through the code string, finding the first pattern that matches at the current position.
* **Key Detail:** The **order of the regex patterns is critical**. More specific patterns (like `COMMENT`) must come before more general ones (like `OPERATOR`) to prevent the `/` in a comment from being incorrectly tokenized as an operator.

### 2.2. Parser (`parser.js`)

* **Purpose:** To convert the flat array of tokens into a hierarchical **Abstract Syntax Tree (AST)** that represents the code's grammatical structure.
* **Implementation:** A **recursive descent parser** is used. It's composed of a series of functions, each responsible for parsing a specific part of the language (e.g., `parseStatement`, `parseExpression`). The `parseExpression` function is designed to handle chained member access (`console.log`) and function calls (`greet()`) recursively, allowing it to understand complex expressions.
* **Key Detail:** The parser is designed to be "failsafe." If it encounters a token it doesn't recognize as the start of a valid statement, it advances past it and continues, preventing the entire process from crashing on a simple syntax error.

### 2.3. Semantic Analyzer (`semanticAnalyzer.js`)

* **Purpose:** To walk the AST and build a "semantic map," adding a layer of contextual understanding that the parser alone doesn't have.
* **Implementation:**
    1.  **Standard Library:** It maintains a definition of the JavaScript environment, including a `Set` of known globals (`setTimeout`, `Object`, `console`) and an object mapping prototypes (`Array`, `String`) to their built-in methods (`.map`, `.join`, `.keys`).
    2.  **Type Inference:** It performs basic type inference. When it sees `const names = [...]`, it records in a scope map that `names` has the type `Array`. It can also infer the return type of common methods (e.g., knowing that `names.map(...)` returns another `Array`).
    3.  **Analysis:** It walks the AST and uses the scope map and standard library to classify tokens. For example, when it sees `names.map`, it looks up `names`, sees it's an `Array`, and checks if `map` is a known method for arrays. If so, it adds the `.map` token to the semantic map with the type `builtin-method`.

---

## 3. The Rendering Pipeline (UI Logic)

The UI is built in React and follows a specific pattern to ensure responsiveness.

### 3.1. The `Editor.js` Component

This is the central orchestrator.

* **State Management:** It holds the `code` string (the source of truth), the `tokens` (for rendering), the `ast` (for debugging), and the `semanticTokenMap`.
* **The `<textarea>` Overlay:** The editor uses a classic technique where an invisible `<textarea>` is layered perfectly on top of the visible code renderer. The user types directly into this `textarea`, giving us a native cursor, text selection, and input handling for free.
* **The Optimistic Update Flow:** This is the core logic for providing instant feedback:
    1.  On every keystroke, `handleCodeChange` fires.
    2.  It immediately updates the `code` state.
    3.  It **immediately** runs the lightweight `simpleJsLexer` on the main thread and updates the `tokens` state. This provides an "optimistic" re-render with basic syntax highlighting, so the typed letter appears instantly with color.
    4.  It then schedules a **debounced** call to the Web Worker (e.g., after 150ms of inactivity).
    5.  When the worker responds with the full, rich semantic analysis, the component updates the `tokens` and `semanticTokenMap` again, triggering a final render with the enhanced highlighting (e.g., built-in methods turning green).

### 3.2. Rendering Components

* **`CodeRenderer.js`:** A simple component that maps over the `tokens` array and renders each token in a `<span>` with a CSS class determined by its lexical type and any semantic information from the map.
* **`LineNumbers.js` & `StatusBar.js`:** Simple presentational components that display UI elements based on the current state.

### 3.3. CSS and Alignment

A significant part of the implementation is the CSS, which is designed to solve the notoriously difficult problem of keeping the invisible `<textarea>` and the visible renderer in perfect pixel-for-pixel alignment. This is achieved by:
* Using a rigid **CSS Grid** layout.
* Enforcing identical `font`, `line-height` (with a fixed pixel value), `padding`, and other typographic properties on both layers.
* Disabling browser-specific features like `font-variant-ligatures` that can cause sub-pixel misalignments.

---

## 4. Key Decisions & Trade-offs

* **Custom Parser vs. Library:** A production editor would use a mature library like `tree-sitter`. For this project, a custom parser was built to demonstrate a deep, fundamental understanding of language processing.
* **Optimistic UI:** The "flicker" of a token changing from a basic color to a semantic color was a deliberate trade-off. We chose this path because the instant feedback on every keystroke provides a better user experience than a consistent lag before highlighting appears. The flicker was then polished into a smooth crossfade using a CSS `transition`.
* **Self-Contained Worker:** To solve CORS and build issues, the final architecture bundles the entire worker logic into a single string inside `Editor.js` and creates it from a `Blob`. This makes the `Editor` component highly portable and independent of server or build configurations.
