
var io = require('socket.io')();

//*********************************** JEU MULTI *******************************************************

// on crée le namespace

var nspJeuMulti = io.of('/ioJeuMulti');

var listeParties = [];


nspJeuMulti.on('connection', function (socket) {
    var user;
    var partie;
    var listeLoosers = [];
    var listeJoueurs = [];
    
    var testation = function(location){
        console.log(location)
        console.log('user');
        console.log(user);
        console.log('partie');
        console.log(partie);
        console.log('listeJoueurs');
        console.log(listeJoueurs);
        console.log('data');
        console.log(data);
    };
    
    var socketID = socket.id;
    socket.on('connectionUser', function(data) {
    // on materialise le user dans le websocket
        user = data;
    // on envoi la liste des parties en attente
        socket.emit('listeParties', listeParties);
        
        testation('connectionUser');
    });
    
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
    // faire un truc pour faire patienter le créateur de la partie
    });
    
    socket.on('rejoindrePartie', function(data){
        var partieArejoindre;
        for(var i = 0; listeParties[i]; i++){
            if(data.partieArejoindre.roomName == listeParties[i].roomName){
                listeParties[i].listeJoueurs.push(data.joueur.nom);
                var img = '../images/jeu2/sprites/' + data.joueur.image + '.png';
                listeParties[i].imagesJoueurs.push(img);
                partieArejoindre = listeParties[i];
            };
        };
    // on rejoind la room
        socket.join(partieArejoindre.roomName);
    // on vérifie si la partie est complète
        socket.emit('enAttente', {partie: partieArejoindre});
    // maj des parties en attente
        socket.broadcast.emit('listeParties', {partie: partie});
    });
    
    socket.on('enAttente', function(data){
        partie = data.partie;
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
            listeJoueurs.push(joueur);
        };
    // lorsque le dernier joueur est connecté, on informe le reste de la room, on envoie les paramètres de la partie
        socket.to(partie.roomName).emit('jouer', {listeJoueurs: listeJoueurs});
    // pareil pour le dernier joueur qui a rejoind la partie
        socket.emit('jouer', {listeJoueurs: listeJoueurs});
    });
    
    socket.on('jouer', function(data){
        if(partie){
        // ne pas toucher!!! informe les autres joueur qu'on a fait un truc ou non
            socket.to(partie.roomName).emit('jouer', {joueur: data});
        };
    });
    
    socket.on('rochers', function(data){
        if(partie){
            var rocher = data.rocher;
            socket.to(partie.roomName).emit('rochers', {rocher: rocher});
        };
    });
    
    socket.on('scoreJoueurs', function(data){
        if(partie){
            var score = data;
            var scoreInt = parseFloat(score.scoreJoueurs.height);
            if(scoreInt >= 100){
                listeLoosers.push(score.scoreJoueurs.nom);
                socket.emit('finJeu', {listeLoosers: listeLoosers});
            };
            socket.to(partie.roomName).emit('scoreJoueurs', {scoreJoueurs: score});
        }
    });
    
    socket.on('gagnant', function(data){
        var gagnant = data.gagnant;
        socket.to(partie.roomName).emit('gagnant', {gagnant: gagnant});
        socket.emit('gagnant', {gagnant: gagnant});
        for(var i =0; listeParties[i]; i++){
            if(listeParties[i].roomName == partie.roomName){
                listeParties.splice(i,1);
            };
        };
    });
    
    socket.on('disconnect', function () {
        if(partie){
            listeLoosers.push(user.nom);
            socket.to(partie.roomName).emit('finJeu', {listeLoosers: listeLoosers});
        };
    });
});


module.exports = io;