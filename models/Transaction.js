var mongoose = require('mongoose')

var User = new mongoose.Schema({
  name: String,
  surname: String,
  allievo: String
})

var TxSchema = new mongoose.Schema({
  tx_id: String,
  app_id: String,
  date: Date,
  tx_check: String,
  user: User,
  price: Number,
  seats: [ Number ],
  tx_valid: Boolean
}, {collection: 'transaction'})

module.exports = mongoose.model('Tx', TxSchema)
