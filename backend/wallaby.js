module.exports = function (wallaby) {
  return {
    files: [
      // Archivos fuente
      'config/**/*.js',
      'controllers/**/*.js',
      'models/**/*.js',
      'routes/**/*.js',
      'middlewares/**/*.js',
      'app.js',
      'package.json'
    ],
    tests: [
      // Tests
      'tests/**/*.test.js'
    ],
    env: {
      type: 'node', // Entorno Node.js
      runner: 'node'
    },
    testFramework: 'jest', // Usar Jest (instálalo si no lo tienes)
    setup: function () {
      // Configuración inicial (ej: mock de base de datos)
    }
  };
};
