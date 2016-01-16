var Cache = require('.')

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

