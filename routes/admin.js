var express = require('express');
var router = express.Router();
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var url = require('url');
var querystring = require('querystring');
var moment = require('moment');
var db = require('./db');

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

function restriction(req, res, next){
    if(!req.session){
        res.render('users/connection.jade', { title: 'Connection', monH1: 'Connection', message: 'Tu dois te connecter pour aller là!'});
    } else {
        var user = req.session.user;
        if(user.droits != 'god'){
            res.render('/', {title: 'Accueil', monH1: 'Accueil', message: user.nom + ', il te faut avoir des super-pouvoirs pour accéder à cette partie du site!', user: user});
        };
    };
    next();
};

router.use(restriction);

router.get('/listeUsers', function(req, res, next){
    
    var collection = db.get().collection('users');
    var title = 'Administration des utilisateurs';
    var user = req.session.user;
    
    collection.find().toArray(
        
        function(err, data){
            if(err){
                res.render('admin/listeUsers.jade', {title: title, message: 'Quelque chose s\'est mal passé, merci de réessayer!', user: user, data: data})
            } else {
                var listeUsers = []
                for(var j = 0; data[j]; j++){
                    listeUsers.push(data[j]);
                };
                res.render('admin/listeUsers.jade', {title: title, user: user, listeUsers: listeUsers, moment: moment})
            };
        }
    );
});

router.get('/user/profil', function(req, res, next){
    var collection = db.get().collection('users');
    var collectionMessages = db.get().collection('messages');
    var administrateur = false;
    if(req.query && req.session.user.droits == 'god'){
        var params = querystring.parse(url.parse(req.url).query);
        var administrateur = true;
        
        collection.findOne({nom: params.nom}, function(err, result){
            if(result){
                res.render('users/profil.jade', {title: 'Gestion: ' + result.nom, monH1: 'Gestion: ' + result.nom,  user: result, administrateur: administrateur, moment: moment});
            };
        });
    };
});

router.post('/user/traitementEdition', function(req, res, next){
    var administrateur = true;
    var collection = db.get().collection('users');
    collection.updateOne({nom: req.body.nomUser},
                        {$set: {droits: req.body.droitsUser}},
                        function(err, result){
        collection.findOne({nom: req.body.nomUser}, function(err, result){
            if(err){
                res.render('admin/listeUsers.jade', {title: 'Gestion des utilisateurs', monH1: 'Gestion des utilisateurs', message: 'Quelque chose s\'est mal passé!', administrateur: administrateur, user: req.session.user});
            } else {
                res.render('users/profil.jade', {title: 'Gestion: ' + result.nom, monH1: 'Gestion: ', message: 'Modification réussie!', administrateur: administrateur, user: result});
            };
        });
    });
});

router.get('/user/suppression', function(req, res, next){
    var administrateur = true;
    var params = querystring.parse(url.parse(req.url).query);
    var collection = db.get().collection('users');
    collection.deleteOne({nom: params.nomUser}, function(err, result){
                                        if (err) {
                                            res.render('admin/listeUsers.jade', {title: 'Gestion des utilisateurs', monH1: 'Gestion des utilisateurs', message: 'Oops, quelque chose s\'est mal passé! merci de réessayer!', user: req.session.user, administrateur: administrateur});
                                        } else {
                                            collection.find().toArray(
                                                function(err, data){
                                                    var user = req.session.user;
                                                    if(err){
                                                        res.render('admin/listeUsers.jade', {title: title, message: 'Quelque chose s\'est mal passé, merci de réessayer!', user: user, data: data})
                                                    } else {
                                                        var listeUsers = []
                                                        for(var j = 0; data[j]; j++){
                                                            listeUsers.push(data[j]);
                                                        };
                                                        res.render('admin/listeUsers.jade', {title: 'Gestion des utilisateurs', monH1: 'Gestion des utilisateurs', message: 'Suppression Réussie!', user: req.session.user, administrateur: administrateur, listeUsers: listeUsers, moment: moment});
                                                    };
                                                }
                                            );
                                        };
                                    });
});

router.get('/suppressionInactifs', function(req, res, next){
    var collection = db.get().collection('users');
    var dateActuelle = new Date();
    var datePurge = dateActuelle - 31536000;
    var administrateur = true;
    var listeUsers = [];
    collection.remove({derniereConnection: {$lt: datePurge}}, function(err, result){
        collection.find().toArray(
            function(err, data){
                for(var j = 0; data[j]; j++){
                    listeUsers.push(data[j]);
                };
                res.render('admin/listeUsers.jade', {title: 'Gestion des utilisateurs', monH1: 'Gestion des utilisateurs', message: 'Suppression des comptes inactifs réussie!', user: req.session.user, administrateur: administrateur, listeUsers: listeUsers, moment: moment});
            }
        );
    });
});


/* GET home page. */

router.get('/:maPage', function(req, res, next){
    if(req.session){
        var user = req.session.user;
    };
    var maPage = req.params.maPage;
    res.render('admin/' + maPage, {title: maPage, monH1: maPage, user: user});
});

db.connect('mongodb://localhost:27017/blog', function(err){
    if(err){
        console.log('Impossible de se connecter à la base de données.' + err);
        process.exit(1);
    };
});

module.exports = router;