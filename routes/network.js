var express = require('express');
var router = express.Router();
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var moment = require('moment');
var ent = require('ent');
var db = require('./db');
var ObjectID = require('mongodb').ObjectID;
var multer = require('multer'); // gère lupload de fichiers
var fs = require('fs');
var upload = multer({ dest: 'public/images/uploads/nicEdit' });

function restriction(req, res, next){
    if(!req.session && !req.session.user){
        res.render('users/connection.jade', {titre: 'network', message: "C'est privé ici! Vous devez être connecté!"});
    };
    next();
};

router.use(restriction);

router.get('/mur/:profilDemande', function(req, res, next){
    var profilDemande = req.params.profilDemande;
    var collection = db.get().collection('users');
    collection.findOne({_id: new ObjectID(profilDemande)}, {mdp: 0}, function(err, result){
        if(result){
            var profil = {
                _id: result._id,
                pseudo: ent.decode(result.pseudo),
                mail: ent.decode(result.mail),
                dateCreation: result.dateCreation,
                derniereConnection: result.derniereConnection,
                description: {},
                coordonnees: {
                    adresse: {},
                    telephone: result.telephone
                }
            };
            if(result.description){
                if(result.description.nom){
                    profil.description.nom = ent.decode(result.description.nom)
                };
                if(result.description.prenom){
                    profil.description.prenom = ent.decode(result.description.prenom)
                };
                if(result.description.age){
                    profil.description.age = result.description.age
                };
                if(result.description.presentation){
                    profil.description.presentation = ent.decode(result.description.presentation)
                };
            };
            if(result.coordonnees && result.coordonnees.adresse){
                profil.coordonnees.adresse = {
                    adresseNumber: result.coordonnees.adresse.adresseNumber,
                    adresseRue: ent.decode(result.coordonnees.adresse.adresseRue),
                    adresseCP: result.coordonnees.adresse.adresseCP,
                    adresseVille: ent.decode(result.coordonnees.adresse.adresseVille)
                };
            };
            if(result.coordonnees && result.coordonnees.telephone){
                profil.coordonnees.telephone = result.coordonnees.telephone;
            };
            if(result.photoProfil){
                profil.photoProfil = result.photoProfil;
            };
            if(result.listeAmis){
                profil.listeAmis = result.listeAmis;
                for(var i = 0; result.listeAmis[i]; i++){
                    if(result.listeAmis[i]._id == req.session.user._id){
                        profil.isFriend = true;
                    };
                };
            };
            if(result.listePosts){
                profil.listePosts = result.listePosts;
            };
            var collectionArticles = db.get().collection('articles');
            collectionArticles.find({"nouvelArticle.profilId": profil._id.toString()}).toArray(function(err, data){
                if(data && data.length){
                    profil.articlesProfil = [];
                    for(var i=0; data[i]; i++){
                        data[i].nouvelArticle.auteurPseudo = ent.decode(data[i].nouvelArticle.auteurPseudo);
                        data[i].nouvelArticle.contenu = ent.decode(data[i].nouvelArticle.contenu);
                        if(profil._id == req.session.user._id || data[i].nouvelArticle.auteurId == req.session.user._id || profil.isFriend || req.session.user.droits == 'god' || req.session.user.droits == 'demiGod'){
                            var spanEditionArticle = '<div class="row text-center spanArticle"><p>';
                            spanEditionArticle+= '<a id="rep-'+ data[i]._id +'" class="repArticle" href="#'+ data[i]._id +'">Répondre</a>';
                            if(data[i].nouvelArticle.auteurId == req.session.user._id){
                                
                                spanEditionArticle+='<a id="edit-'+ data[i]._id +'" class="editArticle" href="#'+ data[i]._id +'">Edition</a>';
                            };
                            if(data[i].nouvelArticle.auteurId == req.session.user._id || profil._id == req.session.user._id || req.session.user.droits == 'god' || req.session.user.droits == 'demiGod'){
                                
                                spanEditionArticle+='<a id="sup-'+ data[i]._id +'" class="supArticle" href="#'+ data[i]._id +'">Suppression</a>';
                            };
                            spanEditionArticle+='</p></div>';
                        };
                        var listeDivReponses='';
                        if(data[i].nouvelArticle.reponses && data[i].nouvelArticle.reponses.length){
                            for(var j = 0; data[i].nouvelArticle.reponses[j]; j++){
                                var objetReponse = data[i].nouvelArticle.reponses[j];
                                if(objetReponse){
                                    var reponseCourante = '<div id="'+ objetReponse.id +'" class="row reponseArticle"><p class="col-xs-12 dateReponse">Message posté le : ' + moment(objetReponse.id).format("DD-MM-YYYY") + '</p><p class="col-xs-12">'+ objetReponse.auteurPseudo + ' a écrit:</p><p>' + ent.decode(objetReponse.contenu) + '</p>';
                                    if(profil._id == req.session.user._id || req.session.user._id == objetReponse.auteurId || req.session.user.droits == 'god' || req.session.user.droits == 'demiGod'){
                                        
                                        reponseCourante+='<p><a id="supRep-'+ objetReponse.id +'" class="supReponse" href="#'+ data[i]._id +'" title="supprimer Réponse">Supprimer</a></p>';
                                    };
                                    reponseCourante+= '</div>';
                                    listeDivReponses+=reponseCourante;
                                };
                            };
                            if(spanEditionArticle){
                                var articleAtransmettre = '<div id="'+ data[i]._id +'" class="unArticle"><div class="row auteurArticle"><p class="col-xs-12 dateCreaArticle">Message posté le : ' + moment(data[i].nouvelArticle.dateCreation).format("DD-MM-YYYY") + '</p><p class="col-xs-12">'+ data[i].nouvelArticle.auteurPseudo + ' a écrit:</p></div><div id="contenu-'+ data[i]._id +'" class="row contenuArticle">' + ent.decode(data[i].nouvelArticle.contenu) + '</div>' + spanEditionArticle + listeDivReponses + '</div>';
                            } else {
                                var articleAtransmettre = '<div id="'+ data[i]._id +'" class="unArticle"><div class="row auteurArticle"><p class="col-xs-12 dateCreaArticle">Message posté le : ' + moment(data[i].nouvelArticle.dateCreation).format("DD-MM-YYYY") + '</p><p class="col-xs-12">'+ data[i].nouvelArticle.auteurPseudo + ' a écrit:</p></div><div id="contenu-'+ data[i]._id +'" class="row contenuArticle">' + ent.decode(data[i].nouvelArticle.contenu) + '</div>' + listeDivReponses + '</div>';
                            };
                        } else {
                            var articleAtransmettre = '<div id="'+ data[i]._id +'" class="unArticle"><div class="row auteurArticle"><p class="col-xs-12 dateCreaArticle">Message posté le : ' + moment(data[i].nouvelArticle.dateCreation).format("DD-MM-YYYY") + '</p><p class="col-xs-12">'+ data[i].nouvelArticle.auteurPseudo + ' a écrit:</p></div><div id="contenu-'+ data[i]._id +'" class="row contenuArticle">' + ent.decode(data[i].nouvelArticle.contenu) + '</div>'+ spanEditionArticle;
                        };
                        profil.articlesProfil.unshift(articleAtransmettre);
                    };
                };
                res.render('network/pages/mur.jade', {titre: "network", user: req.session.user, profil: profil, moment: moment});
            });
        };
    });
});

router.get('/messagerie/own', function(req, res, next){
    var collection = db.get().collection('users');
    collection.findOne({_id: new ObjectID(req.session.user._id)}, {mdp: 0}, function(err, profil){
        var listeMessages = [];
        console.log(profil);
        console.log(profil.demandesAmis)
        if(profil.demandesAmis.length){
            for(var i = 0; profil.demandesAmis[i]; i++){
                var demande = profil.demandesAmis[i];
                if(profil.demandesAmis[i].statut != 'efface'){
                    var message = {
                        id: demande.id,
                        envoyeParId: new ObjectID(demande.demandeur.id),
                        envoyeParPseudo: demande.demandeur.pseudo,
                        recuParId: demande.userCible._id,
                        recuParPseudo: demande.userCible.pseudo,
                        date: demande.creation,
                        titre: "Demande d'amitié",
                        statut: demande.statut,
                        contenu: {
                            pseudoDemandeur: demande.demandeur.pseudo
                        },
                        dataType: 'demandeAmis'
                    }
                    if(demande.demandeur.photoProfil){
                        message.contenu.photoDemandeur = demande.demandeur.photoProfil
                    };
                    listeMessages.push(message);
                };
            };
        };
        if(profil.listeMessages.length){
            for(var i = 0; profil.listeMessages[i]; i++){
                var data = profil.listeMessages[i];
                var message = {
                    id: data.id,
                    envoyeParId: new ObjectID(data.envoyeParId),
                    envoyeParPseudo: ent.decode(data.envoyeParPseudo),
                    recuPar: new ObjectID(data.recuParID),
                    recuParPseudo: ent.decode(data.recuParPseudo),
                    date: data.date,
                    titre: ent.decode(data.titre),
                    contenu: ent.decode(data.contenu),
                    statut: data.statut,
                    dataType: 'messagePrive'
                };
                listeMessages.push(message);
            };
        };
        listeMessages.sort(function (a, b) {
            if (a.date > b.date)
              return 1;
            if (a.date < b.date)
              return -1;
            return 0;
        });
        res.render('network/messagerie/messagesListe.jade',{titre: 'network', user: req.session.user, listeMessages: listeMessages, moment: moment});
    });
});

router.get('/messagerie/ecrire', function(req, res, next){
    res.render('network/messagerie/messageEcrire.jade',{titre: 'network', user: req.session.user, moment: moment});
});

router.post('/messagerie/envoi', function(req, res, next){
    if(req.body.searchDest && req.body.titreMP && req.body.area1){
        var message = {
            id: Date.now(),
            envoyeParId: new ObjectID(req.session.user._id),
            envoyeParPseudo: req.session.user.pseudo,
            recuParId: new ObjectID(req.body.searchDest.split('-')[1]),
            recuParPseudo: ent.encode(req.body.searchDest.split('-')[0]),
            date: new Date(),
            titre: ent.encode(req.body.titreMP),
            statut: 'attente',
            contenu: ent.encode(req.body.area1),
            dataType: 'messagePrive'
        };
        var collection = db.get().collection('users');
        collection.updateOne({_id: message.envoyeParId}, {$push: {listeMessages: message}}, function(err, result){
            if(!err){
                collection.updateOne({_id: message.recuParId}, {$push: {listeMessages: message}}, function(err, result){
                    res.render('network/messagerie/messageEcrire.jade',{titre: 'network', user: req.session.user, moment: moment, message: 'Message bien envoyé à ' + message.recuParPseudo});
                });
            } else {
                res.render('network/messagerie/messageEcrire.jade',{titre: 'network', user: req.session.user, moment: moment, message: 'Une erreur est survenue, merci de recommencer'});
            };
        });
    } else {
        res.render('network/messagerie/messageEcrire.jade',{titre: 'network', user: req.session.user, moment: moment, message: 'Une erreur est survenue, merci de recommencer'});
    };
});

router.get('/messagerie/:messageDemande', function(req, res, next){
    var messageDemande = req.params.messageDemande;
    var collection = db.get().collection('users');
    if(messageDemande.split('-')[1] == 'demandeAmis'){
        collection.findOne({_id: new ObjectID(req.session.user._id), demandesAmis: {$elemMatch: {id: Number(messageDemande.split('-')[0])}}}, function(err, result){
            if(result){
                var message;
                if(result.demandesAmis){
                    for(var i=0; result.demandesAmis[i]; i++){
                        if(result.demandesAmis[i].statut != 'refuse'){
                            if(result.demandesAmis[i].id == Number(messageDemande.split('-')[0])){
                                message = {
                                    id: result.demandesAmis[i].id,
                                    envoyeParId: new ObjectID(result.demandesAmis[i].demandeur.id),
                                    envoyeParPseudo: result.demandesAmis[i].demandeur.pseudo,
                                    recuParId: result.demandesAmis[i].userCible._id,
                                    recuParPseudo: result.demandesAmis[i].userCible.pseudo,
                                    date: result.demandesAmis[i].creation,
                                    titre: "Demande d'amitié",
                                    statut: result.demandesAmis[i].statut,
                                    contenu: {
                                        pseudoDemandeur: result.demandesAmis[i].demandeur.pseudo
                                    },
                                    dataType: 'demandeAmis'
                                };
                                if(result.demandesAmis[i].demandeur.photoProfil){
                                    message.contenu.photoDemandeur = result.demandesAmis[i].demandeur.photoProfil
                                };
                            };
                        };
                    };
                };
                res.render('network/messagerie/messageAffichage.jade', {titre: 'network', user: req.session.user, messageLu: message, moment: moment});
            };
        });
    } else {
        collection.findOne({_id: new ObjectID(req.session.user._id), listeMessages: {$elemMatch: {id: Number(messageDemande.split('-')[0])}}}, function(err, result){
            if(!err && result){
                if(result.listeMessages){
                    for (var i=0; result.listeMessages[i]; i++){
                        if(result.listeMessages[i].id == Number(messageDemande.split('-')[0])){
                            var message = {
                                id: result.listeMessages[i].id,
                                envoyeParId: new ObjectID(result.listeMessages[i].envoyeParId),
                                envoyeParPseudo: result.listeMessages[i].envoyeParPseudo,
                                recuParId: result.listeMessages[i].recuParId,
                                recuParPseudo: result.listeMessages[i].recuParPseudo,
                                date: moment(result.listeMessages[i].data).format("DD-MM-YYYY"),
                                titre: ent.decode(result.listeMessages[i].titre),
                                statut: result.listeMessages[i].statut,
                                contenu: ent.decode(result.listeMessages[i].contenu),
                                dataType: result.listeMessages[i].dataType
                            };
                            if(result.listeMessages[i].photoProfil){
                                message.photoDemandeur = result.listeMessages[i].photoProfil
                            };
                        };
                    };
                };
                res.render('network/messagerie/messageAffichage.jade', {titre: 'network', user: req.session.user, messageLu: message, moment: moment});
            };
        });
    };
});

router.get('/newFriends/list', function(req, res, next){
    var collection = db.get().collection('users');
    collection.find().toArray(function(err, data){
        for(var i=0; data[i]; i++){
            if(data[i].demandesAmis){
                for(var j=0; data[i].demandesAmis[j]; j++){
                    if(data[i].demandesAmis[j].demandeur.id == req.session.user._id || data[i].demandesAmis[j].userCible._id == req.session.user._id){
                        data[i].isEnCours = true;
                    };
                };
            };
            if(data[i].listeAmis){
                for(var j=0; data[i].listeAmis[j]; j++){
                    if(data[i].listeAmis[j]._id == req.session.user._id){
                        data[i].isFriend = true;
                    };
                };
            };
        };
        res.render('network/pages/newFriends.jade',{titre: 'network', user: req.session.user, listeProfils: data, moment: moment});
    });
});

router.get('/newFriends/:choixUser', function(req, res, next){
    var choixUser = req.params.choixUser;
    var decision = choixUser.split('-')[0];
    var otherUserId = choixUser.split('-')[1];
    var idDemande = choixUser.split('-')[2];
    var collection = db.get().collection('users');
    if(decision != 'accept'){
        collection.update({demandesAmis: { $elemMatch: {id: Number(idDemande)}}}, {$pull: {demandesAmis: { id: Number(idDemande)}}}, {multi: true}, function(err, result){
            res.redirect('/network/messagerie/own');
        });
    } else {
        collection.findOne({_id: new ObjectID(otherUserId)}, {_id: 1, pseudo: 1, photoProfil: 1}, function(err, result){
            collection.updateOne({_id: new ObjectID(req.session.user._id)}, {$push: {listeAmis: result}}, function(err, result2){
                var currentUser = {
                    _id: new ObjectID(req.session.user._id),
                    pseudo: req.session.user.pseudo,
                    photoProfil: req.session.user.photoProfil
                };
                collection.updateOne({_id: new ObjectID(otherUserId)}, {$push: {listeAmis: currentUser}}, function(err, result3){
                    collection.update({demandesAmis: { $elemMatch: {id: Number(idDemande)}}}, {$pull: {demandesAmis: { id: Number(idDemande)}}}, {multi: true}, function(err, result4){
                        req.session.user.listeAmis.push(result);
                        req.session.save();
                        res.redirect('/network/messagerie/own');
                    });
                });
            });
        });
    };
});

router.get('/friends/:profilConsulte', function(req, res, next){
    var profilConsulte = req.params.profilConsulte;
    var collection = db.get().collection('users');
    collection.findOne({_id: new ObjectID(profilConsulte)}, {mdp: 0}, function(err, profil){
        res.render('network/pages/listeAmis.jade', {titre: 'network', user: req.session.user, profil: profil, moment: moment});
    });
});

router.get('/tchat/', function(req, res, next){
    res.render('network/pages/tchat.jade', {titre: 'network', user: req.session.user, moment: moment})
});

db.connect('mongodb://localhost:27017/blog', function(err){
    if(err){
        console.log('Impossible de se connecter à la base de données.' + err);
        process.exit(1);
    };
});

module.exports = router;