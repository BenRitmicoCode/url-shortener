var express = require('express');
var mongoose = require('mongoose');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var url = require('url');
var validator = require('validator');
var validUrl = require('valid-url');
var config = {};

config.db = {};
config.webhost = 'http://localhost:8080/';
config.db.host = 'localhost';
config.db.name = 'test';
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://'+process.env.SECRET+':'+ process.env.MADE_WITH+'@ds129179.mlab.com:29179/url_shortener');

var app = new express();
var Schema = mongoose.Schema;
var schema = new Schema({
  mainURL:{type: String},
  redirectTo:{type: String}
})
var actualDB = mongoose.model('actualDB',schema);

var sendToDB;

app.get('/new*', (req, res) => {
    let parameter = url.parse(req.url).pathname;;
    var redirect = parameter.split('new/').pop();

    var redirectTest = redirect.split('').slice(0, 4).join('').toString();
    if (redirectTest !== "http") {

        redirect = "http://" + redirect;
    }
    if (validator.isURL(redirect.toString())) {

        var newString = Math.random().toString(36).substring(7).slice(0, 7);
        var redirectUrl = req.protocol + '://' + req.get('host') + "/" + newString;
        actualDB.findOne({
            redirectTo: redirect.toString()
        }, (err, query) => {
            if (query) {
                console.log('inHere');
                console.log(query.toObject());
                res.send({
                    original_url: redirect,
                    short_url: query.mainURL
                });
                
            }else{
              sendToDB = actualDB({
                    mainURL: redirectUrl,
                    redirectTo: redirect,
                    iAmNotInTheSchema: true
                });

                sendToDB.save((err, changeset) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(changeset);
                    }
                });
                res.send({
                    original_url: redirect,
                    short_url: redirectUrl
                });
            }
            

        })


    } else {
        res.send('Not a valid URL')
    }
})
app.get('/:path',(req,res) => {
    let params = req.params.path;
    if(params.toString() !== "favicon.ico"){
     var original = req.protocol + '://' + req.get('host') + "/" + params;
     
     actualDB.findOne({mainURL:original},(err,query)=>{
      if (err) {return err}
        
      res.redirect(query.redirectTo);
      
    })
  }
})
app.get('/',(req,res) => {
  res.send({'format': '/new/url',
            'eg': 'https://robust-trunk.gomix.me/new/www.google.com'
           })
})
app.listen(8080,function(){ 
  console.log('listening on port 8080');  
})
