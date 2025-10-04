// --- STAGE 3: SEMANTIC ANALYZER (Worker Pipeline) ---
// Final stage of the worker pipeline for semantic highlighting

// Semantic analysis for JavaScript code
// Analyzes AST to provide semantic highlighting information

// Standard library definitions for semantic analysis
export const standardLibrary = {
  globals: new Set([
    "setTimeout",
    "setInterval",
    "clearTimeout",
    "clearInterval",
    "console",
    "fetch",
    "Promise",
    "Object",
  ]),
  prototypes: {
    Array: new Set([
      "map",
      "filter",
      "reduce",
      "forEach",
      "find",
      "findIndex",
      "slice",
      "splice",
      "join",
    ]),
    String: new Set([
      "slice",
      "substring",
      "toUpperCase",
      "toLowerCase",
      "trim",
    ]),
    Object: new Set(["keys", "values", "entries"]),
  },
};

// AST walker utility function
export const walk = (node, visitors) => {
  if (!node) return;
  if (visitors[node.type]) visitors[node.type](node);
  for (const key in node) {
    if (Object.prototype.hasOwnProperty.call(node, key)) {
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach((c) => walk(c, visitors));
      } else if (typeof child === "object" && child !== null) {
        walk(child, visitors);
      }
    }
  }
};

// Type inference helper
const inferTypeFromNode = (node, currentScope) => {
  if (!node) return "unknown";
  if (node.type === "Literal" && typeof node.value === "string")
    return "String";
  if (node.type === "ArrayExpression") return "Array";
  if (node.type === "ObjectExpression") return "Object";

  if (
    node.type === "CallExpression" &&
    node.callee.type === "MemberExpression"
  ) {
    const objectName = node.callee.object.name;
    const methodName = node.callee.property.name;
    const objectInScope = currentScope.variables.get(objectName);

    if (objectInScope && objectInScope.type === "Array") {
      if (["map", "filter", "slice"].includes(methodName)) {
        return "Array";
      }
      if (methodName === "join") {
        return "String";
      }
    }
  }
  return "unknown";
};

// Main semantic analysis function
export const analyzeSemantics = (ast) => {
  const semanticMap = new Map();
  const scope = { variables: new Map() };

  walk(ast, {
    FunctionDeclaration: (node) => {
      if (node.id && node.id.token) {
        semanticMap.set(node.id.token, "function-declaration");
        scope.variables.set(node.id.name, { type: "Function" });
      }
    },
    VariableDeclarator: (node) => {
      if (node.id && node.id.token) {
        const inferredType = inferTypeFromNode(node.init, scope);
        semanticMap.set(node.id.token, "variable-declaration");
        scope.variables.set(node.id.name, { type: inferredType });
      }
    },
    CallExpression: (node) => {
      const callee = node.callee;
      if (callee.type === "Identifier") {
        const funcName = callee.name;
        if (
          standardLibrary.globals.has(funcName) &&
          !scope.variables.has(funcName)
        ) {
          semanticMap.set(callee.token, "builtin-global");
        }
      }
    },
    MemberExpression: (node) => {
      if (node.property && node.property.token) {
        const objectName = node.object.name;
        const propertyName = node.property.name;

        if (standardLibrary.globals.has(objectName)) {
          semanticMap.set(node.property.token, "builtin-method");
          return;
        }

        const scopeVar = scope.variables.get(objectName);
        if (
          scopeVar &&
          standardLibrary.prototypes[scopeVar.type]?.has(propertyName)
        ) {
          semanticMap.set(node.property.token, "builtin-method");
        } else {
          semanticMap.set(node.property.token, "property");
        }
      }
    },
  });

  return semanticMap;
};
