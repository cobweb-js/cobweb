<img src="https://dl.dropboxusercontent.com/s/1e2t69ol6x55cef/cobweb-logo.png" alt="cobweb logo" width="64px" />

cobweb
======

Cobweb is a node.js web auditing and analysis framework inspired by [Koa](https://github.com/koajs/koa). It makes use of ES6 generators via [co](https://github.com/visionmedia/co) to handle control flow. The core codebase only contains minimal functionality to handle composing middleware and processing inputs. Common functionality such as scraping web pages and querying data is left to middleware libraries. It is up to the user to decide which middleware is relevant to the application. If you prefer to only define a single dependency for common middleware you may use [cobweb-common](https://github.com/dbalcomb/cobweb-common).

## Installation

```
$ npm install cobweb
```

To use Cobweb you must be running __node 0.11.x__ or higher for generator support, and must run node(1) with the `--harmony` flag.

## Example

```js
var app = require('cobweb')();

app.include(function* (next) {
  console.log('Processing: %s', this.input);
  yield next;
  console.log('Finished: %s', this.input);
});

app.include(function* () {
  // do something here
});

app.process('http://www.google.com');
```

## List of middleware

- [accept](https://github.com/dbalcomb/cobweb-accept) - match URI to given pattern and run a subset of middleware
- [queue](https://github.com/dbalcomb/cobweb-queue) - queue multiple inputs with limitations on concurrency

# License

MIT
