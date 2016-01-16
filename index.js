var Promise = require('bluebird')
var redis = require("redis");


var Self = function () {
  this.conf = {
    host: 'localhost',
    port: '6379',
    db: 0,
    password: '',
    expiry : 86400
  }
  this.connected = false
}

Self.prototype.configure = function (conf) {
  if (typeof conf === 'object' && conf) {
    Object.keys(conf).map(function (key) {
      this.conf[key] = conf[key]
    }.bind(this))
  }

  return this;
}

Self.prototype.connect = function () {
  if (this.connected) {
    this.connected = false
    this.client.quit()
  }

  return new Promise(function (resolve, reject) {
    this.client = redis.createClient({
      host: this.conf.host,
      port: this.conf.port
    });

    this.client.auth(this.conf.password, function (err) {
      if (err) {
        reject(err)
      }
    });


    this.client.on('connect', function () {
      if (this.conf.db) {
        this.client.select(this.conf.db, function () {
          this.connected = true
          resolve()
        }.bind(this));
      } else {
        this.connected = true
        resolve()
      }
    }.bind(this))

    this.client.on('error', function (err) {
      this.connected = false
      this.client.quit()
      reject(err)
    }.bind(this))
  }.bind(this))
}

Self.prototype.disconnect = function () {
  return this.client.quit()
}

Self.prototype.set = function (key, value, options) {
  if (!this.connected) {
    throw new Error('Must call connect before set data')
  }
  return new Promise(function (resolve, reject) {
    this.client.set(key, JSON.stringify(value), function (err, res) {
      this.client.expire(key, options ? (options.expiry || this.conf.expiry) : this.conf.expiry);
      if (err) {
        throw err
        return reject(err)
      }
      return resolve(value)
    }.bind(this))
  }.bind(this))
}

Self.prototype.get = function (key) {
  if (!this.connected) {
    throw new Error('Must call connect before getting data')
  }
  var handlers = {}
  var self = this;
  //ensure async


  var then = function (resolve) {
    handlers.resolve = resolve
    return {
      catch: reject
    }
  }

  var otherwise = function (otherwise) {
    handlers.otherwise = otherwise
    return {
      then: then,
      catch: reject
    };
  }

  var reject = function (reject) {
    handlers.reject = reject
    return null
  }

  setTimeout(function () {
    try {
      this.client.get(key, function (err, res) {
        if (err) {
          throw err
        }

        if (res || !handlers.otherwise) {
          handlers.resolve(JSON.parse(res), key)
        } else {
          handlers.otherwise(function (value, options) {
            self.set(key, value, options)
              .then(function () {
                handlers.resolve(value, key)
              })
          }, key)
        }

      }.bind(this))

    } catch (err) {
      handlers.reject(err)
    }

  }.bind(this), 0)

  return {
    otherwise: otherwise,
    then: then,
    catch: reject
  }
}


module.exports = Self