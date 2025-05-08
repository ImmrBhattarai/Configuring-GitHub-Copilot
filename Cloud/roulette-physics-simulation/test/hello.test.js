{
  "name": "roulette-physics-simulation",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "mocha"
  },
  "dependencies": {},
  "devDependencies": {
    "mocha": "^10.0.0",
    "chai": "^4.0.0"
  }
} 

const chai = require('chai');
const assert = chai.assert;

describe('Hello World Test', () => {
  it('should return true when 1 + 1 equals 2', () => {
    assert.strictEqual(1 + 1, 2);
  });
});