var mongoose = require('mongoose')

var AppSchema = new mongoose.Schema({
  name: String,
  description: String,
  svg: String,
  category: [{name: String, desc: String, price: Number, seat: [ Number ]}],
  available: [ Number ]
}, {collection: 'app'})

module.exports = mongoose.model('AppInfo', AppSchema)
