
var io = require('socket.io')();

//*********************************** JEU MULTI *******************************************************

// on crée le namespace

var nspJeuMulti = io.of('/ioJeuMulti');

var listeParties = [];


nspJeuMulti.on('connection', function (socket, truc) {
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
                    if(listeParties[i].roomName == partie.roomName){
                        listeParties.splice(i, 1);
                    };
                };
            };
        });
    });
    
    
});


module.exports = io;