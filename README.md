<img src="https://dl.dropboxusercontent.com/s/1e2t69ol6x55cef/cobweb-logo.png" alt="cobweb logo" width="64px" />

cobweb
======

Cobweb is a node.js web auditing and analysis framework inspired by [Koa](https://github.com/koajs/koa). It makes use of ES6 generators via [co](https://github.com/visionmedia/co) to handle control flow. The core codebase only contains minimal functionality to handle the queuing of URIs. Common functionality such as scraping web pages and querying data is left to middleware libraries. It is up to the user to decide which middleware is relevant to the application. If you prefer to only define a single dependency for common middleware you may use [cobweb-common](https://github.com/dbalcomb/cobweb-common).

## Installation

```
$ npm install cobweb
```

To use Cobweb you must be running __node 0.11.x__ or higher for generator support, and must run node(1) with the `--harmony` flag.

## Example

```js
var web = require('cobweb');
var app = web();

app.use(function* (next) {
  console.log('Queued: %s', this.uri);
  yield next;
  console.log('Finished: %s', this.uri);
});

app.use(function* () {
  // do something here
});

app.queue('http://www.google.com');
```

## Running tests

...

## List of middleware

- [accept](https://github.com/dbalcomb/cobweb-accept) - match URI to given pattern and run a subset of middleware

# License

MIT
