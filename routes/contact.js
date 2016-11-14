var express = require('express');
var router = express.Router();
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var db = require('./db');

// gestion des sessions
router.use(cookieParser())
    .use(session({
        secret: 'mySecretCookie',
        saveUninitialized: false,
        resave: false,
        cookie: {maxAge: 3600000}
    }))
    .use(bodyParser.urlencoded({
        extended: false
    })
);

function restriction(req, res, next){
    if(req.url == '/traitementCreation' || req.url == '/creation'){
        if(!req.session){
            res.render('users/connection.jade', { title: 'Connection', message: 'Tu dois te connecter pour envoyer un message...'});
        };
    };
    next();
};

router.use(restriction);

router.post('/traitementCreation', function(req, res, next){
    var collection = db.get().collection('articles');
    var collectionUsers = db.get().collection('users');
    var data = req.body;
    var user = req.session.user;
    collection.findOne({titre:req.body.titre},
    function(err, result){
        if(result){
            res.render('contact/creation.jade', {title: 'Nouveau message', data: data, message: 'Ce titre est déjà pris, veuillez en saisir un autre.'});
        } else {
            if(err){
                res.render('contact/creation.jade', {title: data.titre, message: 'Oops! Quelque chose s\'est mal passé! Merci de recommencer', user: user, data: data});
            } else {
                collection.insert({
                                idRedacteur: user.id,
                                titre: data.titre,
                                contenu: data.contenu,
                                dateCreation: new Date()
                            },
                    function(err, result){
                        if(err){
                            res.render('contact/creation.jade', {title: data.titre, message: 'Oops! Quelque chose s\'est mal passsé! Merci de recommencer', user: user.nom, data: data});
                        } else {
                            collection.find().toArray(
                                function(err, data){
                                    var i = data.length-1;
                                    res.render('contact/message.jade', {title: data[i].titre, message: 'Ton message a bien été envoyé ' + user.nom + '.', data: data[i]});
                                }
                            );
                        };
                    }
                );
            };
        };
    });
});

// POUR VOIR LA LISTE DES MESSAGES

/*router.get('/contact/:idMessage', function(req, res, next){
    var collection = db.get().collection('messages');
    var collectionUser = db.get().collection('users');
    
    var idMessage = req.params.idMessage;
    
    collection.findOne({_id: idMessage}, function(err, data){
        
    });
});*/

/* GET home page. */
router.get('/:maPage', function(req, res, next){
    if(req.session){
        user = req.session.user;
    };
    var maPage = req.params.maPage;
    res.render('contact/' + maPage, {title: maPage, user: user});
});

db.connect('mongodb://localhost:27017/blog', function(err){
    if(err){
        console.log('Impossible de se connecter à la base de données.' + err);
        process.exit(1);
    };
});

module.exports = router;