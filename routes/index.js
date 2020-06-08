var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser')
const {send, init} = require('../public/javascripts/util/util.js');
var config = require('../config.json')
const controller = require('./controller.js');

var app = express();
app.use(bodyParser.urlencoded({ extended: true}))
/* GET home page. */
router.use('/', function(req, res, next) {
  //init(req.body);
  if(req && req.body){
    controller(req.body);
  }
  res.render('index', { title: '' });
});

module.exports = router;
