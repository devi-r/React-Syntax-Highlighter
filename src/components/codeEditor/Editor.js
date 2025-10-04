import React, { useState, useRef, useEffect } from "react";
import { simpleJsLexer } from "./lexer";
import { defaultCode } from "./defaultCode";
import CodeRenderer from "./CodeRenderer";
import LineNumbers from "./LineNumbers";
import StatusBar from "./StatusBar";
import workerCode from "./webWorker";

const MAX_LINES = 100; // Define the maximum number of lines allowed

const Editor = () => {
  const [code, setCode] = useState(defaultCode);
  const [tokens, setTokens] = useState([]);
  const [ast, setAst] = useState({ type: "Program", body: [] });
  const [semanticTokenMap, setSemanticTokenMap] = useState(new Map());
  const [isLimitReached, setIsLimitReached] = useState(false);

  const workerRef = useRef(null);
  const textareaRef = useRef(null);
  const debounceRef = useRef(null);
  const rendererRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const lineCount = code.split("\n").length;

  useEffect(() => {
    // Create a Blob from the worker code string
    const blob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    workerRef.current.onmessage = (event) => {
      const { status, payload, error } = event.data;
      if (status === "success") {
        const { tokens, ast, semanticMapArray } = payload;
        setTokens(tokens);
        setAst(ast);
        setSemanticTokenMap(new Map(semanticMapArray));
      } else {
        console.error("Worker Error:", error);
      }
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  // Effect for initial analysis and code changes
  useEffect(() => {
    if (workerRef.current) {
      setTokens(simpleJsLexer(code));
      workerRef.current.postMessage({ code });
    }
  }, [code]);

  // Effect to check line count limit whenever code changes
  useEffect(() => {
    const currentLineCount = (code.match(/\n/g) || []).length + 1;
    setIsLimitReached(currentLineCount >= MAX_LINES);
  }, [code]);

  const handleCodeChange = (e) => {
    let newCode = e.target.value;

    // Enforce the maxLines limit
    const currentLineCount = (newCode.match(/\n/g) || []).length + 1;
    if (currentLineCount > MAX_LINES) {
      newCode = newCode.split("\n").slice(0, MAX_LINES).join("\n");
    }

    setCode(newCode);

    // Optimistic update for instant feedback
    setTokens(simpleJsLexer(newCode));
    setSemanticTokenMap(new Map());

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (workerRef.current) {
        workerRef.current.postMessage({ code: newCode });
      }
    }, 150);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (rendererRef.current) {
      rendererRef.current.scrollTop = scrollTop;
      rendererRef.current.scrollLeft = scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-main">
        <LineNumbers lineCount={lineCount} ref={lineNumbersRef} />
        <div className="editor-content-wrapper">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            onScroll={handleScroll}
            className="code-input"
            spellCheck="false"
          />
          <CodeRenderer
            ref={rendererRef}
            tokens={tokens}
            semanticTokenMap={semanticTokenMap}
            code={code}
          />
        </div>
      </div>
      <div className="ast-viewer">
        <h3>Abstract Syntax Tree (AST)</h3>
        <pre>{JSON.stringify(ast, null, 2)}</pre>
      </div>
      <StatusBar
        lineCount={lineCount}
        maxLines={MAX_LINES}
        isLimitReached={isLimitReached}
      />
    </div>
  );
};

export default Editor;
