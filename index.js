module.exports = levelThrottle
module.exports.LevelTable = LevelTable

var Throttle = require("tokenthrottle")
var sublevel = require("level-sublevel")

/**
 * A npm.im/tokenthrottle implementation on top of Redis
 * @param  {Object} options          [REQUIRED] The same options as npm.im/tokenthrottle, plus:
 *                                   - expiry: the number of seconds to expire untouched entires (optional)
 *                                   - prefix: an optional namespace prefix for the key (optional)
 * @param  {LevelDb} levelDb     A level db to use.
 * @return {TokenThrottle}           A token throttle backed by Redis
 */
function levelThrottle(options, levelDb) {
  if (!options) throw new Error("Please supply required options.")
  options.tokensTable = LevelTable(levelDb, options)
  return Throttle(options)
}

/**
 * A Redis TokenTable implementation.
 * @param {LevelDb} levelDb A level db to use.
 * @param {Options} options LevelTable options
 *                          - prefix: A string to prefix all token entries with (default 'levelThrottle')
 */
function LevelTable(levelDb, options) {
  if (!(this instanceof LevelTable)) return new LevelTable(levelDb, options)
  if (!levelDb) throw new Error("I need a levelDb!")
  var db = sublevel(levelDb)
  this.db = db.sublevel(options.prefix || "levelThrottle")
}

LevelTable.prototype.get = function (key, cb) {
  this.db.get(key, {valueEncoding: "json"}, function (err, record) {
    if (err) return cb()
    return cb(null, record)
  })
}

LevelTable.prototype.put = function (key, value, cb) {
  this.db.put(key, value, {valueEncoding: "json"}, cb)
}
