var express = require('express');
var router = express.Router();
var path = require('path');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var moment = require('moment'); // gère les dates
var db = require('./db');
var ObjectID = require('mongodb').ObjectID;
var ent = require('ent'); // gère l'encryptage/décryptage des inputs
var multer = require('multer'); // gère lupload de fichiers
var fs = require('fs');
var upload = multer({ dest: 'public/images/uploads/photoProfil' });


router.post('/editPhotoProfil', upload.single('photoProfil'), function (req, res, next) {
  // req.file is the `avatar` file
  // hold the text fields, if there were any
    var collection = db.get().collection('users');
// si on a déjà une photo de profil
    if(req.session.user.photoProfil){
    // on remove l'ancien fichier
        fs.unlink(process.cwd()+'/public/'+ req.session.user.photoProfil, function(err){});
    };
// on crée le path vers la photoProfil
    collection.updateOne({pseudo: ent.encode(req.session.user.pseudo)}, {$set: {photoProfil: 'images/uploads/photoProfil/' + req.file.filename}}, function(err, result){
        if(err){
            res.render('users/connection.jade', {title: 'Connection', message:'Une erreur est survenue. Merci de vous connecter ou de vous créer un compte.'});
        } else if(result){
            req.session.user.photoProfil = 'images/uploads/photoProfil/' + req.file.filename;
            res.render('users/profil.jade', {title: 'Mon blog/ Edition profil', user: req.session.user, message: 'Modification(s) réussie(s)', moment: moment});
        };
    });
});

// faire une route de supression de photoProfil

router.get('/supressionPhotoProfil', function(req, res, next){
    var collection = db.get().collection('users');
    if(req.session.user){
        if(req.session.user.photoProfil){
// on supprime le path en bdd
            collection.updateOne({pseudo: ent.encode(req.session.user.pseudo)}, {$unset: {photoProfil: 1 }}, function(err, result){
// si erreur, on retourne à l'affichage du profil
                if(err){
                    res.render('users/profil.jade', {title: 'Profil', message:'Une erreur est survenue. Merci de réessayer.', user: req.session.user, moment: moment});
                } else {
// si réussite:
    // on supprime le fichier
                    fs.unlink(process.cwd()+'/public/'+ req.session.user.photoProfil, function(err){
        // on supprime la photoProfil de la session
                        req.session.user.photoProfil = null;
                        res.render('users/profil.jade', {title: 'Profil', message:'Photo supprimée!', user: req.session.user, moment: moment});
                    });
                };
            });
        } else {
            res.render('users/profil.jade', {title: 'Profil', message:'Une erreur est survenue. Merci de réessayer.', user: req.session.user, moment: moment});
        };
    } else {
        res.render('users/connection.jade', {title: 'Connection', message:'Une erreur est survenue. Merci de vous connecter ou de vous créer un compte.'});
    };
});

function restriction(req, res, next){
    if(req.session.user){
        if(req.url == '/connection' || req.url == '/inscription' || req.url == '/traitementConnection' || req.url == '/traitementInscription'){
            var user = req.session.user;
            res.render('index.jade', { title: 'Accueil', message: 'Tu es déjà connecté ' + user.pseudo + '!', user: user});
        };
    } else {
        if(req.url == '/deconnection'){
            res.render('users/connection.jade', {title: 'Connection', message: 'Vous devez être connecté pour déconnecter'});
        };
        if(req.url == '/supression' || req.url == '/traitementSuppression'){
            res.render('users/connection.jade', {title: 'Connection', message: 'Vous devez être connecté pour supprimer votre compte!'});
        };
    };
    next();
};

router.use(restriction);

router.post('/traitementInscription', function(req, res, next){
    var collection = db.get().collection('users');
    var title = 'Inscription';
// enchappe les caractère spéciaux
    var reqBodyEncode = {
        passW: ent.encode(req.body.passW),
        confirmPassW: ent.encode(req.body.confirmPassW),
        pseudo: ent.encode(req.body.pseudo),
        mail: ent.encode(req.body.mail)
    };
    if(reqBodyEncode.passW === reqBodyEncode.confirmPassW && !!reqBodyEncode.passW && !!reqBodyEncode.pseudo && !!reqBodyEncode.mail){
        collection.findOne({$or: [{pseudo: reqBodyEncode.pseudo}, {mail: reqBodyEncode.mail}]}, {mdp: 0}, function(err, result){
            if(result){
                res.render('users/inscription.jade', {title: title, message: 'Ces identifiants sont déjà pris, merci d\'en choisir d\'autres!', data: req.body});
            } else {
                if(req.body.mail == 'fritz.benj@free.fr'){
                    var droits = 'god';
                } else {
                    var droits = 'user';
                };
                collection.insert({
                    pseudo: reqBodyEncode.pseudo,
                    mail: reqBodyEncode.mail,
                    mdp: reqBodyEncode.passW,
                    droits: droits,
                    dateCreation: new Date(),
                    derniereConnection: new Date(),
                    demandesAmis: [],
                    listeAmis: [],
                    listePosts: [],
                    listeMessages: []
                }, function(err, result){
                    if(err){
                        res.render('users/traitementInscription.jade', {title: title, message: 'Linscription a échoué. Veuillez recommencer.'});
                    } else {
                        collection.find().toArray(
                            function(err, data){
                                var i = data.length-1;
                                req.session.user ={
                                    _id: data[i]._id,
                                    pseudo: ent.decode(data[i].pseudo),
                                    mail: ent.decode(data[i].mail),
                                    droits: data[i].droits,
                                    dateCreation: data[i].dateCreation,
                                    derniereConnection: data[i].derniereConnection,
                                    listeAmis: data[i].listeAmis,
                                    listePosts: data[i].listePosts
                                };
                                req.session.save();
                                res.render('users/profil.jade', {title: title, message: 'Merci pour ton inscription ' + req.session.user.pseudo + '. Tu peux poursuivre ta navigation.', user: req.session.user, moment: moment});
                            }
                        )
                    }
                });
            };
        });
    } else {
        res.render('users/inscription.jade', {title: title, message: 'Quelque chose s\'est mal passé. Merci de recommencer.'});
    };
});

router.post('/traitementConnection', function(req, res, next){
    var collection = db.get().collection('users');
// enchappe les caractères spéciaux
    var reqBodyEncode = {
        passW: ent.encode(req.body.passW),
        mail: ent.encode(req.body.mail)
    };
// vérification adresse mail
    collection.findOne({mail: reqBodyEncode.mail}, function(err, result){
        if(result){
// vérification du mdp
            if(reqBodyEncode.passW === result.mdp){
                req.session.user = {
                    _id: result._id,
                    droits: result.droits,
                    pseudo: ent.decode(result.pseudo),
                    mail: ent.decode(result.mail),
                    photoProfil: result.photoProfil,
                    droits: result.droits
                };
                if(result.photoProfil){
                    req.session.user.photoProfil = result.photoProfil;
                };
                if(result.listeAmis){
                    req.session.user.listeAmis = result.listeAmis;
                };
                if(result.description){
                    req.session.user.description = {};
                    if(result.description.nom){
                        req.session.user.description.nom = ent.decode(result.description.nom);
                    };
                    if(result.description.prenom){
                        req.session.user.description.prenom = ent.decode(result.description.prenom);
                    };
                    if(result.description.age){
                        req.session.user.description.age = ent.decode(result.description.age);
                    };
                    if(result.description.presentation){
                        req.session.user.description.presentation = ent.decode(result.description.presentation);
                    };
                };
                if(result.coordonnees){
                    req.session.user.coordonnees = {};
    // retirer le ! du if (mode débug)
                    if(result.coordonnees.adresse && result.coordonnees.adresse.adresseNumber ){
                        var adresse = {
                            adresseNumber: ent.decode(result.coordonnees.adresse.adresseNumber),
                            adresseRue: ent.decode(result.coordonnees.adresse.adresseRue),
                            adresseCP: ent.decode(result.coordonnees.adresse.adresseCP),
                            adresseVille: ent.decode(result.coordonnees.adresse.adresseVille)
                        };
                        req.session.user.coordonnees.adresse = adresse;
                    };
                };
                req.session.user.listePosts = result.listePosts;
                req.session.save();
                collection.updateOne({_id: new ObjectID(req.session.user._id)}, {$set: {derniereConnection: new Date()}}, function(err, result){
                    res.render('users/profil.jade', {title: 'Mon blog/ Connection réussie', message: 'Tu es connecté ' + req.session.user.pseudo + '.', pseudo: req.session.user.pseudo, user: req.session.user, moment: moment});
                });
            } else {
                res.render('users/connection.jade', {title: 'Connection', message:'Mot de passe erroné. Veuillez réessayer.', data: req.body});
            };
        } else {
            res.render('users/connection.jade', {title: 'Connection', message:'Erreur lors de l\'identification. Veuillez réessayer.', data: req.body});
        };
    });
});


router.get('/profil', function(req, res, next){
    var collection = db.get().collection('users');
    var collectionMessages = db.get().collection('messages');
    if(req.session.user){
        collection.findOne({_id: new ObjectID(req.session.user._id)}, {mdp: 0}, function(err, result){
            if(err){
                res.render('/', {title: 'Accueil', message: 'Une erreur est survenue.'})
            } else {
                if(result){
                    if(req.session.user.droits == 'god' || req.session.user.droits == 'demigod'){
// faire un beau user décodé bien propre
                        res.render('users/profil.jade', {title: 'Profil ' + ent.decode(result.pseudo), user: result, moment: moment });
                    } else {
// faire un beau user décodé bien propre
                        res.render('users/profil.jade', {title: 'Profil ' + ent.decode(result.pseudo),  user: req.session.user, moment: moment});
                    };
                } else {
                    res.render('users/connection.jade', {title: 'Connection', message:'Une erreur est survenue. Merci de vous connecter ou de vous créer un compte.', user: req.session.user, moment: moment});
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
        collection.findOne({pseudo: ent.encode(req.session.user.pseudo)}, {mdp: 0}, function(err, result){
            if(err){
                res.render('users/connection.jade', {title: 'Connection', message:'Une erreur est survenue. Merci de vous connecter ou de vous créer un compte.'});
            } else {
                if(result){
                    var decodedUser = req.session.user;
                    if(result.description){
                        decodedUser.description = {};
                        if(result.description.nom){
                            decodedUser.description.nom = ent.decode(result.description.nom);
                        };
                        if(result.description.prenom){
                            decodedUser.description.prenom = ent.decode(result.description.prenom);
                        };
                        if(result.description.age){
                            decodedUser.description.age = ent.decode(result.description.age);
                        };
                        if(result.description.presentation){
                            decodedUser.description.presentation = ent.decode(result.description.presentation);
                        };
                    };
                    if(result.coordonnees){
                        decodedUser.coordonnees = {};
                        if(result.coordonnees.adresse && result.coordonnees.adresse.adresseNumber ){
                            var adresse = {
                                adresseNumber: ent.decode(result.coordonnees.adresse.adresseNumber),
                                adresseRue: ent.decode(result.coordonnees.adresse.adresseRue),
                                adresseCP: ent.decode(result.coordonnees.adresse.adresseCP),
                                adresseVille: ent.decode(result.coordonnees.adresse.adresseVille)
                            };
                            decodedUser.coordonnees.adresse = adresse;
                        };
                    };
                    res.render('users/edition.jade', {title: 'Mon blog/ Edition profil', user: decodedUser});
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
    collection.findOne({$or: [{pseudo: ent.encode(req.body.pseudo)}, {mail: ent.encode(req.body.mail)}] }, function(err, result){
        if(err){
            res.render('users/connection.jade', {title: 'Connection', user: req.session.user, message: messageErreur});
        } else {
            if(result){
                if(result._id != req.session.user._id){
                    res.render('users/edition.jade', {title: 'Mon blog/ Edition profil', message: 'Ce pseudo ou/et cette adresse mail est/sont déjà pris(es). Merci d\'en choisir un/une autre.', user: req.session.user});
                } else {
// objet qui sera set à la fin
                    var objetAediter = {};
                    for(var property in req.body){
                        if(req.body.hasOwnProperty(property)){
// gere caractères spéciaux
                            var value = ent.encode(req.body[property]);
    // partie coordonnées
                            if(property == 'adresseNumber' || property == 'adresseRue' || property == 'adresseCP' || property == 'adresseVille'){
                                objetAediter['coordonnees.adresse.'+property]= value;
    // gère le mdp
                            } else if(property == 'oldPassW' || property == 'passW' || property == 'confirmPassW'){
                                if(value){
                                    if(property == 'passW'){
                                        if(ent.encode(req.body.passW) === ent.encode(req.body.confirmPassW)){
        // si lancien mdp est correcte est bon, on l'édite
                                            if(ent.encode(req.body.oldPassW) == result.mdp){
                                                objetAediter.mdp = value;
                                            } else {
                                                res.render('users/edition.jade', {title: 'Mon blog/ Edition', message: 'Le mot de passe saisi est incorrect.', user: req.session.user, moment: moment});
                                            };
                                        };
                                    };
                                };
    // gère la description
                            } else if(property == 'nom' || property == 'prenom' || property == 'age' || property == 'presentation'){
                                objetAediter['description.'+property] = value;
                            } else if(property == 'photoProfil'){
                                
                            } else {
    // gere les attributs simples de premier niveau
                                objetAediter[property] = value;
                            };
                        };
                    };
// une fois que l'objet est pret, on update la bbd
                    collection.updateOne({_id: result._id}, {$set: objetAediter}, function(){
                        req.session.user.pseudo = ent.decode(objetAediter.pseudo);
                        req.session.user.mail = ent.decode(objetAediter.mail);
                        req.session.save();
                        res.render('users/profil.jade', {title: 'Mon blog/ Profil', message: 'Modification(s) réussie(s)', user: req.session.user, moment: moment});
                    });
                };
            } else {
                collection.findOne({pseudo: ent.encode(req.session.user.pseudo)}, function(err, secondResult){
                    if(secondResult){
                        var objetAediter = {};
                        for(var property in req.body){
                            if(req.body.hasOwnProperty(property)){
    // gere caractères spéciaux
                                var value = ent.encode(req.body[property]);
        // partie coordonnées
                                if(property == 'adresseNumber' || property == 'adresseRue' || property == 'adresseCP' || property == 'adresseVille'){
                                    objetAediter['coordonnees.adresse.'+property]= value;
        // gère le mdp
                                } else if(property == 'oldPassW' || property == 'passW' || property == 'confirmPassW'){
                                    if(value){
                                        if(property == 'passW'){
                                            if(ent.encode(req.body.passW) === ent.encode(req.body.confirmPassW)){
            // si lancien mdp est correcte est bon, on l'édite
                                                if(ent.encode(req.body.oldPassW) == secondResult.mdp){
                                                    objetAediter.mdp = value;
                                                } else {
                                                    res.render('users/edition.jade', {title: 'Mon blog/ Edition', message: 'Le mot de passe saisi est incorrect.', user: req.session.user, moment: moment});
                                                };
                                            };
                                        };
                                    };
        // gère la description
                                } else if(property == 'nom' || property == 'prenom' || property == 'age' || property == 'presentation'){
                                    objetAediter['description.'+property] = value;
                                } else {
        // gere les attributs simples de premier niveau
                                    objetAediter[property] = value;
                                };
                            };
                        };
    // une fois que l'objet est pret, on update la bdd
                        collection.updateOne({_id: secondResult._id}, {$set: objetAediter}, function(){
                            req.session.user.pseudo = ent.decode(objetAediter.pseudo);
                            req.session.user.mail = ent.decode(objetAediter.mail);
                            req.session.save();
                            res.render('users/profil.jade', {title: 'Mon blog/ Profil', message: 'Modification(s) réussie(s)', user: req.session.user, moment: moment});
                        });
                    } else {
                        res.render('users/connection.jade', {title: 'Connection', message: messageErreur});
                    };
                });
            };
        };
    });
});

router.get('/deconnection', function(req, res, next){
    req.session.destroy(function(err){
        res.render('', {title: 'Accueil', message: 'Vous avez été déconnecté avec succés! A très bientôt!', jeuSolo: true});
    });
});

router.post('/traitementSuppression', function(req, res, next){
    var collection = db.get().collection('users');
    var title = 'Suppression du profil';
    var user = req.session.user;
    collection.findOne({$and: [{pseudo: ent.encode(user.pseudo)}, {mail: ent.encode(user.mail)}]}, function(err, result){
        if(err){
            res.render('users/suppression.jade', {title: title, message: 'Oops, quelque chose s\'est mal passé! merci de réessayer!', user: user});
        } else {
            if(result.mdp == ent.encode(req.body.passW)){
                collection.deleteOne({_id: result._id}, function(err, result){
                    if (err) {
                        res.render('users/suppression.jade', {title: title, message: 'Oops, quelque chose s\'est mal passé! merci de réessayer!', user: user});
                    } else {
                        req.session.destroy(function(err){
                            res.render('', {title: 'Accueil', message: 'Profil supprimé avec succés! J\'espère te revoir très vite!', user: user})
                        });
                    };
                });
            } else {
                res.render('users/suppression.jade', {title: title, message: 'Le mot de passe est incorrecte. Merci de réessayer!', user: user});
            };
        };
    });
});

/* GET users listing. */

router.get('/:maPage', function(req, res, next){
    var maPage = req.params.maPage;
    var user;
    if(req.session.user){
        user = req.session.user;
    };
    res.render('users/' + maPage, {title: maPage, user: user, moment: moment});
});

db.connect('mongodb://localhost:27017/blog', function(err){
    if(err){
        console.log('Impossible de se connecter à la base de données.' + err);
        process.exit(1);
    };
});

module.exports = router;