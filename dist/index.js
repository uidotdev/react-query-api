
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./react-query-api.cjs.production.min.js')
} else {
  module.exports = require('./react-query-api.cjs.development.js')
}
