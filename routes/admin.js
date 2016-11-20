var express = require('express');
var router = express.Router();
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var url = require('url');
var querystring = require('querystring');
var moment = require('moment');
var ent = require('ent');
var db = require('./db');
var ObjectID = require('mongodb').ObjectID;

function restriction(req, res, next){
    if(!req.session){
        res.render('users/connection.jade', { title: 'Connection', message: 'Tu dois te connecter pour aller là!'});
    } else {
        if(req.session.user && req.session.user.droits != 'god'){
            if(req.session.user.droits != 'demiGod'){
                res.render('/', {title: 'Accueil', message: req.session.user.pseudo + ', il te faut avoir des super-pouvoirs pour accéder à cette partie du site!', user: req.session.user, moment: moment});
            };
        };
    };
    next();
};

router.use(restriction);

router.get('/user/:profil', function(req, res, next){
    var collection = db.get().collection('users');
    var collectionMessages = db.get().collection('articles');
    var profilId = req.params.profil;
    if(req.session.user && req.session.user.droits == 'god' || req.session.user.droits == 'demiGod'){
// on va chercher le user managé
        collection.findOne({_id: new ObjectID(profilId)}, {mdp:0}, function(err, result){
            if(result){
// on affiche la liste des articles et réponses faites par le user
                var listeArticles = [];
                collectionMessages.find({"nouvelArticle.auteurId": profilId}).toArray(
                    function(err, data){
                    res.render('admin/profil.jade', {title: 'Gestion: ' + result.pseudo, user: req.session.user, profil: result, listeArticles: data, moment: moment});
                })
            };
        });
    };
});

router.get('/bannir/:profil', function(req, res, next){
    var profilId = req.params.profil;
    var collectionUsers = db.get().collection('users');
    var collectionMessages = db.get().collection('articles');
    if(req.session.user && req.session.user.droits == 'god' || req.session.user.droits == 'demiGod'){
// on va chercher le profil a bannir
        collectionUsers.findOne({_id: new ObjectID(profilId)}, function(err, profil){
            if(!err && profil && profil.avertissements >3 ){
            // on remove le profil
                collectionUsers.remove({_id: new ObjectID(profilId)}, function(err, result){
            // on remove les articles
                    if(!err){
                        collectionMessages.remove({"nouvelArticle.auteurId": profilId.toString()}, {multi: true}, function(err, result){
            // on remove les réponses aux articles
                            if(!err){
                                collectionMessages.update({"nouvelArticle.reponses": {$elemMatch: {auteurId: profilId.toString()}}}, { $pull: { "nouvelArticle.reponses": {auteurId: profilId.toString()}}}, {multi: true}, function(err, result){
            // on remove des listes de demande d'amis
                                    if(!err){
                                        collectionUsers.update({demandesAmis: { $elemMatch: {"demandeur.id": profilId.toString()}}}, {"$pull": { "demandesAmis": {"demandeur.id": profilId.toString()} } }, {multi: true}, function(err, result){
            // on remove des listes d'amis
                                            if(!err){
                                                collectionUsers.update({listeAmis: { $elemMatch: {"_id": new ObjectID(profilId)}}}, {"$pull": { "listeAmis": {"_id": new ObjectID(profilId)} } }, {multi: true}, function(err, result){
            // on remove les messages privés envoyé par le profil
                                                    if(!err){
                                                        collectionUsers.update({listeMessages: { $elemMatch: {"envoyeParId": new ObjectID(profilId)}}}, {$pull: {listeMessages: { envoyeParId: new ObjectID(profilId)}}},  {multi: true}, function(err, result){
                                                            if(!err){
                                                                collectionUsers.find().toArray(function(err, data){
                                                                    if(!err){
                                                                        var listeUsers = [];
                                                                        for(var i=0; data[i]; i++){
                                                                            if(data[i].droits != 'god'){
                                                                                listeUsers.push(data[i]);
                                                                            };
                                                                        };
                                                                        res.render('admin/listeUsers.jade', {title: 'Administration des utilisateurs', user: req.session.user, listeUsers: listeUsers, moment: moment, message: profil.pseudo + ' a bien été banni!'});
                                                                    };
                                                                });
                                                            };
                                                        });
                                                    };
                                                });
                                            };
                                        });
                                    };
                                });
                            };
                        });
                    };
                });
            } else {
        // si pas assez d'avertissements, on le signale
                var listeArticles = [];
                collectionMessages.find({"nouvelArticle.auteurId": profilId}).toArray(
                    function(err, data){
                    res.render('admin/profil.jade', {title: 'Gestion: ' + profil.pseudo, user: req.session.user, profil: profil, listeArticles: data, moment: moment, message: 'Il faut 4 avertissements minimum pour bannir un utilisateur'});
                });
            };
        });
    };
});

router.get('/listeUsers', function(req, res, next){
    var collection = db.get().collection('users');
    var title = 'Administration des utilisateurs';
    var user = req.session.user;
    collection.find().toArray(function(err, data){
        if(err){
            res.render('admin/listeUsers.jade', {title: title, message: 'Quelque chose s\'est mal passé, merci de réessayer!', user: user, data: data})
        } else {
            var listeUsers = [];
            for(var i=0; data[i]; i++){
                if(data[i].droits != 'god'){
                    listeUsers.push(data[i]);
                };
            };
            res.render('admin/listeUsers.jade', {title: title, user: user, listeUsers: listeUsers, moment: moment});
        };
    });
});

router.post('/user/traitementEdition', function(req, res, next){
    var collection = db.get().collection('users');
    collection.updateOne({pseudo: ent.encode(req.body.pseudoUserManaged)}, {$set: {droits: req.body.droitsUserManaged}}, function(err, result){
        collection.findOne({pseudo: ent.encode(req.body.pseudoUserManaged)}, function(err, result){
            if(err){
                var decodeUser = {
                    pseudo: ent.decode(result.pseudo),
                    mail: ent.decode(result.mail),
                    droits: result.droits,
                    dateCreation: result.dateCreation,
                    derniereConnection: result.derniereConnection
                };
                res.render('admin/listeUsers.jade', {title: 'Gestion des utilisateurs', message: 'Quelque chose s\'est mal passé!', user: req.session.user, userManaged: decodeUser});
            } else {
                var decodeUser = {
                    pseudo: ent.decode(result.pseudo),
                    mail: ent.decode(result.mail),
                    droits: result.droits,
                    dateCreation: result.dateCreation,
                    derniereConnection: result.derniereConnection
                };
                res.render('users/profil.jade', {title: 'Gestion: ' + result.pseudo, message: 'Modification réussie!', user: req.session.user, userManaged: decodeUser, moment: moment});
            };
        });
    });
});

router.get('/user/suppression', function(req, res, next){
    var params = querystring.parse(url.parse(req.url).query);
    var collection = db.get().collection('users');
    collection.deleteOne({pseudo: ent.encode(params.pseudoUser)}, function(err, result){
        if (err) {
            res.render('admin/listeUsers.jade', {title: 'Gestion des utilisateurs', message: 'Oops, quelque chose s\'est mal passé! merci de réessayer!', user: req.session.user});
        } else {
            collection.find().toArray(function(err, data){
                var user = req.session.user;
                if(err){
                    res.render('admin/listeUsers.jade', {title: title, message: 'Quelque chose s\'est mal passé, merci de réessayer!', user: user, data: data})
                } else {
                    var listeUsers = data;
                    res.render('admin/listeUsers.jade', {title: 'Gestion des utilisateurs', message: 'Suppression Réussie!', user: req.session.user, listeUsers: listeUsers, moment: moment});
                };
            });
        };
    });
});

router.get('/suppressionInactifs', function(req, res, next){
    var collectionUsers = db.get().collection('users');
    var collectionMessages = db.get().collection('articles');
    var dateActu = new Date();
    var datePurge = new Date(dateActu-15778800000);
    collectionUser.find({derniereConnection: {$lte: datePurge}}, {_id: 1}).toArray(function(err, data){
        if(!err && data && data.length){
            for(var i=0; data[i]; i++){
                var profilId = data[i]._id;
            // on remove le profil
                collectionUsers.remove({_id: new ObjectID(profilId)}, function(err, result){
            // on remove les articles
                    if(!err){
                        collectionMessages.remove({"nouvelArticle.auteurId": profilId.toString()}, {multi: true}, function(err, result){
            // on remove les réponses aux articles
                            if(!err){
                                collectionMessages.update({"nouvelArticle.reponses": {$elemMatch: {auteurId: profilId.toString()}}}, { $pull: { "nouvelArticle.reponses": {auteurId: profilId.toString()}}}, {multi: true}, function(err, result){
            // on remove des listes de demande d'amis
                                    if(!err){
                                        collectionUsers.update({demandesAmis: { $elemMatch: {"demandeur.id": profilId.toString()}}}, {"$pull": { "demandesAmis": {"demandeur.id": profilId.toString()} } }, {multi: true}, function(err, result){
            // on remove des listes d'amis
                                            if(!err){
                                                collectionUsers.update({listeAmis: { $elemMatch: {"_id": new ObjectID(profilId)}}}, {"$pull": { "listeAmis": {"_id": new ObjectID(profilId)} } }, {multi: true}, function(err, result){
            // on remove les messages privés envoyé par le profil
                                                    if(!err){
                                                        collectionUsers.update({listeMessages: { $elemMatch: {"envoyeParId": new ObjectID(profilId)}}}, {$pull: {listeMessages: { envoyeParId: new ObjectID(profilId)}}},  {multi: true}, function(err, result){
                                                            if(!err){
                                                                var listeUsers=[];
                                                                collection.find().toArray( function(err, data){
                                                                    listeUsers = data;
                                                                })
                                                                if(!err){
                                                                    var message = "Tout s'est bien passé!";
                                                                } else {
                                                                    var message = "Une erreure est survenue, merci de recommancer!";
                                                                };
                                                                res.render('admin/listeUsers.jade', {title: 'Gestion des utilisateurs', message: message, user: req.session.user, listeUsers: listeUsers, moment: moment});
                                                            };
                                                        });
                                                    };
                                                });
                                            };
                                        });
                                    };
                                });
                            };
                        });
                    };
                });
            };
        };
    });
});


/* GET home page. */

router.get('/:maPage', function(req, res, next){
    if(req.session){
        var user = req.session.user;
    };
    var maPage = req.params.maPage;
    res.render('admin/' + maPage, {title: maPage, user: user});
});

db.connect('mongodb://localhost:27017/blog', function(err){
    if(err){
        console.log('Impossible de se connecter à la base de données.' + err);
        process.exit(1);
    };
});

module.exports = router;