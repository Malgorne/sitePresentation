
var io = require('socket.io')(3001);        // charge socket.io
var db = require('./routes/db');            // charge MongoDB
var ObjectID = require('mongodb').ObjectID;
var session = require('express-session');
var ent = require('ent');
var moment = (require('moment'));
// on crée le namespace pour le jeu
var nspJeuMulti = io.of('/ioJeuMulti');
var listeParties = [];
nspJeuMulti.on('connection', function (socket) {
    var user;
    var partie;
    var socketID = socket.id;
    socket.on('connectionUser', function(user) {
    // on materialise le user dans le websocket
        user = user;
    // on envoi la liste des parties en attente
        socket.emit('listeParties', listeParties);
        socket.on('nouvellePartie', function (data) {
        // on récupère les parametres de la partie
            partie = data.partieCree;
        // on crée la room et on met à jour la partie
            var roomName = '/' + partie.listeJoueurs[0] + socketID;
            partie.roomName = roomName;
            partie.imagesJoueurs[0] = '../images/jeu2/sprites/' + partie.imagesJoueurs[0] + '.png';
        // on complète la liste de parties et on rejoind la room
            socket.join(roomName);
            listeParties.push(partie);
            socket.broadcast.emit('listeParties', {partie: partie});
            socket.emit('enAttente', {partie: partie});
        });
        socket.on('rejoindrePartie', function(data){
            partie = data.partieArejoindre;
        // on met à jour la partie, on va chercher les sprites
            for(var i = 0; listeParties[i]; i++){
                if(partie.roomName == listeParties[i].roomName){
                    listeParties[i].listeJoueurs.push(data.joueur.nom);
                    var img = '../images/jeu2/sprites/' + data.joueur.image + '.png';
                    listeParties[i].imagesJoueurs.push(img);
                    partie = listeParties[i];
                // on joint la room de la partie
                    socket.join(partie.roomName);
                };
            };
        // la partie est complète on démarre le jeu, on crée la position de chaque joueur
            if(partie.nbrJoueurs == partie.listeJoueurs.length){
                partie.nbrJoueurs = parseInt(partie.nbrJoueurs);
                var step = 600/(partie.nbrJoueurs+1);
                var leftJoueur = 0;
                for(var i = 0; partie.listeJoueurs[i]; i++){
                    leftJoueur += step;
                    var joueur = {
                        nom: partie.listeJoueurs[i],
                        backgroundImage: partie.imagesJoueurs[i],
                        left: leftJoueur-50
                    };
                    partie.listeJoueurs[i] = joueur;
                };
                socket.to(partie.roomName).emit('jouer', {listeJoueurs: partie.listeJoueurs});
            // pareil pour le dernier joueur qui a rejoind la partie
                socket.emit('jouer', {listeJoueurs: partie.listeJoueurs});
                socket.broadcast.emit('listeParties', {partie: partie});
            } else {
                socket.emit('enAttente', {partie: partie});
            };
        });
        socket.on('jouer', function(data){
            // informe les autres joueur qu'on a fait un truc
            socket.to(partie.roomName).emit('jouer', {joueur: data});
        });

        socket.on('rochers', function(data){
            var rocher = data.rocher;
            socket.to(partie.roomName).emit('rochers', {rocher: rocher});
        });
        socket.on('scoreJoueurs', function(data){
            if(partie){
                var score = data.scoreJoueurs;
                var scoreInt = parseFloat(data.scoreJoueurs.height);
            // gère la défaite d'un joueur
                if(scoreInt >= 100){
                    socket.emit('finJeu', {looser: score.nom});
                // on retire le joueur perdant de la partie
                    for(var i =0; partie.listeJoueurs[i]; i++){
                        if(score.nom == partie.listeJoueurs[i].nom){
                            partie.listeJoueurs.splice(i, 1);
                        // s'il reste juste un joueur en course, c'est quil a gagné
                            if(partie.listeJoueurs.length == 1){
                                socket.emit('finJeu', {winner: partie.listeJoueurs[0].nom});
                                socket.to(partie.roomName).emit('finJeu', {winner: partie.listeJoueurs[0].nom});
                                for(var j = 0; listeParties[j]; j++){
                                // on retire la partie du serveur
                                    if(listeParties[j].roomName == partie.roomName){
                                        listeParties.splice(j, 1);
                                    };
                                };
                            };
                        };
                    };
                };
            // tant quon na pas perdu on transmet le score
                socket.to(partie.roomName).emit('scoreJoueurs', {scoreJoueurs: score});
            };
        });
        socket.on('disconnect', function () {
        // retire la partie de la liste du serveur en cas de déco
            if(partie){
                for(var i = 0; listeParties[i]; i++){
                    for(var j = 0; listeParties[i].listeJoueurs[j]; j++){
                    // on retire de la partie le joueur qui s'est déco
                        if(user.user.nom == listeParties[i].listeJoueurs[j]){
                            listeParties[i].listeJoueurs.splice(j, 1);
                        };
                    };
                    if(listeParties[i].roomName == partie.roomName && listeParties[i].listeJoueurs.length == 0){
                    // sil ny a plus de joueur dans la partie, on lannule
                        socket.broadcast.emit('annulationPartie', {partie: listeParties[i].roomName});
                        listeParties.splice(i, 1);
                    };
                };
            };
        });
    });
});
var ioArticlesMurs = io.of('/ioArticlesMurs');
ioArticlesMurs.on('connection', function(socket){
    socket.on('consultationProfil', function(data){
        var profil = data.profil;
        var user = data.user;
        var collectionUsers = db.get().collection('users');
        var collectionArticles = db.get().collection('articles');
        socket.on('nouvelArticle', function(article){
            var nouvelArticle = {
                auteurId: user.id,
                auteurPseudo: user.pseudo,
                dateCreation: new Date(),
                profilId: profil.id,
                profilPseudo: profil.pseudo,
                contenu: ent.encode(article)
            };
            collectionArticles.insert({nouvelArticle: nouvelArticle}, function(err){
                if(!err){
                    collectionArticles.find().toArray(function(err, data){
                        var i = data.length-1;
                        nouvelArticle.id = data[i]._id;
                        collectionUsers.updateOne({_id: new ObjectID(profil.id)}, {$push: { articlesProfil: nouvelArticle }}, function(err){
                            if(!err){
                                var articleAtransmettre = '<div id="'+ nouvelArticle.id +'" class="unArticle"><div class="row auteurArticle"><p class="col-xs-12 dateCreaArticle">Message posté le : ' + moment(nouvelArticle.dateCreation).format("DD-MM-YYYY") + '</p><p class="col-xs-12">'+ nouvelArticle.auteurPseudo + ' a écrit:</p></div><div id="contenu-'+ nouvelArticle.id +'" class="row contenuArticle">' + ent.decode(nouvelArticle.contenu) + '</div><div class="row text-center spanArticle"><a id="edit-'+ nouvelArticle.id +'" class="editArticle" href="#'+ nouvelArticle.id +'">Edition</a><a id="sup-'+ nouvelArticle.id +'" class="supArticle" href="#'+ nouvelArticle.id +'">Suppression</a><a id="rep-'+ nouvelArticle.id +'" class="repArticle" href="#'+ nouvelArticle.id +'">Répondre</a></div></div>';
                                if(profil.id != user.id){
                                    collectionUsers.updateOne({_id: new ObjectID(user.id)}, {$push: { articlesPostes: nouvelArticle }}, function(err){
                                        if(!err){
                                            socket.emit('nouvelArticleSaved', {nouvelArticle: articleAtransmettre, idArticle: nouvelArticle.id});
                                        };
                                    });
                                } else {
                                    if(!err){
                                        socket.emit('nouvelArticleSaved', {nouvelArticle: articleAtransmettre, idArticle: nouvelArticle.id});
                                    };
                                };
                            };
                        });
                    });
                };
            });
        });
        socket.on('editArticle', function(article){
            var articleEdite = {
                contenu: ent.encode(article.contenu),
                id: article.id
            };
            collectionArticles.updateOne({_id: new ObjectID(articleEdite.id)}, {$set:{ "nouvelArticle.contenu": articleEdite.contenu}}, function(err, result){
                if(err){
                    console.log('dans lerreur');
                    console.log(err);
                } else {
                    collectionUsers.updateOne({articlesProfil: {$elemMatch: {id: new ObjectID(articleEdite.id)}}}, {$set:{ "articlesProfil.$.contenu": articleEdite.contenu }}, function(err2, result2){
                        if(err2){
                            console.log('dans lerreur');
                            console.log(err2);
                        } else {
                            collectionUsers.updateOne({articlesPostes: {$elemMatch: {id: new ObjectID(articleEdite.id)}}}, {$set:{ "articlesPostes.$.contenu": articleEdite.contenu }}, function(err3, result3){
                                if(err3){
                                    console.log('dans lerreur');
                                    console.log(err2);
                                } else {
                                    collectionArticles.findOne({_id: new ObjectID(articleEdite.id)}, function(err4, article){
                                        if(article){
                                            if(article.nouvelArticle.reponses && article.nouvelArticle.reponses.length){
                                                var listeDivReponses='';
                                                for(var i=0; article.nouvelArticle.reponses[i]; i++){
                                                    var objetReponse = article.nouvelArticle.reponses[i];
                                                    if(objetReponse){
                                                        var reponseCourante = '<div id="'+ objetReponse.id +'" class="row reponseArticle"><p class="col-xs-12 dateReponse">Message posté le : ' + moment(objetReponse.id).format("DD-MM-YYYY") + '</p><p class="col-xs-12">'+ objetReponse.auteurPseudo + ' a écrit:</p><p>' + ent.decode(objetReponse.contenu) + '</p><p><a id="supRep-'+ objetReponse.id +'" class="supReponse" href="#'+ objetReponse.articleId +'" title="supprimer Réponse">Supprimer</a></p></div>';
                                                        listeDivReponses += reponseCourante;
                                                    };
                                                };
                                                var articleAtransmettre = '<div id="'+ article._id +'" class="unArticle"><div class="row auteurArticle"><p class="col-xs-12 dateCreaArticle">Message posté le : ' + moment(article.nouvelArticle.dateCreation).format("DD-MM-YYYY") + '</p><p class="col-xs-12">'+ article.nouvelArticle.auteurPseudo + ' a écrit:</p></div><div id="contenu-'+ article._id +'" class="row contenuArticle">' + ent.decode(article.nouvelArticle.contenu) + '</div><div class="row text-center spanArticle"><a id="edit-'+ article._id +'" class="editArticle" href="#'+ article._id +'">Edition</a><a id="sup-'+ article._id +'" class="supArticle" href="#'+ article._id +'">Suppression</a><a id="rep-'+ article._id +'" class="repArticle" href="#'+ article._id +'">Répondre</a></div>'+ listeDivReponses +'</div>';
                                            } else {
                                                var articleAtransmettre = '<div id="'+ article._id +'" class="unArticle"><div class="row auteurArticle"><p class="col-xs-12 dateCreaArticle">Message posté le : ' + moment(article.nouvelArticle.dateCreation).format("DD-MM-YYYY") + '</p><p class="col-xs-12">'+ article.nouvelArticle.auteurPseudo + ' a écrit:</p></div><div id="contenu-'+ article._id +'" class="row contenuArticle">' + ent.decode(article.nouvelArticle.contenu) + '</div><div class="row text-center spanArticle"><a id="edit-'+ article._id +'" class="editArticle" href="#'+ article._id +'">Edition</a><a id="sup-'+ article._id +'" class="supArticle" href="#'+ article._id +'">Suppression</a><a id="rep-'+ article._id +'" class="repArticle" href="#'+ article._id +'">Répondre</a></div></div>';
                                            };
                                            socket.emit('editArticleSaved', {divArticle: articleAtransmettre, idArticle: article._id});
                                        };
                                    });
                                };
                            });
                        };
                    });
                };
            });
        });
        socket.on('supArticle', function(articleId){
            collectionArticles.remove({_id: new ObjectID(articleId)}, function(err1, result1){
                if(!err1){
                    collectionUsers.updateOne({articlesProfil: {$elemMatch: {id: new ObjectID(articleId)}}}, { $pull: { "articlesProfil": { id: new ObjectID(articleId)} }}, function(err2, result2){
                        if(!err2){
                            collectionUsers.findOne({articlesPostes: {$elemMatch: {id: new ObjectID(articleId)}}}, function(err, result){
                                if(result){
                                    collectionUsers.updateOne({articlesPostes: {$elemMatch: {id: new ObjectID(articleId)}}}, { $pull: { "articlesPostes": { id: new ObjectID(articleId)} }}, function(err3, result3){
                                        if(!err3){
                                            socket.emit('supArticleSaved', articleId);
                                        };
                                    });
                                } else {
                                    socket.emit('supArticleSaved', articleId);
                                };
                            });
                        };
                    });
                };
            });
        });
        socket.on('repArticle', function(data){
            var reponse = '';
            reponse = {
                id: Date.now(),
                auteurId: user.id,
                auteurPseudo: user.pseudo,
                contenu: ent.encode(data.reponse),
                articleId: data.articleId
            };
            collectionArticles.updateOne({_id: new ObjectID(reponse.articleId)}, {$push: { "nouvelArticle.reponses": reponse }}, function(err, result){
                if(!err){
                    collectionUsers.updateOne({articlesProfil: {$elemMatch: {id: new ObjectID(reponse.articleId)}}}, {$push:{ "articlesProfil.$.reponses": reponse }}, function(err, result){
                        if(!err){
                            var reponseAtransmettre = '<div id="'+ reponse.id +'" class="row reponseArticle"><p class="col-xs-12 dateReponse">Message posté le : ' + moment(reponse.id).format("DD-MM-YYYY") + '</p><p class="col-xs-12">'+ reponse.auteurPseudo + ' a écrit:</p><p>' + ent.decode(reponse.contenu) + '</p><p><a id="supRep-'+ reponse.id +'" class="supReponse" href="#'+ reponse.articleId +'" title="supprimer Réponse">Supprimer</a></p></div>';
                            if(profil.id != user.id){
                                collectionUsers.updateOne({_id: new ObjectID(reponse.auteurId)}, {$push: { "reponsesPostees": reponse }}, function(err, result){
                                    if(!err){
                                        socket.emit('repArticleSaved', {idReponse: reponse.id, idArticle: reponse.articleId, divReponse: reponseAtransmettre});
                                    };
                                });
                            } else {
                                socket.emit('repArticleSaved', {idReponse: reponse.id, idArticle: reponse.articleId, divReponse: reponseAtransmettre});
                            };
                        };
                    });
                };
            });
        });
        socket.on('supReponse', function(data){
            var collectionUsers = db.get().collection('users');
            var collectionArticles = db.get().collection('articles');
            collectionArticles.updateOne({_id: new ObjectID(data.articleId)},{ $pull: { "nouvelArticle.reponses": {id: Number(data.reponseId)}} }, function(err, result){
                if(!err){
                    collectionUsers.updateOne({articlesProfil: {$elemMatch: {id: new ObjectID(data.articleId)}}}, { $pull: { "articlesProfil.$.reponses": { id: Number(data.reponseId)} }}, function(err, result){
                        if(!err){
                            collectionUsers.findOne({reponsesPostes: {$elemMatch: {id: new ObjectID(data.articleId)}}}, function(err, result){
                                
                                if(!err){
                                    collectionUsers.updateOne({reponsesPostes: {$elemMatch: {id: Number(data.reponseId)}}}, { $pull: { "reponsesPostes": { id: Number(data.reponseId)} }}, function(err, result){
                                        console.log(err)
                                        console.log(result)
                                        if(!err){
                                            socket.emit('supReponseSaved', {articleId: data.articleId, reponseId: data.reponseId});
                                        };
                                    });
                                };
                            });
                        };
                    });
                };
            });
        });
    });
});
var ioFriends = io.of('/ioFriends');
ioFriends.on('connection', function(socket){
    socket.on('connectionFriends', function(data){
        var user = data.user;
        console.log(user)
        var collectionUsers = db.get().collection('users');
        socket.on('searchFriends', function(object){
            var data = object.value;
            var onSubmit = object.submit;
            collectionUsers.createIndex({"pseudo": "text", "description.nom": "text", "description.prenom": "text"});
            collectionUsers.find( {$or: [{$text: { $search: data, $caseSensitive: false }}]}, { score: { $meta: "textScore" }}).sort( { score: { $meta: "textScore" } } ).toArray(function(err, data){
                if(!err){
                    console.log(data)
                    if(onSubmit){
                        socket.emit('searchFriendsSubmitResult', data);
                    } else {
                        socket.emit('searchFriendsResult', data);
                    };
                };
            });
        });
        socket.on('addFriend', function(data){
            var demandeAmi = {
                id: Date.now(),
                creation: new Date(),
                demandeur: user,
                statut: 'attente'
            };
            collectionUsers.findOne({_id: new ObjectID(data)}, {_id: 1, pseudo: 1, photoProfil: 1}, function(err, cible){
                if(cible){
                    demandeAmi.userCible = cible;
                    console.log(demandeAmi)
                    collectionUsers.updateOne({_id: new ObjectID(user.id)}, {$push: {"demandesAmis": demandeAmi}}, function(err, result){
                        if(!err){
                            collectionUsers.updateOne({_id: new ObjectID(demandeAmi.userCible._id)}, {$push: {"demandesAmis": demandeAmi}}, function(err, result){
                                if(!err){
                                    socket.emit('addFriendSaved', demandeAmi);
                                };
                            });
                        };
                    });
                };
            });
        });
        socket.on('removeFriend', function(data){
            // on récupère l'id du friend à remove et celui du user qui supprime
            collectionUsers.updateOne({_id: new ObjectID(user._id)}, {$pull: {listeAmis: {_id: new ObjectID(data)}}}, function(err, result){
                if(!err){
                    collectionUsers.updateOne({_id: new ObjectID(data)}, {$pull: {listeAmis: {_id: new ObjectID(user._id)}}}, function(err, result){
                        if(!err){
                            socket.emit('removeFriendSaved', data);
                        };
                    });
                };
            });
        });
        
    });
});

var ioMessagerie = io.of('/ioMessagerie');
ioMessagerie.on('connection', function(socket){
    socket.on('connectionMessagerie', function(data){
        var user = data.user;
        var collectionUsers = db.get().collection('users');
        socket.on('suppMuliMessages', function(listeMessagesSup){
            var messToRemove = [];
            for(var i=0; listeMessagesSup[i]; i++){
                messToRemove[i] = {
                    id: Number(listeMessagesSup[i].split('-')[1])
                };
            };
            collectionUsers.update({_id: new ObjectID(user.id)}, {$pull: {listeMessages: {$or: messToRemove}}}, function(err, result){
                if(!err && result){
                    socket.emit('suppMuliMessagesSaved', listeMessagesSup);
                };
            });
        });
        socket.on('lectureMessage', function(data){
            var messageId = data.messageId;
            var messageType = data.messageType;
            var messageEmeteurId = data.messageEmeteurId;
            if(messageType == 'demandeAmis'){
                collectionUsers.update({demandesAmis: {$elemMatch: {id: Number(messageId)}}}, {$set: {"demandesAmis.$.statut": "lu"}}, {multi: true}, function(err, result){
                    var destination = '/network/messagerie/' + messageId+'-'+messageType;
                    socket.emit('lectureMessageConfirmed', {destination: destination, message: data});
                });
            } else if(messageType == 'messagePrive'){
                collectionUsers.updateOne({listeMessages: { $elemMatch: {id: Number(messageId)}}}, {$set: {"listeMessages.$.statut": "lu"}}, function(err, result){
                    if(!err && result){
                        var destination = '/network/messagerie/' + messageId+'-'+messageType;
                        socket.emit('lectureMessageConfirmed', {destination: destination, message: data});
                    };
                });
            };
        });
        socket.on('searchDest', function(object){
            var data = object.value;
            var onSubmit = object.submit;
            collectionUsers.createIndex({"pseudo": "text", "description.nom": "text", "description.prenom": "text"});
            collectionUsers.find( {$or: [{$text: { $search: data, $caseSensitive: false }}]}, { score: { $meta: "textScore" } } ).sort( { score: { $meta: "textScore" } } ).toArray(function(err, reponses){
                if(!err) {
                    var choixDest = [];
                    for(var i=0; reponses[i]; i++){
                        var reponse = {
                            id: reponses[i]._id,
                            pseudo: reponses[i].pseudo
                        };
                        if(reponses[i].photoProfil){
                            reponse.photoProfil = reponses[i].photoProfil
                        };
                        choixDest.push(reponse);
                    };
                    if(!onSubmit){
                        socket.emit('searchDestResult', choixDest)
                    };
                };
            });
        });
        socket.on('repMessage', function(data){
            var message = {
                id: Date.now(),
                envoyeParId: new ObjectID(user.id),
                envoyeParPseudo: user.pseudo,
                date: new Date(),
                titre: ent.encode('Rép:: ' + data.reponse.titre),
                statut: 'attente',
                contenu: ent.encode(data.reponse.contenu),
                dataType: 'messagePrive'
            };
            collectionUsers.findOne({_id: new ObjectID(data.refMessage.split('-')[3])}, {_id:1, pseudo:1}, function(err, result){
                message.recuParId = result._id;
                message.recuParPseudo = result.pseudo;
                collectionUsers.update({$or: [{_id: new ObjectID(message.envoyeParId)}, {_id: new ObjectID(message.recuParId)}]}, {$push: {listeMessages: message}}, {multi: true}, function(err, result){
                    var destination = '/network/messagerie/own';
                    socket.emit('repMessageSaved', destination)
                });
            });
        });
        socket.on('supMessage', function(messageId){
            collectionUsers.updateOne({_id: new ObjectID(user.id)}, { $pull: { listeMessages: {id: Number(messageId)}}}, function(err, result){
                if(!err){
                    console.log(result)
                    var destination = '/network/messagerie/own';
                    socket.emit('supMessageSaved', destination)
                };
            });
        });
    });
});

var ioTchat = io.of('/ioTchat');
var listeUsers = {};
var listeSalons = [
    'Général',
    'Actualité',
    'Sport',
    'Travail',
    'Informatique'
];
// on crée une liste de users pour chaque room
for(var i=0; listeSalons[i]; i++){
    listeUsers[listeSalons[i]] = [];
};
ioTchat.on('connection', function(socket){
    socket.on('connectionTchat', function(data){
        var user = data.user;
        user.socketId = socket.id;
        var roomCourante = 'Général';
    // on connecte le user à la room générale
        listeUsers[roomCourante].push(user);
        socket.join(roomCourante);
    // on informe la room emit et broadcast
    // on envoie la liste des salons et users déjà connectés au salon
        socket.emit('connectionSaved', {roomCourante: roomCourante, listeSalons: listeSalons, listeUsers: listeUsers[roomCourante]});
        socket.to(roomCourante).emit('connectionSaved', {roomCourante: roomCourante, listeSalons: listeSalons, listeUsers: listeUsers[roomCourante]});
    // lorsqu'on change de salon
        socket.on('rejoindreSalon', function(roomsName){
        // on supprime le user de la liste de la room quittée
            for(var i=0; listeUsers[roomsName.salonAquitter][i]; i++){
                if(listeUsers[roomsName.salonAquitter][i].id == user._id){
                    listeUsers[roomsName.salonAquitter].splice(i, 1);
                };
            };
        // on informe lancienne room que le user a quitté
            socket.to(roomsName.salonAquitter).emit('decoUser', user);
            socket.emit('decoUser', user);
        // on a joute le user à la liste de la nouvelle room
            listeUsers[roomsName.salonAjoindre].push(user);
        // et on le fait quitter lancienne room et rejoindre la nouvelle
            socket.leave(roomsName.salonAquitter);
            socket.join(roomsName.salonAjoindre);
            roomCourante = roomsName.salonAjoindre;
        // on informe la nouvelle room de la nouvelle connection
            socket.to(roomsName.salonAjoindre).emit('newConnection', user);
        // on envoie la liste des users connecté au nouvel arrivant
            var joindreUnSalon = false;
            for(var i=0; listeSalons[i]; i++){
                if(listeSalons[i] == roomsName.salonAjoindre ){
                    joindreUnSalon = true;
                };
            };
            if(joindreUnSalon){
                socket.emit('connectionSaved', {roomCourante: roomCourante, listeUsers: listeUsers[roomsName.salonAjoindre]});
            };
        });
    // on cas de déconnection on le supprime de la liste des connectés de la room, on informe le user et les autres
        socket.on('creationRoomPrivee', function(userCible){
            var nomRoomPrivee = userCible.id + '-' + user._id;
            var inversedNomRoomPrivee = user._id + '-' + userCible.id;
            var salonExiste = false;
            if(listeUsers.hasOwnProperty(nomRoomPrivee)){
                salonExiste = true;
            };
            if(listeUsers.hasOwnProperty(inversedNomRoomPrivee)){
                salonExiste = true;
            };
            if(!salonExiste){
                for(var i=0; listeUsers[roomCourante][i]; i++){
                    if(listeUsers[roomCourante][i].id == userCible.id){
                        userCible.socketId = listeUsers[roomCourante][i].socketId;
                    };
                };
                listeUsers[nomRoomPrivee] = [];
                listeUsers[nomRoomPrivee].push(user);
                listeUsers[nomRoomPrivee].push(userCible);
                socket.join(nomRoomPrivee);
                for(var i=0; listeUsers[nomRoomPrivee][i]; i++){
                    if(listeUsers[nomRoomPrivee][i].id == userCible.id){
                        var socketCiblee = listeUsers[nomRoomPrivee][i].socketId;
                        ioTchat.sockets[socketCiblee].join(nomRoomPrivee);
                    }
                };
            // on informe
                socket.to(nomRoomPrivee).emit('creationRoomPriveeSaved', {userCible: userCible, nomRoomPrivee: nomRoomPrivee, listeUsers: listeUsers[nomRoomPrivee]});
                socket.emit('creationRoomPriveeSaved', {userCible: userCible, nomRoomPrivee: nomRoomPrivee, listeUsers: listeUsers[nomRoomPrivee]});
            };
        });
        
        socket.on('invationRoomPrivee', function(data){
            var userToJoin = data.newUser;
            for(var i=0; listeUsers[data.roomCourante][i]; i++){
                if(listeUsers[data.roomCourante][i].id == userToJoin.id){
                    userToJoin.socketId = listeUsers[data.roomCourante][i].socketId;
                };
            };
        // on ajoute le usercible à la liste et au socket
            listeUsers[data.room].push(userToJoin);
            ioTchat.sockets[userToJoin.socketId].join(data.room);
        // informe le reste du salon privé
            socket.to(data.room).emit('invationRoomPriveeSaved', {userCible: userToJoin, nomRoomPrivee: data.room});
        // informe l'émetteur
            socket.emit('invationRoomPriveeSaved', {userCible: userToJoin, nomRoomPrivee: data.room});
            console.log(data)
        // lance la création du salonPrivé
            ioTchat.sockets[userToJoin.socketId].emit('creationRoomPriveeSaved', {userCible: userToJoin, nomRoomPrivee: data.room, listeUsers: listeUsers[data.room]});
        });
        socket.on('deconnectionRoomPrivee', function(data){
            var roomVide = false;
            for(var i=0; listeUsers[data.roomId][i]; i++){
                if(listeUsers[data.roomId][i].id == data.userId){
                    listeUsers[data.roomId].splice(i,1);
                    socket.leave(data.roomId);
                    socket.to(data.roomId).emit('deconnectionRoomPriveeSaved', {roomId: data.roomId, userId: data.userId});
                    socket.emit('deconnectionRoomPriveeSaved', {roomId: data.roomId, userId: data.userId});
                };
                if(listeUsers[data.roomId] && !listeUsers[data.roomId].length){
                    roomVide = true;
                };
            };
             if(roomVide){
                delete listeUsers[data.roomId];
            };
        });
        socket.on('envoieMessage', function(messageRecu){
            var dansRoomCourante = false;
            for(var i=0; listeSalons[i]; i++){
                if(messageRecu.roomId == listeSalons[i]){
                    dansRoomCourante = true;
                };
            };
            if(dansRoomCourante){
                messageRecu.mainAff = 'roomCourante';
            } else {
                messageRecu.mainAff = messageRecu.roomId
            };
            messageRecu.contenu = ent.encode(messageRecu.contenu);
            messageRecu.date = moment(new Date()).format("h:mm:ss a");
            socket.to(messageRecu.roomId).emit('receptionMessage', messageRecu);
            socket.emit('receptionMessage', messageRecu);
        });
        socket.on('disconnect', function () {
        // retire la partie de la liste du serveur en cas de déco
            for(var uneListe in listeUsers){
                if(listeUsers.hasOwnProperty(uneListe)){
                    for(var i=0; listeUsers[uneListe][i]; i++){
                        if(listeUsers[uneListe][i].id == user._id){
                            listeUsers[uneListe].splice(i,1);
                            socket.leave(uneListe);
                            socket.to(uneListe).emit('decoUser', user);
                        };
                    };
                };
            };
        });
    });
});

// LE FORUM

var ioForum = io.of('/ioForum');
// on crée une liste de users pour chaque room
ioForum.on('connection', function(socket){
    socket.on('connectionForum', function(data){
        
    });
});


db.connect('mongodb://localhost:27017/blog', function(err){
    if(err){
        console.log('Impossible de se connecter à la base de données.' + err);
        process.exit(1);
    };
});

module.exports = io;