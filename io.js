
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
                        if(!err){
                            var i = data.length-1;
                            nouvelArticle.id = data[i]._id;

                            var articleAtransmettre = '<div id="'+ nouvelArticle.id +'" class="unArticle"><div class="row auteurArticle"><p class="col-xs-12 dateCreaArticle">Message posté le : ' + moment(nouvelArticle.dateCreation).format("DD-MM-YYYY") + '</p><p class="col-xs-12">'+ nouvelArticle.auteurPseudo + ' a écrit:</p></div><div id="contenu-'+ nouvelArticle.id +'" class="row contenuArticle">' + ent.decode(nouvelArticle.contenu) + '</div><div class="row text-center spanArticle"><a id="edit-'+ nouvelArticle.id +'" class="editArticle" href="#'+ nouvelArticle.id +'">Edition</a><a id="sup-'+ nouvelArticle.id +'" class="supArticle" href="#'+ nouvelArticle.id +'">Suppression</a><a id="rep-'+ nouvelArticle.id +'" class="repArticle" href="#'+ nouvelArticle.id +'">Répondre</a></div></div>';

                            socket.emit('nouvelArticleSaved', {nouvelArticle: articleAtransmettre, idArticle: nouvelArticle.id});
                        };
                    });
                }
            });
        });
        socket.on('editArticle', function(article){
            var articleEdite = {
                contenu: ent.encode(article.contenu),
                id: article.id
            };
            collectionArticles.updateOne({_id: new ObjectID(articleEdite.id)}, {$set:{ "nouvelArticle.contenu": articleEdite.contenu}}, function(err, result){
                if(!err) {
                    collectionArticles.findOne({_id: new ObjectID(articleEdite.id)}, function(err, article){
                        if(!err && article){
                            if(article.nouvelArticle.reponses && article.nouvelArticle.reponses.length){
                                var listeDivReponses='';
                                for(var i=0; article.nouvelArticle.reponses[i]; i++){
                                    var objetReponse = article.nouvelArticle.reponses[i];
                                    if(objetReponse){
                                        var reponseCourante = '<div id="'+ objetReponse.id +'" class="row reponseArticle"><p class="col-xs-12 dateReponse">Message posté le : ' + moment(objetReponse.id).format("DD-MM-YYYY") + '</p><p class="col-xs-12">'+ objetReponse.auteurPseudo + ' a écrit:</p><p>' + ent.decode(objetReponse.contenu) + '</p><p><a id="supRep-'+ objetReponse.id +'" class="supReponse" href="#'+ objetReponse.articleId +'" title="supprimer Réponse">Supprimer</a></p></div>';
                                        listeDivReponses += reponseCourante;
                                    };
                                    var articleAtransmettre = '<div id="'+ article._id +'" class="unArticle"><div class="row auteurArticle"><p class="col-xs-12 dateCreaArticle">Message posté le : ' + moment(article.nouvelArticle.dateCreation).format("DD-MM-YYYY") + '</p><p class="col-xs-12">'+ article.nouvelArticle.auteurPseudo + ' a écrit:</p></div><div id="contenu-'+ article._id +'" class="row contenuArticle">' + ent.decode(article.nouvelArticle.contenu) + '</div><div class="row text-center spanArticle"><a id="edit-'+ article._id +'" class="editArticle" href="#'+ article._id +'">Edition</a><a id="sup-'+ article._id +'" class="supArticle" href="#'+ article._id +'">Suppression</a><a id="rep-'+ article._id +'" class="repArticle" href="#'+ article._id +'">Répondre</a></div>'+ listeDivReponses +'</div>';
                                };
                                
                            } else {
                                var articleAtransmettre = '<div id="'+ article._id +'" class="unArticle"><div class="row auteurArticle"><p class="col-xs-12 dateCreaArticle">Message posté le : ' + moment(article.nouvelArticle.dateCreation).format("DD-MM-YYYY") + '</p><p class="col-xs-12">'+ article.nouvelArticle.auteurPseudo + ' a écrit:</p></div><div id="contenu-'+ article._id +'" class="row contenuArticle">' + ent.decode(article.nouvelArticle.contenu) + '</div><div class="row text-center spanArticle"><a id="edit-'+ article._id +'" class="editArticle" href="#'+ article._id +'">Edition</a><a id="sup-'+ article._id +'" class="supArticle" href="#'+ article._id +'">Suppression</a><a id="rep-'+ article._id +'" class="repArticle" href="#'+ article._id +'">Répondre</a></div></div>';
                            };
                            socket.emit('editArticleSaved', {divArticle: articleAtransmettre, idArticle: article._id});
                        };
                    });
                };
            });
        });
        socket.on('supArticle', function(articleId){
            collectionArticles.remove({_id: new ObjectID(articleId)}, function(err, result){
                if(!err){
                    socket.emit('supArticleSaved', articleId);
                };
            });
        });
        socket.on('repArticle', function(data){
            var reponse = {
                id: Date.now(),
                auteurId: user.id,
                auteurPseudo: user.pseudo,
                contenu: ent.encode(data.reponse),
                articleId: data.articleId
            };
            collectionArticles.updateOne({_id: new ObjectID(reponse.articleId)}, {$push: { "nouvelArticle.reponses": reponse }}, function(err, result){
                if(!err){
                    var reponseAtransmettre = '<div id="'+ reponse.id +'" class="row reponseArticle"><p class="col-xs-12 dateReponse">Message posté le : ' + moment(reponse.id).format("DD-MM-YYYY") + '</p><p class="col-xs-12">'+ reponse.auteurPseudo + ' a écrit:</p><p>' + ent.decode(reponse.contenu) + '</p><p><a id="supRep-'+ reponse.id +'" class="supReponse" href="#'+ reponse.articleId +'" title="supprimer Réponse">Supprimer</a></p></div>';
                    
                    socket.emit('repArticleSaved', {idReponse: reponse.id, idArticle: reponse.articleId, divReponse: reponseAtransmettre});
                };
            });
        });
        socket.on('supReponse', function(data){
            var collectionArticles = db.get().collection('articles');
            collectionArticles.updateOne({_id: new ObjectID(data.articleId)},{ $pull: { "nouvelArticle.reponses": {id: Number(data.reponseId)}} }, function(err, result){
                if(!err){
                    socket.emit('supReponseSaved', {articleId: data.articleId, reponseId: data.reponseId});
                };
            });
        });
    });
});

var ioFriends = io.of('/ioFriends');
ioFriends.on('connection', function(socket){
    socket.on('connectionFriends', function(data){
        var user = data.user;
        var collectionUsers = db.get().collection('users');
        socket.on('searchOwnFriends', function(object){
            var onSubmit = object.submit;
            collectionUsers.findOne({_id: new ObjectID(user.id)}, {_id: 0, listeAmis: 1}, function(err, result){
                if(result.listeAmis && result.listeAmis.length){
                    var listeAmis=[];
                    for(var i=0; result.listeAmis[i]; i++){
                        if(result.listeAmis[i].pseudo.toLowerCase() == object.value.toLowerCase()){
                            listeAmis.push({_id: new ObjectID(result.listeAmis[i]._id)})
                        };
                    };
                    collectionUsers.find({$or: listeAmis}, {mdp:0}).toArray(function(err, liste){
                        if(liste && liste.length){
                            if(onSubmit){
                                socket.emit('searchFriendsSubmitResult', liste);
                            } else {
                                socket.emit('searchFriendsResult', liste);
                            };
                        };
                    });
                };
            });
        });
        
        
        socket.on('searchFriends', function(object){
            var data = object.value;
            var onSubmit = object.submit;
        // recherche textuelle, on crée un index
            collectionUsers.createIndex({"pseudo": "text", "description.nom": "text", "description.prenom": "text"});
            collectionUsers.find( {$or: [{$text: { $search: data, $caseSensitive: false }}]}, { score: { $meta: "textScore" }}).sort( { score: { $meta: "textScore" } } ).toArray(function(err, data){
                if(!err){
                    if(data.length){
                        collectionUsers.findOne({_id: new ObjectID(user.id)}, {listeAmis: 1, demandesAmis: 1}, function(err, result){
                    // pour chaque autre user trouvé, on vérifie
                            for(var i=0; data[i]; i++){
                                var aRemove = false;
                            // si il a des amis
                                if(result.listeAmis.length){
                                    for(var j=0; result.listeAmis[j]; j++){
                                // sils sont amis, on le splice
                                        if(data[i]._id.toString() == result.listeAmis[j]._id.toString()){
                                            aRemove = true;
                                        };
                                    };
                                };
                    // pareil pour les demandes d'amis (ils sont visibles dans la messagerie)
                                if(result.demandesAmis.length){
                                    for(var j=0; result.demandesAmis[j]; j++){
                                        if(data[i]._id.toString() == result.demandesAmis[j].demandeur.id.toString() || data[i]._id.toString() == result.demandesAmis[j].userCible._id.toString()){
                                            aRemove = true;
                                        };
                                    };
                                };
                                if(aRemove){
                                    data.splice(i, 1);
                                };
                            };
                            if(onSubmit){
                                socket.emit('searchFriendsSubmitResult', data);
                            } else {
                                socket.emit('searchFriendsResult', data);
                            };
                        });
                    };
                };
            })
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
            collectionUsers.updateOne({_id: new ObjectID(user.id)}, {$pull: {listeAmis: {_id: new ObjectID(data)}}}, function(err, result){
                if(!err){
                    collectionUsers.updateOne({_id: new ObjectID(data)}, {$pull: {listeAmis: {_id: new ObjectID(user.id)}}}, function(err, result){
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
                if(listeUsers[roomsName.salonAquitter][i].id == user.id){
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
            var nomRoomPrivee = userCible.id + '-' + user.id;
            var inversedNomRoomPrivee = user.id + '-' + userCible.id;
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
                        if(listeUsers[uneListe][i].id == user.id){
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

// LADMIN
var ioAdmin = io.of('/ioAdmin');

ioAdmin.on('connection', function(socket){
    socket.on('connectionAdmin', function(data){
        var admin = data.user;
        var profilGere = data.profil;
        var collectionUsers = db.get().collection('users');
        var collectionArticles = db.get().collection('articles');
// modération des articles du mur
        socket.on('modeArticle', function(articleId){
            collectionArticles.remove({_id: new ObjectID(articleId)}, function(err, result){
                if(!err){
                    var message = "L'article " + articleId + ' a bien été supprimé.';
                    socket.emit('modeSaved', {objectId: articleId, type: 'art-', message: message});
                };
            });
        });
// modération des réponses
        socket.on('modeReponse', function(reponseId){
            collectionArticles.update({"nouvelArticle.reponses": {$elemMatch: {id: Number(reponseId)}}}, { $pull: { "nouvelArticle.reponses": {id: Number(reponseId)}} }, function(err, result){
                if(result){
                    var message = "La réponse " + reponseId + ' a bien été supprimée.';
                    socket.emit('modeSaved', {objectId: reponseId, type: 'rep-', message: message});
                };
            });
        });
// modération des messages privés
        socket.on('modeMessage', function(messageId){
            collectionUsers.update({listeMessages: {$elemMatch: {id: Number(messageId)}}}, { $pull: { "listeMessages": {id: Number(messageId)}} }, {multi: true}, function(err, result){
                if(!err){
                    var message = "Le message " + messageId + ' a bien été supprimé.';
                    socket.emit('modeSaved', {objectId: messageId, type: 'mess-', message: message});
                };
            });
        });
// changement des droits
        socket.on('modeDroits', function(droits){
            droits = ent.encode(droits);
            collectionUsers.updateOne({_id: new ObjectID(profilGere.id)}, {$set: {droits: droits}}, function(err, result){
                if(!err){
                    socket.emit('modeDroitsSaved', droits)
                };
            });
        });
// gère avertissements
        socket.on('modeAvertissement', function(object){
            var choix = object.split('-')[0];
            var user = object.split('-')[1];
            profilGere.avertissements = Number(profilGere.avertissements);
            if(choix == 'addA'){
                profilGere.avertissements+=1;
                var query = { $inc: {"avertissements": +1}, $set: {"dernierAvertissement": new Date()} };
            };
            if(choix == 'supA' && profilGere.avertissements>0){
                profilGere.avertissements-=1;
                var query = { $inc: {"avertissements": -1} };
            };
            if(query){
                collectionUsers.updateOne({_id: new ObjectID(profilGere.id)}, query, function(err, result){
                    if(!err){
                        collectionUsers.findOne({_id: new ObjectID(profilGere.id)}, {_id: 0, avertissements: 1, dernierAvertissement: 1}, function(err, data){
                            if(!err){
                                data.dernierAvertissement = moment(data.dernierAvertissement).format("DD-MM-YYYY");
                                socket.emit('modeAvertissementSaved', data);
                            };
                        });
                    };
                });
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