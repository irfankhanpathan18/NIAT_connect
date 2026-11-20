// Vercel Serverless Function entry point
// Routes all /api/* requests to the Express backend application

const app = require('../server/index.js');

module.exports = app;
