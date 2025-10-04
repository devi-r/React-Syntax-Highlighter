import React from "react";
import Editor from "./Editor";
import "./styles.css";

// Main App component
export default function App() {
  return (
    <div className="app-container">
      <h1>Minimal JS Syntax Highlighting Code Editor</h1>
      <Editor />
    </div>
  );
}
