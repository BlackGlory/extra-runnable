const { setTimeout } = require('timers')

exports.delay = function delay(timeout) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout).unref()
  })
}
