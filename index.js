var Emitter = require('events').EventEmitter;
var merge   = require('merge-descriptors');
var compose = require('cobweb-compose');
var co      = require('co');

// Cobweb Class

var Cobweb = module.exports = function Cobweb () {
  var self = this instanceof Cobweb ? this : Object.create(Cobweb.prototype);
  self.initialize.apply(self, arguments);
  return self;
}

Cobweb.utils = {
  merge  : merge,
  compose: compose
}

// Cobweb Prototype

var cobweb = Cobweb.prototype = Object.create(Emitter.prototype);

cobweb.initialize = function (middleware) {
  this.middleware = [];
  if (!middleware) return this;
  if (Array.isArray(middleware)) {
    middleware.forEach(this.include);
  } else this.include(middleware);
}

cobweb.compose = function () {
  var mwf = co(compose(this.middleware));
  return function* (next) {
    yield mwf.bind(this.context);
    yield next;
  }
}

cobweb.include = function (middleware) {
  this.middleware.push(middleware);
  return this;
}

cobweb.process = function (input, callback) {
  if (!Array.isArray(input)) input = [input];
  co(function* () {
    yield input.map(function (item) {
      var mwf = co(compose(this.middleware));
      var ctx = this.createContext(item);
      return mwf.bind(ctx);
    }, this);
    if (callback) callback();
  }).call(this);
}

cobweb.createContext = function (input) {
  var ctx = Object.create(this.context);
  ctx.input = input;
  return ctx;
}

// Cobweb Context

var context = cobweb.context = {};

context.throw = function (err) {
  throw err instanceof Error ? err : new Error(err);
}
