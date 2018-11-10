'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');

var cors = require('cors');
const urlRegex = require('url-regex');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);
var Schema = mongoose.Schema;

// 1. Define schema
var urlSchema = new Schema({
  "original": {"type": String, "required": true},
  "short": {"type": String, "required": true}
});

// 2. Create model
var Url = mongoose.model('Url', urlSchema);

// 3. Helper fns
var createAndSaveUrl = function(original_url, done) {
  var url = new Url({original: original_url, short: makeShortStr()});
  url.save(function(err, data) {
    if (err) return done(err);

    return done(null, data);
  });
};

var findUrlyId = function(urlId, done) {
  
  Url.findOne({"short": urlId}, function(err, data) {
    if (err) return done(err);
    
    return done(null, data);
  });   
  
};

var makeShortStr = function() {
  var text = [];
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text.push(possible.charAt(Math.floor(Math.random() * possible.length)));

  return text.join('');
}

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// API endpoint to CREATE short url... 
app.post("/api/shorturl/new", function (req, res) {
  var original_url = req.body.url;
  
  // 1. Validate url
  dns.lookup(original_url.replace(/(^\w+:|^)\/\//, ''), function (err, ip) {
    if (null !== err) {
      res.json({"error":"invalid URL", "debug": original_url, "err": err});
      return;
    }
    
    createAndSaveUrl(original_url, function(err, url) {
        if (null === err) {
          res.json({"original_url": url.original, "short_url": url.short});
        } else {
          res.json({"error":"DB error"});
        }
      });
    
  });
  
  
});

// API endpoint to USE short url
app.get("/api/shorturl/:id", function (req, res) {
  findUrlyId(req.params.id, function(err, url) {
    
    if (null === err) {
      res.redirect(url.original);
    } else {
      res.json({"error":"invalid URL"});
    }
    
  });
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});