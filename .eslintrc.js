module.exports = {
  // start with google standard style
  //     https://github.com/google/eslint-config-google/blob/master/index.js
  "extends": ["eslint:recommended", "google"],
  "env": {
    "node": true,
    "es6": true
  },
  "rules": {
    // 2 == error, 1 == warning, 0 == off
    "eqeqeq": 2,
    "indent": [2, 2, {
      "SwitchCase": 1,
      "VariableDeclarator": 2,
      "CallExpression": {"arguments": 2},
      "MemberExpression": 1,
      "FunctionExpression": {"body": 1, "parameters": 2},
      "ignoredNodes": [
        "ConditionalExpression > :matches(.consequent, .alternate)",
        "VariableDeclarator > ArrowFunctionExpression > :expression.body",
        "CallExpression > ArrowFunctionExpression > :expression.body"
      ]
    }],
    "max-len": [2, 100, {
      "ignoreComments": true,
      "ignoreUrls": true,
      "tabWidth": 2
    }],
    "no-empty": [2, {
      "allowEmptyCatch": true
    }],
    "no-implicit-coercion": [2, {
      "boolean": false,
      "number": true,
      "string": true
    }],
    "no-unused-expressions": [2, {
      "allowShortCircuit": true,
      "allowTernary": false
    }],
    "no-unused-vars": [2, {
      "vars": "all",
      "args": "after-used",
      "argsIgnorePattern": "(^reject$|^_$)",
      "varsIgnorePattern": "(^_$)"
    }],
    "strict": [2, "global"],
    "prefer-const": 2,
    "curly": [2, "multi-line"],
    "comma-dangle": [2, {
      "arrays": "always-multiline",
      "objects": "always-multiline",
      "imports": "never",
      "exports": "never",
      "functions": "never"
    }],

    // Disabled rules
    "require-jsdoc": 0,
    "valid-jsdoc": 0,
    "arrow-parens": 0,
  },
  "parserOptions": {
    "ecmaVersion": 6,
    "ecmaFeatures": {
      "globalReturn": true,
      "jsx": false,
      "experimentalObjectRestSpread": false
    },
    "sourceType": "script"
  }
}
