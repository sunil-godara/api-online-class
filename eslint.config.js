const pluginJs = require('@eslint/js');
const jsonPlugin = require('eslint-plugin-json');
const globals = require('globals');

module.exports = [
  // Configuration for .js and .json files
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs', // Use CommonJS modules (Node.js style)
      ecmaVersion: 'latest', // Support for the latest ECMAScript features
      globals: globals.node // Node.js global variables (e.g., process, __dirname)
    }
  },
  {
    files: ['**/*.json'],
    ...jsonPlugin.configs['recommended']
  },
  // Global settings for the browser if needed
  {
    languageOptions: {
      globals: globals.browser // Include browser globals if your project interacts with the frontend
    }
  },

  // Use ESLint's recommended JS rules
  pluginJs.configs.recommended,

  // Ignore unnecessary folders
  {
    ignores: ['node_modules', 'build', 'dist'] // Ignore build directories and node_modules
  }
];
