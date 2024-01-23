var express = require('express')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var jwt = require('jwt-simple')
var AppInfo = require('./../models/App.js')
var Tx = require('./../models/Transaction.js')

var router = express.Router()
router.use(cookieParser())
router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())

router.get('/app/:id', function (req, res, next) {
  Tx.find({app_id: req.params.id}).remove(function (post) {
    console.log('elements deleted')
  })
  AppInfo.findById(req.params.id, 'total', function (err, total) {
    if (err) return next
    var available = []
    for (var i = 1; i <= total._doc.total; i++) {
      // Case not
      available.push(i)
    }
    AppInfo.findByIdAndUpdate(req.params.id, {available: available}, function () {
      console.log('App Reset Completed')
    })
  })
  res.json()
})

router.get('/app/:id/info', function (req, res, next) {
  console.log('request for: ' + req.params.id)
  AppInfo.findById(req.params.id, 'name descrizione category', function (err, post) {
    if (err) return next(err)
    // if (post.end_date > new Date()) return next(err)
    res.json(post)
  })
})

router.get('/app/:id/seat', function (req, res, next) {
  console.log('request for: ' + req.params.id)
  AppInfo.findById(req.params.id, 'available -_id', function (err, Avseat) {
    if (err) return next(err)
    Tx.distinct('seats', {tx_valid: {$exists: true}}, function (err, result) {
      if (err) return next(err)
      var json = {
        'reserved': result,
        'available': Avseat._doc.available
      }
      res.json(json)
    })
  })
})

router.get('/app/:id/secreT', function (req, res, next) {
  console.log('request for: ' + req.params.id)
  Tx.find({'app_id': req.params.id}, function (err, trans) {
    if (err) return next(err)
    var passwd = (req.cookies.BIuser !== undefined) ? 'barbara' : req.query.passwd
    if (passwd === 'barbara') {
      res.setHeader('Set-Cookie', 'BIuser=valid; Path=/admin')
      res.json(trans)
    } else {
      next(err)
    }
  })
})

router.post('/app/:id/checkCode', function (req, res, next) {
  if ((req.body.code).trim().length === 8) {
    Tx.findOneAndUpdate({ tx_check: req.body.code }, {$unset: {tx_valid: ''}}, findTx)
  } else {
    // Tx.findOneAndUpdate({ tx_id: req.body.code }, {$unset: {tx_valid: ''}}, findTx)
    return next
  }
  function findTx (err, transaction) {
    if (err) return next
    AppInfo.findByIdAndUpdate(transaction.app_id, {$pull: {available: { $in: transaction.seats }}}, function (err, ris) {
      if (err) return next
      console.log('Transaction ' + transaction.tx_check + ' Confirmed')
      res.json({ok: 'confirmed'})
    })
  }
})

router.delete('/app/:id/checkCode', function (req, res, next) {
  if (req.body.code.length === 8) {
    Tx.findOneAndRemove({ tx_check: req.body.code }, findTx)
  } else {
    Tx.findOneAndRemove({ tx_id: req.body.code })
  }
  function findTx (err, transaction) {
    if (err) return next
    console.log('Transaction ' + transaction.tx_check + ' Deleted')
    res.json({ok: 'Deleted'})
  }
})

router.post('/app/:id/checkout', function (req, res, next) {
  AppInfo.findById(req.params.id, 'category -_id', function (err, category) {
    if (err || req.body.seat === undefined) return next(err)

    var totalPrice = 0.0
    var categorySeat = []
    var bookedSeat = []
    var user = {
      name: req.body.nome,
      surname: req.body.cognome,
      allievo: req.body.allievo
    }

    for (var y = 0; y < category._doc.category.length; y++) {
      categorySeat[y] = category._doc.category[y].seat
    }
    if (typeof req.body.seat === 'string') {
      bookedSeat[0] = parseInt(req.body.seat)
    } else {
      bookedSeat = req.body.seat
    }

    for (var i = bookedSeat.length; i > 0; i--) {
      for (var j = 0; j < categorySeat.length; j++) {
        if (categorySeat[j].indexOf(bookedSeat[i - 1]) !== -1) {
          totalPrice += category._doc.category[j].price
          break
        }
      }
    }
    var keyCode = Math.floor((Math.random() * (9500000 - 2500000) + 2500000))
    var token = jwt.encode({
      id: keyCode,
      iss: req.params.id,
      iat: Date(),
      total: totalPrice,
      seats: bookedSeat,
      sub: user
    }, 'VG26ICA2263.2')

    //AppInfo.findOne({available: {$all: bookedSeat}}, function (err, app) {
    Tx.find({'seats': {$in: bookedSeat}}, 'seats', function (err, app) {
      if (err) { console.log('here'); return next }
      if (Object.keys(app).length !== 0) {
        res.statusCode = 410
        res.json('{"errorText": "Alcuni dei posti selezionati sono stati già acquistati da te o altre persone, non sono quindi più disponibili"}')
      } else {
        var tx = new Tx({
          tx_id: token,
          app_id: req.params.id,
          date: Date(),
          user: user,
          tx_check: keyCode.toString(16) + (req.params.id).charAt(3) + (req.params.id).charAt(10),
          price: totalPrice,
          seats: bookedSeat,
          tx_valid: false
        })
        tx.save(function (err) {
          if (err) return next
          console.log('Transaction saved successfully')
        })
        res.cookie('BIuser_session', token)
        res.json({
          token: token,
          url: 'http://' + req.headers['host'] + '/checkout'
        })
      }
    })
  })
})

module.exports = router
