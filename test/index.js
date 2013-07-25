var test = require("tap").test

var level = require("level")
var sublevel = require("level-sublevel")
var multilevel = require("multilevel")
var manifest = require("level-manifest")
var net = require("net")
var child_process = require("child_process")

var levelThrottle
var Throttle = require("tokenthrottle")


test("load", function (t) {
  t.plan(1)

  levelThrottle = require("../")
  t.ok(levelThrottle, "loaded module")
})

test("creates tokenthrottle", function (t) {
  t.plan(2)

  var db = level("./testdb")

  var throttle = levelThrottle({rate: 100}, db)
  t.ok(throttle instanceof Throttle, "got a TokenThrottle")
  db.close(function () {
    t.ok(1, "db closed")
  })
})

test("throttle", function (t) {
  t.plan(11)

  var db = level("./testdb")

  var throttle = levelThrottle({rate: 3}, db)

  var i = 0
  while (i++ < 3) {
    // even setImmediate is too fast here.
    setTimeout(function () {
      throttle.rateLimit("test", function (err, limited) {
        t.notOk(err, "No error")
        t.notOk(limited, "Not throttled yet")
      })
    }, i * 10)
  }
  setTimeout(function () {
    throttle.rateLimit("test", function (err, limited) {
      t.notOk(err, "No error")
      t.ok(limited, "Should now be throttled.")
    })
  }, 50)
  setTimeout(function () {
    throttle.rateLimit("test", function (err, limited) {
      t.notOk(err, "No error")
      t.notOk(limited, "Throttle should be lifted.")
      db.close(function () {
        t.ok(1, "level client exited")
      })
    })
  }, 400)
})

test("values set in level", function (t) {
  t.plan(5)

  var db = level("./testdb")
  var sub = sublevel(db).sublevel("levelThrottle")


  var throttle = levelThrottle({rate: 3}, db)

  throttle.rateLimit("foo", function (err, limited) {
    t.notOk(err, "No error")
    t.notOk(limited, "Not throttled")
    sub.get("foo", function (err, value) {
      t.notOk(err, "No error")
      t.ok(value, "stuff is set in the level throttle")
      db.close(function () {
        t.ok(1, "level client exited")
      })
    })
  })
})

test("throttle multi-client", function (t) {
  t.plan(17)

  var db = level("./testdb")
  var sub = sublevel(db).sublevel("levelThrottle")
  var settings = manifest(db)

  var server = net.createServer(function (con) {
    con.pipe(multilevel.server(db)).pipe(con)
  }).listen(3000)

  server.unref()

  function connect() {
    var db = multilevel.client(settings)
    var con = net.connect(3000)
    con.unref()
    con.pipe(db.createRpcStream()).pipe(con)
    return db
  }

  var multiClient1 = connect()
  var multiClient2 = connect()

  var throttle1 = levelThrottle({rate: 3}, multiClient1)
  var throttle2 = levelThrottle({rate: 3}, multiClient2)

  throttle1.rateLimit("multiclient", function (err, limited) {
    t.notOk(err, "No error")
    t.notOk(limited, "Not throttled yet")
  })
  setTimeout(function () {
    throttle2.rateLimit("multiclient", function (err, limited) {
      t.notOk(err, "No error")
      t.notOk(limited, "Not throttled yet")
    })
  }, 20)
  setTimeout(function () {
    throttle1.rateLimit("multiclient", function (err, limited) {
      t.notOk(err, "No error")
      t.notOk(limited, "Not throttled yet")
    })
  }, 30)

  setTimeout(function () {
    throttle1.rateLimit("multiclient", function (err, limited) {
      t.notOk(err, "No error")
      t.ok(limited, "Should now be throttled.")
    })
    throttle2.rateLimit("multiclient", function (err, limited) {
      t.notOk(err, "No error")
      t.ok(limited, "Should now be throttled from here as well.")
    })
  }, 70)

  setTimeout(function () {
    throttle1.rateLimit("multiclient", function (err, limited) {
      t.notOk(err, "No error")
      t.notOk(limited, "Throttle should be lifted.")
    })
    throttle2.rateLimit("multiclient", function (err, limited) {
      t.notOk(err, "No error")
      t.notOk(limited, "Throttle should be lifted here as well.")
      multiClient1.close()
      multiClient2.close()
      server.close(function () {
        t.ok(1, "server closed")
        db.close(function () {
          t.ok(1, "leveldb closed")
          child_process.exec("rm -r ./testdb", function () {
            t.ok(1, "all cleaned up")
            t.end()
          })
        })
      })
    })
  }, 400)
})
