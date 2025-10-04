// --- STAGE 2: PARSER (AST Generation) ---
// Used by the worker for semantic analysis pipeline

// JavaScript parser for creating Abstract Syntax Trees (AST)
// A recursive descent parser for expressions and statements

export const simpleJsParser = (tokens) => {
  let current = 0;

  // --- Parser Helpers ---
  const peek = () => tokens[current];
  const isAtEnd = () => !peek();
  const advance = () => {
    if (!isAtEnd()) current++;
    return tokens[current - 1];
  };

  // --- Forward declarations for recursive parsing ---
  let parseExpression;

  // --- Expression Parsing ---
  const parsePrimary = () => {
    const token = peek();
    if (!token) return null;

    if (token.type === "NUMBER") {
      advance();
      return { type: "Literal", value: parseFloat(token.value) };
    }
    if (token.type === "STRING") {
      advance();
      return { type: "Literal", value: token.value.slice(1, -1) };
    }
    if (token.type === "IDENTIFIER") {
      const idToken = advance();
      return { type: "Identifier", name: idToken.value, token: idToken };
    }
    if (token.type === "PUNCTUATION" && token.value === "[") {
      advance(); // consume '['
      const elements = [];
      if (peek() && peek().value !== "]") {
        while (!isAtEnd()) {
          elements.push(parseExpression());
          if (peek() && peek().value === ",") {
            advance(); // Consume comma
          } else {
            break;
          }
        }
      }
      if (peek() && peek().value === "]") {
        advance(); // consume ']'
      }
      return { type: "ArrayExpression", elements };
    }
    if (token.type === "KEYWORD" && token.value === "function") {
      return parseAnonymousFunctionExpression();
    }
    return null;
  };

  const parseCallExpression = (callee) => {
    advance(); // consume '('
    const args = [];
    if (peek() && peek().value !== ")") {
      while (!isAtEnd()) {
        args.push(parseExpression());
        if (peek() && peek().value === ",") {
          advance();
        } else {
          break;
        }
      }
    }
    if (peek() && peek().value === ")") {
      advance(); // consume ')'
    }
    return { type: "CallExpression", callee, arguments: args };
  };

  const parseMemberExpression = (object) => {
    advance(); // consume '.'
    const propertyToken = advance();
    const property = {
      type: "Identifier",
      name: propertyToken.value,
      token: propertyToken,
    };
    return { type: "MemberExpression", object, property };
  };

  parseExpression = () => {
    let expr = parsePrimary();
    while (expr && !isAtEnd()) {
      if (peek().value === "(") {
        expr = parseCallExpression(expr);
      } else if (peek().value === ".") {
        expr = parseMemberExpression(expr);
      } else {
        break;
      }
    }
    return expr;
  };

  const parseAnonymousFunctionExpression = () => {
    advance(); // consume 'function'
    advance(); // consume '('
    advance(); // consume ')'
    const body = parseBlockStatement();
    return { type: "FunctionExpression", id: null, params: [], body };
  };

  // --- Statement Parsing ---
  const parseBlockStatement = () => {
    advance();
    const body = [];
    while (peek() && peek().value !== "}") {
      const statement = parseStatement();
      if (statement) body.push(statement);
      if (isAtEnd()) break;
    }
    if (peek() && peek().value === "}") advance();
    return { type: "BlockStatement", body };
  };

  const parseStatement = () => {
    const token = peek();
    if (!token) return null;

    if (token.type === "KEYWORD" && token.value === "function") {
      advance();
      const nameToken = advance();
      advance(); // (
      advance(); // )
      const body = parseBlockStatement();
      return {
        type: "FunctionDeclaration",
        id: { type: "Identifier", name: nameToken.value, token: nameToken },
        params: [],
        body: body,
      };
    }
    if (
      token.type === "KEYWORD" &&
      (token.value === "const" || token.value === "let")
    ) {
      advance();
      const declaration = {
        type: "VariableDeclaration",
        kind: token.value,
        declarations: [],
      };
      const nameToken = advance();
      const declarator = {
        type: "VariableDeclarator",
        id: { type: "Identifier", name: nameToken.value, token: nameToken },
        init: null,
      };
      if (peek() && peek().type === "OPERATOR" && peek().value === "=") {
        advance();
        declarator.init = parseExpression();
      }
      declaration.declarations.push(declarator);
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";")
        advance();
      return declaration;
    }

    const expression = parseExpression();
    if (expression) {
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
        advance();
      }
      return { type: "ExpressionStatement", expression };
    }

    if (!isAtEnd()) advance(); // Failsafe
    return null;
  };

  const ast = { type: "Program", body: [] };
  while (!isAtEnd()) {
    const statement = parseStatement();
    if (statement) ast.body.push(statement);
  }
  return ast;
};
