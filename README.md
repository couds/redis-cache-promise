# redis-cache-promise
Very simple module to handle Redis cache key/value with promises

## Methods
    
 `configure(Object)`: Set the configuration parameters to connect with Redis, Return the instance of the `redis-cache-promise` 
 
   - host(string): Host name or ip of the redis server
   - (OPTIONAL) db(int): Database number, default value 0 
   - (OPTIONAL) expiry(int): Default value of the cache in seconds, default value : 86400
   - (OPTIONAL) password(string): Password of the Redis server if "requirepass" is set on the server

 `Promise connect()`: Connect with Redis, return a promise.

# Example


    var Cache = require('redis-cache-promise')
    
    var cache = new Cache()
    
    cache
      .configure({
        host: '192.168.1.36',
        db: 0, //optional default 0
        expiry: 5, //optional default 86400
        password: '123', //optional
      })
      .connect()
      .then(function () {
    
        cache.set('key',
          {
            value: 'object'
          },
          {
            expiry: 5 // in seconds from now
          })
          .then(function (value) {
            console.log(value)
          }).catch(function (err) {
            throw err
          })
    
        var interval = setInterval(function () {
          cache.get('key')
            .then(function (value, key) {
              console.log('the value of', key, ' => ', value)
              if (!value) {
                console.log(key, 'expired')
                clearInterval(interval)
              }
            })
            .catch(function (err) {
              throw err
            })
    
          cache.get('key 2')
            .otherwise(function (deferred, key) {
              var newValue = 'newValue 2'
              console.log(key, 'without value, this function will set the value to ' + newValue)
              return deferred(newValue, {
                expiry: 3
              })
            })
            .then(function (value, key) {
              console.log('the value of', key, ' => ', value)
            })
            .catch(function (err) {
              throw err
            })
        }, 1000)
    
    
      })
      .catch(function (err) {
        throw err
      })

#Version 0.1.1
