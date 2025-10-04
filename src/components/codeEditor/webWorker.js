/* eslint-disable no-restricted-globals */
// Web Worker: Coordinates the Worker Pipeline (Lexer → Parser → Semantic Analyzer)
// The 'self' global is the correct way to reference the worker's global scope.

// Worker message handler

// The entire logic of the lexer, parser, and semantic analyzer
// is bundled into single string.

const workerCode = `
/* eslint-disable no-restricted-globals */

// --- All worker logic is now self-contained ---

// --- STAGE 1: LEXER (TOKENIZER) ---
const tokenTypes = [
  { type: 'WHITESPACE', pattern: /\\s+/ },
  { type: 'COMMENT', pattern: /\\/\\*[\\s\\S]*?\\*\\// },
  { type: 'COMMENT', pattern: /\\/\\/.*/ },
  { type: 'KEYWORD', pattern: /\\b(const|let|var|function|return|if|else|for|while|import|from)\\b/ },
  { type: 'STRING', pattern: /(".*?"|'.*?'|\`.*?\`)/ },
  { type: 'NUMBER', pattern: /\\b\\d+(\\.\\d+)?\\b/ },
  { type: 'BOOLEAN', pattern: /\\b(true|false)\\b/ },
  { type: 'NULL', pattern: /\\bnull\\b/ },
  { type: 'IDENTIFIER', pattern: /\\b[a-zA-Z_]\\w*\\b/ },
  { type: 'OPERATOR', pattern: /[=+\\-/*%&|<>!]/ },
  { type: 'PUNCTUATION', pattern: /[\\(\\)\\{\\}\\[\\];,\\.:]/ },
];

const simpleJsLexer = (code) => {
  const tokens = [];
  let position = 0;
  while (position < code.length) {
    let match = null;
    for (const tokenType of tokenTypes) {
      const regex = new RegExp(\`^\${tokenType.pattern.source}\`);
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
      tokens.push({ type: 'UNKNOWN', value: code[position] });
      position++;
    }
  }
  return tokens;
};

// --- STAGE 2: PARSER ---
const simpleJsParser = (tokens) => {
    let current = 0;
    const peek = () => tokens[current];
    const isAtEnd = () => !peek();
    const advance = () => {
        if (!isAtEnd()) current++;
        return tokens[current - 1];
    };
    let parseExpression;
    const parsePrimary = () => {
        const token = peek();
        if (!token) return null;
        if (token.type === 'NUMBER') {
            advance();
            return { type: 'Literal', value: parseFloat(token.value) };
        }
        if (token.type === 'STRING') {
            advance();
            return { type: 'Literal', value: token.value.slice(1, -1) };
        }
        if (token.type === 'IDENTIFIER') {
            const idToken = advance();
            return { type: 'Identifier', name: idToken.value, token: idToken };
        }
        if (token.type === 'PUNCTUATION' && token.value === '[') {
            advance();
            const elements = [];
            if (peek() && peek().value !== ']') {
                while (!isAtEnd()) {
                    elements.push(parseExpression());
                    if (peek() && peek().value === ',') {
                        advance();
                    } else {
                        break;
                    }
                }
            }
            if (peek() && peek().value === ']') {
                advance();
            }
            return { type: 'ArrayExpression', elements };
        }
         if (token.type === 'KEYWORD' && token.value === 'function') {
            return parseAnonymousFunctionExpression();
        }
        return null;
    };
    const parseCallExpression = (callee) => {
        advance();
        const args = [];
        if (peek() && peek().value !== ')') {
            while (!isAtEnd()) {
                args.push(parseExpression());
                if (peek() && peek().value === ',') {
                    advance();
                } else {
                    break;
                }
            }
        }
        if (peek() && peek().value === ')') {
            advance();
        }
        return { type: 'CallExpression', callee, arguments: args };
    };
    const parseMemberExpression = (object) => {
        advance();
        const propertyToken = advance();
        const property = { type: 'Identifier', name: propertyToken.value, token: propertyToken };
        return { type: 'MemberExpression', object, property };
    };
    parseExpression = () => {
        let expr = parsePrimary();
        while (expr && !isAtEnd()) {
            if (peek().value === '(') {
                expr = parseCallExpression(expr);
            } else if (peek().value === '.') {
                expr = parseMemberExpression(expr);
            } else {
                break;
            }
        }
        return expr;
    };
    const parseBlockStatement = () => {
        advance();
        const body = [];
        while (peek() && peek().value !== '}') {
            const statement = parseStatement();
            if (statement) body.push(statement);
            if (isAtEnd()) break;
        }
        if (peek() && peek().value === '}') advance();
        return { type: 'BlockStatement', body };
    };
    const parseAnonymousFunctionExpression = () => {
        advance();
        advance();
        advance();
        const body = parseBlockStatement();
        return { type: 'FunctionExpression', id: null, params: [], body };
    };
    const parseStatement = () => {
        const token = peek();
        if (!token) return null;
        if (token.type === 'KEYWORD' && token.value === 'function') {
            advance();
            const nameToken = advance();
            advance();
            advance();
            const body = parseBlockStatement();
            return { type: 'FunctionDeclaration', id: { type: 'Identifier', name: nameToken.value, token: nameToken }, params: [], body: body };
        }
        if (token.type === 'KEYWORD' && (token.value === 'const' || token.value === 'let')) {
            advance();
            const declaration = { type: 'VariableDeclaration', kind: token.value, declarations: [] };
            const nameToken = advance();
            const declarator = { type: 'VariableDeclarator', id: { type: 'Identifier', name: nameToken.value, token: nameToken }, init: null };
            if (peek() && peek().type === 'OPERATOR' && peek().value === '=') {
                advance();
                declarator.init = parseExpression();
            }
            declaration.declarations.push(declarator);
            if (peek() && peek().type === 'PUNCTUATION' && peek().value === ';') advance();
            return declaration;
        }
        const expression = parseExpression();
        if (expression) {
            if (peek() && peek().type === 'PUNCTUATION' && peek().value === ';') {
                advance();
            }
            return { type: 'ExpressionStatement', expression };
        }
        if (!isAtEnd()) advance();
        return null;
    };
    const ast = { type: 'Program', body: [] };
    while (!isAtEnd()) {
        const statement = parseStatement();
        if (statement) ast.body.push(statement);
    }
    return ast;
};

// --- STAGE 3: SEMANTIC ANALYSIS ---
const standardLibrary = {
  globals: new Set(['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'console', 'fetch', 'Promise', 'Object']),
  prototypes: {
    Array: new Set(['map', 'filter', 'reduce', 'forEach', 'find', 'findIndex', 'slice', 'splice', 'join']),
    String: new Set(['slice', 'substring', 'toUpperCase', 'toLowerCase', 'trim']),
    Object: new Set(['keys', 'values', 'entries']),
  }
};
const walk = (node, visitors) => {
    if (!node) return;
    if (visitors[node.type]) visitors[node.type](node);
    for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
            const child = node[key];
            if (Array.isArray(child)) {
                child.forEach(c => walk(c, visitors));
            } else if (typeof child === 'object' && child !== null) {
                walk(child, visitors);
            }
        }
    }
};
const analyzeSemantics = (ast) => {
    const semanticMap = new Map();
    const scope = { variables: new Map() };
    const inferTypeFromNode = (node, currentScope) => {
        if (!node) return 'unknown';
        if (node.type === 'Literal' && typeof node.value === 'string') return 'String';
        if (node.type === 'ArrayExpression') return 'Array';
        if (node.type === 'ObjectExpression') return 'Object';
        if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
            const objectName = node.callee.object.name;
            const methodName = node.callee.property.name;
            const objectInScope = currentScope.variables.get(objectName);
            if (objectInScope && objectInScope.type === 'Array') {
                if (['map', 'filter', 'slice'].includes(methodName)) {
                    return 'Array';
                }
                if (methodName === 'join') {
                    return 'String';
                }
            }
        }
        return 'unknown';
    };
    walk(ast, {
        FunctionDeclaration: (node) => {
            if (node.id && node.id.token) {
                semanticMap.set(node.id.token, 'function-declaration');
                scope.variables.set(node.id.name, { type: 'Function' });
            }
        },
        VariableDeclarator: (node) => {
            if (node.id && node.id.token) {
                const inferredType = inferTypeFromNode(node.init, scope);
                semanticMap.set(node.id.token, 'variable-declaration');
                scope.variables.set(node.id.name, { type: inferredType });
            }
        },
        CallExpression: (node) => {
            const callee = node.callee;
            if (callee.type === 'Identifier') {
                const funcName = callee.name;
                if (standardLibrary.globals.has(funcName) && !scope.variables.has(funcName)) {
                    semanticMap.set(callee.token, 'builtin-global');
                }
            }
        },
        MemberExpression: (node) => {
            if (node.property && node.property.token) {
                const objectName = node.object.name; 
                const propertyName = node.property.name;
                if (standardLibrary.globals.has(objectName)) {
                    semanticMap.set(node.property.token, 'builtin-method');
                    return;
                }
                const scopeVar = scope.variables.get(objectName);
                if (scopeVar && standardLibrary.prototypes[scopeVar.type]?.has(propertyName)) {
                    semanticMap.set(node.property.token, 'builtin-method');
                } else {
                    semanticMap.set(node.property.token, 'property');
                }
            }
        }
    });
    return semanticMap;
};

// --- Worker Message Handler ---
self.onmessage = (event) => {
  const { code } = event.data;
  try {
    const tokens = simpleJsLexer(code);
    const ast = simpleJsParser(
      tokens.filter((t) => t.type !== "COMMENT" && t.type !== "WHITESPACE")
    );
    const semanticTokenMap = analyzeSemantics(ast);
    const semanticMapArray = Array.from(semanticTokenMap.entries());
    self.postMessage({
      status: "success",
      payload: { tokens, ast, semanticMapArray },
    });
  } catch (e) {
    self.postMessage({ status: "error", error: e.message });
  }
};
`;

export default workerCode;
