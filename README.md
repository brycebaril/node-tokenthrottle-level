Level TokenThrottle
===================

[![NPM](https://nodei.co/npm/tokenthrottle-level.png)](https://nodei.co/npm/tokenthrottle-level/)

A LevelDb-backed implementation of [tokenthrottle](http://npm.im/tokenthrottle)

Simply wraps [tokenthrottle](http://npm.im/tokenthrottle) with a Level back-end.

If you want to use it with multiple processes/servers, provide it a multilevel connection.

Level:

```javascript
// Create a level client
var db = require("level")(./throttle)

// Create a throttle with 100 access limit per second.
var throttle = require("tokenthrottle-level")({rate: 100}, db)

// in some_function that you want to rate limit
  throttle.rateLimit(id, function (err, limited) {
    /* ... handle err ... */
    if (limited) {
      return res.next(new Error("Rate limit exceeded, please slow down."));
    }
    else {
      /* ... do work ... */
    }
  })

```

Multilevel:

```javascript
// multilevel server code...
// In your multilevel server, make sure you have the same sublevel that will be used
// either the default "levelThrottle" or the `prefix` you specify.
// Then you must create a manifest for the clients so they know they may use it.
var sub = sublevel(db).sublevel("levelThrottle")
var settings = require("level-manifest")(db)
// save your settings somewhere

// client code...

// Create a multilevel client
var multilevel = require("multilevel")
var net = require("net")
var db = multilevel.client(settings)
var con = net.connect(3000)
con.pipe(db.createRpcStream()).pipe(con)

// Create a throttle with 100 access limit per second.
var throttle = require("tokenthrottle-level")({rate: 100}, db)

// in some_function that you want to rate limit
  throttle.rateLimit(id, function (err, limited) {
    /* ... handle err ... */
    if (limited) {
      return res.next(new Error("Rate limit exceeded, please slow down."));
    }
    else {
      /* ... do work ... */
    }
  })

```


Options
=======

Accepts all of the same options as [tokenthrottle](http://npm.im/tokenthrottle), with one extra:

* prefix: {String} An optional string to namespace with [level-sublevel](http://npm.im/level-sublevel), default is "levelThrottle"

License
=======

(The MIT License)

Copyright (c) Bryce B. Baril <bryce@ravenwall.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
