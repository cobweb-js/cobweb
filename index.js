var Emitter = require('events').EventEmitter;
var compose = require('cobweb-compose');
var co      = require('co');

// Cobweb Class

var Cobweb = module.exports = function Cobweb () {
  var self = this instanceof Cobweb ? this : Object.create(cobweb);
  self.initialize.apply(self, arguments);
  return self;
}

// Cobweb Prototype

var cobweb = Cobweb.prototype = Object.create(Emitter.prototype);

cobweb.initialize = function (middleware) {
  this.middleware = [];
  if (!middleware) return this;
  if (Array.isArray(middleware)) {
    middleware.forEach(this.include, this);
  } else this.include(middleware);
}

cobweb.compose = function () {
  return compose(this.middleware);
}

cobweb.include = function (middleware) {
  this.middleware.push(middleware);
  return this;
}

cobweb.process = function (input, callback) {
  if (!Array.isArray(input)) input = [input];
  co(function* (self) {
    var contexts = input.map(function (item) {
      return self.createContext(item);
    });
    yield contexts.map(function (ctx) {
      return co(compose(self.middleware)).bind(ctx);
    });
    if (callback) callback.call(self, contexts);
  })(this);
  return this;
}

cobweb.createContext = function (input) {
  var ctx = Object.create(this.context);
  ctx.input  = input;
  ctx.parent = this;
  return ctx;
}

// Cobweb Context

var context = cobweb.context = {};

context.throw = function (err) {
  throw err instanceof Error ? err : new Error(err);
}

context.process = function (input) {
  var parent = this.parent;
  return function (done) {
    parent.process(input, done);
  }
}
