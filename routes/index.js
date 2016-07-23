var express = require('express');
var router = express.Router();
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var i =0;

// gestion des sessions
router.use(cookieParser())
    .use(session({
        secret: 'unTrucSecret',
        saveUninitialized: false,
        resave: false
    }))
    .use(bodyParser.urlencoded({
        extended: false
    }));

router.get('/jeuMulti/:pageDemandee', function(req, res, next){
    var pageDemandee = req.params.pageDemandee;
    var user = req.session.user;
    var jeuMulti = false;
    
    if(user){
        if(req.url == '/jeuMulti/listeParties'){
            jeuMulti = true;
        }
        res.render('jeuMulti/' + pageDemandee, {user: user, jeuMulti: jeuMulti});
    } else {
        res.render('users/connection', {title: 'Connection', monH1: 'Connection', message: 'Vous devez être connecté pour pouvoir jouer!'});
    };
});

router.get('/:pageDemandee', function(req, res, next){
    var pageDemandee = req.params.pageDemandee;
    var message;
    var user;
    if(req.session.user){
        user = req.session.user;
        if(i<1){
            message = 'Content de te voir ' + user.nom + '!';
            i++;
        };
    };
    res.render('bases/' + pageDemandee, {title: pageDemandee, message: message, user: user});
});

/* GET home page. */
router.get('/', function(req, res, next) {
    var message;
    var user;
    if(req.session.user){
        user = req.session.user;
        if(i<1){
            message = 'Content de te voir ' + user.nom + '!';
            i++;
        };
    };
    res.render('index', {message: message, user: user, jeuSolo: true});
});

module.exports = router;