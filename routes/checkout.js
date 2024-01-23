var express = require('express')
var cookieParser = require('cookie-parser')
var jwt = require('jwt-simple')

var router = express.Router()
router.use(cookieParser())

router.get('/', function (req, res, next) {
  if (req.cookies.BIuser_session) {
    var cookie = jwt.decode(req.cookies.BIuser_session, 'VG26ICA2263.2')
    cookie['raw'] = req.cookies.BIuser_session
    res.clearCookie('BIuser_session')
    res.render('print', {token: cookie})
  } else {
    res.statusCode = 404
    res.json({'err': 'Token not Valid'})
  }
})

module.exports = router
