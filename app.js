var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var helmet = require('helmet'); // gère des failles de sécurité
var ent = require('ent'); // gère l'encryptage/décryptage des inputs
var db = require('./routes/db');
var ObjectID = require('mongodb').ObjectID;
var mailer = require('express-mailer');

var users = require('./routes/users');
var contact = require('./routes/contact');
var admin = require('./routes/admin');
var network = require('./routes/network');
var routes = require('./routes/index');

var app = express();
 
mailer.extend(app, {
  from: 'no-replay@fritz.solutions',
  host: 'mail.gandi.net', // hostname 
  secureConnection: true, // use SSL 
  port: 465, // port for secure SMTP 
  transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts 
  auth: {
    user: 'admin@fritz.solutions',
    pass: ''
  }
});

app.get('/users/editMdp/:mailSearch', function (req, res, next) {
    var mailToSend = req.params.mailSearch;
    var collection = db.get().collection('users');
    collection.findOne({mail: ent.encode(mailToSend)}, {_id: 0, pseudo: 1, mdp: 1}, function(err, result){
        if(!err && result){
            console.log(result)
            app.mailer.send('emailMdp', {
                to: mailToSend, 
                subject: 'Mot de passe Oublié',
                pseudo: result.pseudo,
                mdp: result.mdp
                }, function (err) {
                    if (err) {
                    // handle error 
                        res.render('users/connection.jade', {title: 'Connection', message:'Une erreur est survenue. Merci de recommancer.', titre:'renvoiMdp'});
                    } else {
                        res.render('users/connection.jade', {title: 'Connection', message:"Votre mot de passe a été renvoyé à l'adresse du compte", titre:'renvoiMdp'});
                    };
            });
        } else {
            res.render('users/connection.jade', {title: 'Connection', message:'Une erreur est survenue. Merci de recommancer.', titre:'renvoiMdp'});
        };
    });
});
    

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


app.use(favicon(path.join(__dirname, 'public/images', 'smileyKiss.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
        secret: 'mySecretCookie',
        saveUninitialized: false,
        resave: false,
        cookie: {maxAge: 3600000}
    }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());

app.use('/users', users);
app.use('/contact',contact);
app.use('/admin', admin);
app.use('/network', network);
app.use('/', routes);

app.disable('x-powered-by'); // minimum requis -> empèche de cibler directement les appli express

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
