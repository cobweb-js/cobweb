Guide
=====

The primary purpose of this document is to demonstrate the intended use of the Cobweb framework. Included below are some common examples and an explanation as to what they do and how they work. Please note that for the same of clarity the examples below omit the require statements for cobweb modules.

Please not that not all modules have been published to NPM yet and so you may need to manually use `npm link` to install the modules.

## Writing Simple Middleware

Cobweb middleware is essentially a cascade of generator functions that manually pass control flow "downstream" from one to the next until it either reaches the end or one of the functions does not yield control. This concept is incredibly powerful as it allows these functions to yield at any point rather than only pass control at the end.

The order in which each middleware function is added to the application is important as it determines the order in which control will flow. When the first middleware function is executed it is passed the second as an argument and can yield control to it at any point in time. This is a synchronous action and so blocks until control is passed back "upstream".

Consider the example below:

```js
app.use(function* (next) {
  console.log('>> one');
  yield next;
  console.log('<< one');
});

app.use(function* (next) {
  console.log('>> two');
  yield next;
  console.log('<< two');
});

app.use(function* (next) {
  console.log('>> three');
  yield next;
  console.log('<< three');
});
```

When the first middleware function executes it prints out a message and then yields execution to the next middleware function which then also prints out a message and yields execution to the third.

What the third function does is yield to a blank noop function. The final function in the stack will always be a noop and this allows each individual middleware function to work at any point in the stack without having to test for the next item in case it is placed on the end.

What happens next is that when the end of the third function is reached the application unravels back "upstream" and so allows the second function to finish executing and then the first.

The output for this example is included below:

```
>> one
>> two
>> three
<< three
<< two
<< one
```

Middleware functions do not always have to yield control to the next function and there are many times when this would be the preferred design. The next functions in the stack would simply be ignored.

## Writing Advanced Middleware

The information covered in the previous section also applies to the module that inspired the design of this framework: [Koa](https://github.com/koajs/koa). However what this framework does differently is that it also supports a different type of middleware.

Rather than only accepting functions it also accepts an object with a compose function that should return a generator function when executed.

Consider the example below:

```js
var one = cobweb();
one.use(function* (next, app1) {
  console.log('>> one');
  yield next;
  console.log('<< one');
});

var two = cobweb();
two.use(function* (next, app2) {
  console.log('>> two');
  yield next;
  console.log('<< two');
});

one.use(two);
```

Both `one` and `two` are distinctly separate entities except for the very last line which embeds the second in to the first. Executing the middleware of the second runs separately from the first as would be expected but when executing the middleware of the first it includes all of the middleware of the second in to the first at the point which it was added. The inner `this` context is also passed through the middleware.

The point of all of this is to be able to fully utilise subclasses of Cobweb. Consider the two examples below:

```js
var app = limit(10);
app.use(function* (next) {
  yield next;
});
```

In this first example `limit` is a subclass of `cobweb` and provides all of the same functionality. The only difference is that it starts off with an included middleware function that only allows the following middleware to execute `10` at a time.

```js
var app = cobweb();
app.use(limit(10));
app.use(function* (next) {
  yield next;
});
```

In this second example `limit` is still a subclass of `cobweb` however it is being used more like a traditional middleware function. At first there does not appear to be any benefit of using either of the methods over the other. However there are some modules that use this advanced type of middleware to do something more complex.

## Making a Request

The following examples utilise `request`, one of the core components of any Cobweb script.

```js
var app = request()
app.use(function* (next) {
  console.log('success');
  yield next;
});
```

In the above example the `request` function returns a subclass of `cobweb` instead of a standard generator function. The result would be the same as if the request was used like a generator inside a `cobweb` object. The difference here is that internally the system yields execution to a HTTP request and is allowed to continue once the request has come back.

```js
var app = cobweb();
app.use(function* (next) {
  console.log('done');
  yield next;
});

var req = request();
req.use(function* (next) {
  console.log('success');
  yield next;
});

app.use(req);
```

The difference with this module is that any middleware attached to the request object only runs if the HTTP request successfully returned a HTML document. Any middleware outside of the request runs as normally. This was a design decision made to ensure that any data extraction from the website would only run if there was data to actually extract.

## Distributed Systems

The following example demonstrates a distributed client-server system. The intention is to run the server and multiple clients on the same system.

### Server
```js
var store = nedb('default.db');

var app = report({
  'from': '30daysAgo',
  'to'  : 'today',
  'data': ['visits', 'pageviews']
});

app.use([
  cache(),
  server({ 'port': 3000 }),
  server.delegate('default'),
  store,
  spider()
]);

app.on('drain', function () {
  store.export('csv', 'output.csv', [
    'uri',
    'status'
  ]);
});

app.connect({
  'profile' : '00000000',
  'username': 'joe.bloggs@email.tld',
  'password': 'iAmJoEbLoGgS'
});
```

The first part of this script is the store. Using the NeDB module we can specify a file on disk that can store any information that we can later extract.

The second part is setting up a report. The report is an advanced middleware module that specifies what data that you want to extract from Google Analytics. See the Google Analytics API documentation to see what metrics are supported.

The cache module being used allows the system to check if a URL has been handled before and so will not repeat the processing by not yielding any further.

The server module being used sets up a server on port `3000` and allows the system to send messages to connected clients.

The `server.delegate` method tells the system to send any data to the next available client and wait for a reply before continuing. The client should return any data that it has extracted.

Including the store as middleware allows the system to save the data that has been returned from the client.

Finally the spider module adds more URLs to be processed by iterating over the links extracted on the client script.

The drain event fires when the script has finished processing and so at that point it asks the store to write out a CSV file of the data it has found so far.

The connect method is part of the report API and requires a Google Analytics profile ID, username and password that are valid. Once it has connected it then adds all the found URLs to be processed.

### Client
```js
var app = client({
  'channel': 'default',
  'host'   : 'localhost',
  'port'   : 3000
});

app.use([
  request({ 'max': 5 }, [
    cheerio(),
    extract([
      'links',
      'title',
      'images',
      'description',
      'dc.*'
    ])
  ])
]);
```

The client code is much simpler than the server. Firstly it is set up to connect to the server running on the `localhost` on port `3000`.

The middleware being used are request, cheerio and extract. Request sends a HTTP request to the server with a limit of 5 concurrent connections. This request then returns the page body which is picked up by cheerio which provides a jQuery-like API.

Extract uses the cheerio API in order to get information from the page. In this case it gets the page title, images, links, description and all of the dublin-core metdata that it has defined.

## Multiple clients

### Server

```js
var store1 = nedb('site.db');
var store2 = nedb('links.db');

var app = report({
  'from': '30daysAgo',
  'to'  : 'today',
  'data': ['visits', 'pageviews']
});

app.use([
  cache(),
  server({ 'port': 3000 }),
  accept('[http|https]://[www.]website.com/{?query}{#fragment}', [
    server.delegate('client1'),
    store1,
    spider()
  ]),
  accept('[http|https]://subdomain.website.com/{?query}{#fragment}', [
    server.delegate('client2'),
    store1,
    spider()
  ]),
  accept('{*}', [
    server.delegate('client3'),
    store2
  ])
]);

app.on('drain', function () {
  store.export('csv', 'output.csv', ['uri', 'status', 'referrer', 'redirect', 'visits', 'pageviews' ]);
});

app.connect({
  'profile' : '00000000',
  'username': 'joe.bloggs@email.tld',
  'password': 'iAmJoEbLoGgS'
});
```

### Client 1

```js
var app = client({
  'channel': 'client1',
  'host'   : 'localhost',
  'port'   : 3000
});

app.use([
  request({ 'max': 3 }, [
    cheerio(),
    extract([
      'title',
      'description',
      'links'
    ])
  ])
]);
```

### Client 2

```js
var app = client({
  'channel': 'client2',
  'host'   : 'localhost',
  'port'   : 3000
});

app.use([
  request({ 'max': 3 }, [
    cheerio(),
    extract([
      'title',
      'description',
      'links'
    ])
  ])
]);
```

### Client 3

```js
var app = client({
  'channel': 'client1',
  'host'   : 'localhost',
  'port'   : 3000
});

app.use([
  request({ 'max': 3, 'method': 'HEAD' })
]);
```
