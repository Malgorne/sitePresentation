var express = require('express');
var router = express.Router();
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var moment = require('moment');
var db = require('./db');

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
    if(req.session.user){
        if(req.url == '/connection' || req.url == '/inscription' || req.url == '/traitementConnection' || req.url == '/traitementInscription'){
            var user = req.session.user;
            res.render('index.jade', { title: 'Accueil', monH1: 'Accueil', message: 'Tu es déjà connecté ' + user.nom + '!', user: user});
        };
    } else {
        if(req.url == '/deconnection'){
            res.render('users/connection.jade', {title: 'Connection', monH1: 'Connection', message: 'Vous devez être connecté pour déconnecter'});
        };
        if(req.url == '/supression' || req.url == '/traitementSuppression'){
            res.render('users/connection.jade', {title: 'Connection', monH1: 'Connection', message: 'Vous devez être connecté pour supprimer votre compte!'});
        };
    };
    next();
};

router.use(restriction);

router.post('/traitementInscription', function(req, res, next){
    var collection = db.get().collection('users');
    var title = 'Inscription';
    if(req.body.passW === req.body.confirmPassW && !!req.body.passW && !!req.body.nom && !!req.body.mail){
        
        collection.findOne({$or: [{nom: req.body.nom}, {mail: req.body.mail}]}, function(err, result){
            if(result){
                res.render('users/inscription.jade', {title: title, message: 'Ces identifiants sont déjà pris, merci d\'en choisir d\'autres!', monH1: 'Inscription', data: req.body});
            } else {
                collection.insert({
                    nom: req.body.nom,
                    mail: req.body.mail,
                    mdp: req.body.passW,
                    droits: 'user',
                    dateCreation: new Date(),
                    derniereConnection: new Date()
                },
                function(err, result){
                    if(err){
                        res.render('users/traitementInscription.jade', {title: title, message: 'Linscription a échoué. Veuillez recommencer.', monH1: 'Echec de l\'incription'});
                    } else {
                        collection.find().toArray(
                            function(err, data){
                                var i = data.length-1;
                                req.session.user ={
                                    id: data[i]._id,
                                    nom: data[i].nom,
                                    mail: data[i].mail,
                                    droits: data[i].droits
                                };
                                req.session.save();
                                var user = req.session.user
                                res.render('users/traitementInscription.jade', {title: title, message: 'Merci pour ton inscription ' + user.nom + '. Tu peux poursuivre ta navigation.', monH1: 'Inscription réussie!', user: user, moment: moment});
                            }
                        );
                    };
                });
            };
        });
    } else {
        res.render('users/inscription.jade', {title: title, message: 'Quelque chose s\'est mal passé. Merci de recommencer.', monH1: 'Echec de l\'incription'});
    };
});

router.post('/traitementConnection', function(req, res, next){
    var collection = db.get().collection('users');
// vérification adresse mail
    collection.findOne({mail: req.body.mail},
    function(err, result){
        if(result){
// vérification du mdp
            if(req.body.passW === result.mdp){
                req.session.user = {
                    id: result._id,
                    mail: result.mail,
                    nom: result.nom,
                    droits: result.droits
                };
                req.session.save();
                collection.updateOne({nom: req.session.user.nom}, {
                    $set: {derniereConnection: new Date()}
                },
                function(err, result){
                    res.render('users/traitementConnection.jade', {title: 'Mon blog/ Connection réussie', monH1: 'Connection', message: 'Tu es connecté ' + req.session.user.nom + '.', nom: req.session.user.nom, user: req.session.user});
                });
            } else {
                res.render('users/connection.jade', {title: 'Connection', message:'Mot de passe erroné. Veuillez réessayer.', monH1: 'Connection', data: req.body});
            };
        } else {
            res.render('users/connection.jade', {title: 'Connection', message:'Erreur lors de l\'identification. Veuillez réessayer.', monH1: 'Connection', data: req.body});
        };
    });
});

router.get('/profil', function(req, res, next){
    var collection = db.get().collection('users');
    var collectionMessages = db.get().collection('messages');
    var administrateur = false;
    if(req.session.user){
        collection.findOne({nom: req.session.user.nom}, function(err, result){
            if(err){
                res.render('/', {title: 'Accueil', message: 'Une erreur est survenue.'})
            } else {
                if(result){
                    if(req.session.user.droits == 'god' || req.session.user.droits == 'demigod'){
                        administrateur = true;
                        res.render('users/profil.jade', {title: 'Profil' + result.nom, monH1: result.nom,  user: req.session.user, administrateur: administrateur});
                    } else {
                        res.render('users/profil.jade', {title: 'Profil' + result.nom, monH1: result.nom,  user: result, moment: moment});
                    };
                } else {
                    res.render('users/connection.jade', {title: 'Connection', message:'Une erreur est survenue. Merci de vous connecter ou de vous créer un compte.', user: req.session.user});
                };
            };
        });
    } else {
        res.render('users/connection.jade', {title: 'Connection', message:'Une erreur est survenue. Merci de vous connecter ou de vous créer un compte.'});
    };
});

router.get('/edition', function(req, res, next){
    var collection = db.get().collection('users');
    if(req.session.user){
        collection.findOne({nom: req.session.user.nom},
        function(err, result){
            if(err){
                res.render('users/connection.jade', {title: 'Connection', message:'Une erreur est survenue. Merci de vous connecter ou de vous créer un compte.'});
            } else {
                if(result){
                    res.render('users/edition.jade', {title: 'Mon blog/ Edition profil', monH1: 'Edition du profil', user: result});
                } else {
                    res.render('users/connection.jade', {title: 'Connection', message:'Une erreur est survenue. Merci de vous connecter ou de vous créer un compte.'});
                };
            };
        });
    } else {
        res.render('users/connection.jade', {title: 'Connection', message:'Vous devez être connecté pour accéder à cette partie du site!'});
    };
});

router.post('/traitementEdition', function(req, res, next){
    var collection = db.get().collection('users');
    var title = 'Edition profil';
    var messageErreur = 'Une erreur est survenue. Merci de réessayer.';
    collection.findOne({$or: [{nom: req.body.nom}, {mail: req.body.mail}]}, function(err, result){
        if(err){
            res.render('users/connection.jade', {title: 'Connection', message: messageErreur});
        } else {
            if(result){
                if(result._id != req.session.user.id){
                    res.render('users/edition.jade', {title: 'Mon blog/ Edition profil', monH1: 'Edition du profil', message: 'Ce nom ou/et cette adresse mail est/sont déjà pris(e). Merci d\'en choisir un/une autre.', user: req.session.user});
                } else {
                    if(req.body.passW){
                        if(req.body.passW === req.body.confirmPassW){
                            if(req.body.oldPassW != result.mdp){
                                res.render('users/edition.jade', {title: 'Mon blog/ Edition profil', monH1: 'Edition du profil', message: 'Merci de saisir l\'ancien mot de passe.', user: req.session.user});
                            } else {
                                collection.updateOne({ nom: req.session.user.nom},
                                    {$set: {nom: req.body.nom, mail: req.body.mail, mdp: req.body.passW}},
                                    function(err, result){
                                        collection.findOne({nom: req.body.nom},
                                           function(err, result){
                                                if(err){
                                                    res.render('users/connection.jade', {title: 'Connection', message: messageErreur});
                                                } else {
                                                    if (result){
                                                        req.session.user = {
                                                            id: result._id,
                                                            mail: result.mail,
                                                            nom: result.nom,
                                                            droits: result.droits
                                                        };
                                                        req.session.save();
                                                        res.render('users/profil.jade', {title: 'Mon blog/ Profil', message: 'Modification(s) réussie(s)', monH1: result.nom, user: result});
                                                    };
                                                };
                                                next();
                                            }
                                        );
                                    }
                                );
                            }
                        } else {
                            res.render('users/edition.jade', {title: 'Mon blog/ Edition profil', monH1: 'Edition du profil', message: 'Le mot nouveau mot de passe n\'a pas été confirmé.', user: req.session.user});
                        };
                    } else {
                        collection.updateOne({
                            nom: req.session.user.nom
                        },
                        {$set: {nom: req.body.nom, mail: req.body.mail}},
                        function(err, result){
                            collection.findOne({nom: req.body.nom}, function(err, result){
                                if(err){
                                    res.render('users/connection.jade', {title: 'Connection', message: messageErreur});
                                } else {
                                    if (result){
                                        req.session.user = {
                                            id: result._id,
                                            mail: result.mail,
                                            nom: result.nom
                                        };
                                        req.session.save();
                                        res.render('users/profil.jade', {title: 'Mon blog/ Profil', message: 'Modification(s) réussie(s)', monH1: result.nom, user: result, moment: moment});
                                    };
                                };
                                next();
                            });
                        });
                    };
                };
            } else {
                res.render('users/connection.jade', {title: 'Connection', message: messageErreur});
            };
        };
    });
});

router.get('/deconnection', function(req, res, next){
    req.session.destroy(function(err){
        res.render('', {title: 'Accueil', monH1: 'Accueil', message: 'Vous avez été déconnecté avec succés! A très bientôt!', jeuSolo: true});
        
    });
});

router.post('/traitementSuppression', function(req, res, next){
    var collection = db.get().collection('users');
    var title = 'Suppression du profil';
    var user = req.session.user;
    collection.findOne({$and: [{nom: user.nom}, {mail: user.mail}]}, function(err, result){
                            if(err){
                                res.render('users/suppression.jade', {title: title, monH1: title, message: 'Oops, quelque chose s\'est mal passé! merci de réessayer!', user: user});
                            } else {
                                if(result.mdp == req.body.passW){
                                    collection.deleteOne({_id: result._id}, function(err, result){
                                        if (err) {
                                            res.render('users/suppression.jade', {title: title, monH1: title, message: 'Oops, quelque chose s\'est mal passé! merci de réessayer!', user: user});
                                        } else {
                                            req.session.destroy(function(err){
                                                res.render('', {title: 'Accueil', monH1: 'Accueil', message: 'Profil supprimé avec succés! J\'espère te revoir très vite!', user: user})
                                            });
                                        };
                                    });
                                } else {
                                    res.render('users/suppression.jade', {title: title, monH1: title, message: 'Le mot de passe est incorrecte. Merci de réessayer!', user: user});
                                };
                            };
    });
});

/* GET users listing. */

router.get('/:maPage', function(req, res, next){
    var maPage = req.params.maPage;
    var user;
    if(req.session.user){
        var user = req.session.user
    };
    res.render('users/' + maPage, {title: maPage, monH1: maPage, user: user, moment: moment});
});

db.connect('mongodb://localhost:27017/blog', function(err){
    if(err){
        console.log('Impossible de se connecter à la base de données.' + err);
        process.exit(1);
    };
});

module.exports = router;