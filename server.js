var express = require('express')
var mongoose = require('mongoose')
var api = require('./routes/api')
var checkout = require('./routes/checkout')
var app = express()

function fillArrayWithNumbers(n) {
  var arr = Array.apply(null, Array(n));
  return arr.map(function (x, i) { return i });
}

// Connect to the MongoDB
mongoose.Promise = global.Promise
mongoose.connect(process.env.DATABASE_URL, {
  useMongoClient: true
})
var con = mongoose.connection
con.on('error', (err) => console.error(err))
con.once('open', () => console.log('connection succesfull'))

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080

// set the view engine to ejs
app.set('view engine', 'ejs')

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'))
//Middleware for API
app.use('/api/v1', api)
app.use('/checkout', checkout)

// set the home page route
app.get('/', function (req, res) {
  /*var rows = [12,22,22,22,22,22,22,22,23,23,23,24,24,24,24,24,25,25,25,24,24,24,24,18,26,25,25,31,31,32,21];
  rows = rows.reverse();
  var row;
  var result = [];
  var counter = 1;
  var max = rows.length;
  for (var i= 1; i<= max; i++) {
    row = {
      name: (max-i+1) + '_row',
      price: 29.00,
      seat: fillArrayWithNumbers(rows[i-1])
    }
    row.seat = Array.from(row.seat, x => x + counter);
    counter += rows[i-1];
    result.push(row);
  }
  counter = counter - 1;
  console.log(counter);
  var final = {
    category: result,
    total: counter
  }
  console.log(JSON.stringify(final));*/
  res.render('index', {url: '/api/v1/app/597deb50734d1d58c9abea14'})
})

app.get('/admin', function (req, res) {
  res.render('admin', {url: '/api/v1/app/597deb50734d1d58c9abea14'})
})

app.listen(port, function () {
  console.log('Our app is running on http://localhost:' + port)
})
