var socket = io('/ioJeuMulti');
$(document).ready(function(){
    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

// On checke le serveur et on fait le namespace
    
// On recrée la variable user qui représente le joueur dans le websocket
    var user = {
        nom: nomUser
    };
    var ownPerso;
    var scoreJoueur = {};
    var partie;
    var start;
    
    var listeSpritesPerso = [
            'Broly',
            'Bubu',
            'Cell',
            'Krillin',
            'Sangoku',
            'Vegeta'
        ];
    
    var positionsSprites = {
        Broly: {
            initiale: {
                top: '0px',
                left: '35px'
            },
            kayoken: {
                top: '-398px',
                left: '35px'
            },
            echec: {
                top: '-673px',
                left: '35px'
            },
            defaite: {
                top: '-1035px',
                left: '35px'
            }
        },
        Bubu: {
            initiale: {
                top: '3px',
                left: '28px'
            },
            kayoken: {
                top: '-136px',
                left: '33px'
            },
            echec: {
                top: '-311px',
                left: '22px'
            },
            defaite: {
                top: '-555px',
                left: '22px'
            }
        },
        Cell: {
            initiale: {
                top: '-1px',
                left: '33px'
            },
            kayoken: {
                top: '-206px',
                left: '30px'
            },
            echec: {
                top: '-432px',
                left: '25px'
            },
            defaite: {
                top: '-662px',
                left: '25px'
            }
        },
        Krillin: {
            initiale: {
                top: '4px',
                left: '36px'
            },
            kayoken: {
                top: '-151px',
                left: '36px'
            },
            echec: {
                top: '-283px',
                left: '36px'
            },
            defaite: {
                top: '-473px',
                left: '36px'
            }
        },
        Sangoku: {
            initiale: {
                top: '2px',
                left: '40px'
            },
            kayoken: {
                top: '-186px',
                left: '40px'
            },
            echec: {
                top: '-378px',
                left: '40px'
            },
            defaite: {
                top: '-539px',
                left: '40px'
            }
        },
        Vegeta: {
            initiale: {
                top: '1px',
                left: '33px'
            },
            kayoken: {
                top: '-162px',
                left: '33px'
            },
            echec: {
                top: '-344px',
                left: '33px'
            },
            defaite: {
                top: '-544px',
                left: '33px'
            }
        }
    };
    
    socket.emit('connectionUser', {user: user});
    
    socket.on('listeParties', function(listeParties){
        if(Array.isArray(listeParties)){
            for(var i = 0; listeParties[i]; i++){
                var partieArejoindre = listeParties[i];
                creationParamsParties(partieArejoindre);
            };
        } else {
            partieArejoindre = listeParties.partie;
            creationParamsParties(partieArejoindre);
        };
    });
    
    socket.on('enAttente', function(data){
        partie = data.partie;
        room = partie.roomName;
        
        if(partie.listeJoueurs.length == partie.nbrJoueurs){
            partie.complet = true;
            socket.emit('enAttente', {partie: partie});
        };
    });
// reçoit les scores des autres joueurs
    socket.on('jouer', function(data){
    // gère les persos
        var listePersos = data.listeJoueurs;
        var listeAutresPersos = [];
    // lancement du jeu
        if(Array.isArray(listePersos)){
        // on supprime les choix
            $('#choixPersonnage').remove();
            $('#videoAttente').remove();
            $('#informationAttente').remove();
        // on fabrique l'aire de jeu et on l'attache
            var terrainDeJeu = document.createElement('div');
            $(terrainDeJeu).attr('id', 'bacASable');
            $('#parametragePartie').append(terrainDeJeu);
            for(var i = 0; listePersos[i]; i++){
    // MON PERSO
                if(user.nom == listePersos[i].nom){
                    ownPerso = listePersos[i];
                    creationJoueurs(ownPerso);
                // lance la génération des rochers
                    ownPerso.normal();
                    start = true;
                    setInterval(function(){
                        /*genererRochers()*/
                    }, 5000);
                } else {
    // AUTRES PERSO
                    var otherPerso = listePersos[i];
                    creationJoueurs(otherPerso);
                    
                    listeAutresPersos.push(otherPerso);
                    if(otherPerso.status == 'kayoken'){
                        energie.animation(otherPerso);
                    };
                };
            };
        } else {
    // reçoit les infos des autres joueurs
            var joueur = data.joueur.joueur;
            var monSprite = /^..\/images\/jeu2\/sprites\/(\S+)\.png$/.exec(joueur.backgroundImage);
            monSprite = RegExp.$1;
            
            switch(joueur.status){
                case 'initial':
                    $('#img' + joueur.nom).css({top: positionsSprites[monSprite].initiale.top, left: positionsSprites[monSprite].initiale.left});
                    break;
                case 'kayoken':
                    $('#img' + joueur.nom).css({top: positionsSprites[monSprite].kayoken.top, left: positionsSprites[monSprite].kayoken.left});
                    energie.animation(joueur);
                    break;
                case 'echec':
                    $('#img' + joueur.nom).css({top: positionsSprites[monSprite].echec.top, left: positionsSprites[monSprite].echec.left});
                    break;
                case 'defaite':
                    $('#img' + joueur.nom).css({top: positionsSprites[monSprite].defaite.top, left: positionsSprites[monSprite].defaite.left});
                    break;
                default:
                    break;
            };
        };
    });
    
    socket.on('scoreJoueurs', function(data){
        var scoreAutreJoueur = data.scoreJoueurs.scoreJoueurs;
        $('#scoreJoueur' + scoreAutreJoueur.nom).css({height: scoreAutreJoueur.height});
    });
    
// SETINTERVAL DANS LE SET TIMEOUT
    
    var genererRochers = function(){
        var interval = Math.random()*(8 - 4) + 4;
        var rocher = {
            nom: ownPerso.nom,
            left: ownPerso.leftDiv
        };
        var nouveauRocher = document.createElement('div');
        $(nouveauRocher).attr('id', 'rocher' + rocher.nom).addClass('rochers').css({left: rocher.left + 20 + 'px'});
        $('#bacASable').append(nouveauRocher);
        setTimeout(function() {
            genererRochers();
        }, 1000 * interval);
        socket.emit('rochers', {rocher: rocher});
    };
// vérifie position et collision
    setInterval(function(){
        if(start){
            if($('#rocher'+ownPerso.nom).length){
                var positionRocher = parseFloat($('#rocher'+ownPerso.nom).css('top'));

                if(positionRocher > 230){
                    if(ownPerso.status != 'kayoken'){
                        $('#scoreJoueur' + ownPerso.nom).css({height: '+=20'});
                        scoreJoueur.nom = ownPerso.nom;
                        ownPerso.echec();
                        scoreJoueur.height = $('#scoreJoueur' + ownPerso.nom).css('height');
                        socket.emit('scoreJoueurs', {scoreJoueurs: scoreJoueur});
                    };
                    $('#rocher' + ownPerso.nom).remove();
                };
            };
        };
    }, 50);
    
// gère la position des rochers des autres
    socket.on('rochers', function(data){
        if(ownPerso.status != 'defaite'){
            var otherRocher = data.rocher;
            var divOtherRocher = document.createElement('div');
            var positionRocher;
            $(divOtherRocher).attr('id', 'otherRocher' + otherRocher.nom).addClass('rochers').css({left: otherRocher.left + 'px'});
            $('#bacASable').append(divOtherRocher);
            setInterval(function(){
                if($('#otherRocher' + otherRocher.nom).length){
                    var positionRocher = parseFloat($(divOtherRocher).css('top'));
                    if(positionRocher > 230){
                        $('#otherRocher' + otherRocher.nom).remove();
                    };
                };
            }, 50);
        };
    });
    
    socket.on('finJeu', function(data){
        var listeLoosers = data.listeLoosers;
        for(var i = 0; listeLoosers[i]; i++){
            if(ownPerso.nom == listeLoosers[i]){
                ownPerso.defaite();
            };
        };
        if(listeLoosers.length == (partie.nbrJoueurs-1)){
            var gagnant = $(partie.listeJoueurs).not(listeLoosers).get();
            socket.emit('gagnant', {gagnant: gagnant});
        };
    });
    
    socket.on('gagnant', function(data){
        var gagnant = data.gagnant[0];
        $('#bacASable').remove();
        var finDuJeu = document.createElement('div');
        $(finDuJeu).addClass('finDuJeu').html('Et le gagnant est: ' + gagnant);
        $('#parametragePartie').append(finDuJeu);
    });
    
    var creationJoueurs = function(unJoueur){
        var nomJoueur = unJoueur.nom;
    // on fabrique les div avec img
        var divJoueur = document.createElement('div');
        $(divJoueur).attr('id', 'divJoueur' + unJoueur.nom).addClass('divJoueurs');
        $(divJoueur).css({ left: unJoueur.left + 'px', top: '300px'});
    // affiche l'énergie totale
        var containerScoreJoueur = document.createElement('div');
        $(containerScoreJoueur).attr('id', 'containerScoreJoueur' + unJoueur.nom);
        $(containerScoreJoueur).addClass('containerScore');
        $(divJoueur).append(containerScoreJoueur);
    // affiche energie restante
        var scoreJoueur = document.createElement('div');
        $(scoreJoueur).attr('id', 'scoreJoueur' + unJoueur.nom);
        $(scoreJoueur).addClass('scoreJoueur');
        $(containerScoreJoueur).append(scoreJoueur);
    // affiche l'image du joueur
        var imageJoueur = document.createElement('img');
        $(imageJoueur).attr({src: unJoueur.backgroundImage, id: 'img' + unJoueur.nom}).css({ position: 'absolute'});
        $(divJoueur).append(imageJoueur);
    // on attache chaque div au jeu
        $('#bacASable').append(divJoueur);
    // on sélectionne le personnage du joueur
        var monSprite = /^..\/images\/jeu2\/sprites\/(\S+)\.png$/.exec(unJoueur.backgroundImage);
        monSprite = RegExp.$1;
        
    // on attache les méthodes de jeu de SON PERSO
        if(user.nom == nomJoueur){
            ownPerso.status = 'normal';
            ownPerso.leftDiv = unJoueur.left;
            ownPerso.normal = function(){
                $('#img' + nomJoueur).css({top: positionsSprites[monSprite].initiale.top, left: positionsSprites[monSprite].initiale.left});
                
                this.top = positionsSprites[monSprite].initiale.top;
                this.left = positionsSprites[monSprite].initiale.left;
                this.status = 'initial';
                
                socket.emit('jouer', {joueur: ownPerso});
            };
            ownPerso.kayoken = function(){
                
                $('#img' + nomJoueur).css({top: positionsSprites[monSprite].kayoken.top, left: positionsSprites[monSprite].kayoken.left});
                
            // anime le kayoken et diminue l'énergie
                energie.animation(ownPerso);

                this.top = positionsSprites[monSprite].kayoken.top;
                this.left = positionsSprites[monSprite].kayoken.left;
                this.status = 'kayoken';
                
                $('#scoreJoueur' + ownPerso.nom).css({height: '+=3'});
                scoreJoueur.nom = ownPerso.nom;
                
                
                scoreJoueur.height = $('#scoreJoueur' + ownPerso.nom).css('height');
                
                socket.emit('scoreJoueurs', {scoreJoueurs: scoreJoueur});
                socket.emit('jouer', {joueur: ownPerso});
            };
            ownPerso.echec = function(){
                if(ownPerso.status != 'defaite'){
                    $('#img' + ownPerso.nom).css({top: positionsSprites[monSprite].echec.top, left: positionsSprites[monSprite].echec.left});
                // ici on diminue le height du joueur
                    this.top = positionsSprites[monSprite].echec.top;
                    this.left = positionsSprites[monSprite].echec.left;
                    this.status = 'echec';
                // remet à l'état initiale
                    setTimeout(function() {
                        ownPerso.normal();
                    }, 1000);
                    socket.emit('jouer', {joueur: ownPerso});
                };
            };
            ownPerso.defaite = function(){
                $('#img' + ownPerso.nom).css({top: positionsSprites[monSprite].defaite.top, left: positionsSprites[monSprite].defaite.left});

                this.top = positionsSprites[monSprite].defaite.top;
                this.left = positionsSprites[monSprite].defaite.left;
                
                this.status = 'defaite';
                lancementAnimation = false;
                socket.emit('jouer', {joueur: ownPerso});
            };
        };
    };
    
    var poursuivre;                                             // active-désactive le déplacement
    var lancementAnimation = true;
    
    function kayokenOn() {
        if(lancementAnimation && ownPerso.status != 'defaite'){
            poursuivre = true;                                  // lance le déplacement
            ownPerso.kayoken();
            lancementAnimation = false;                         // évite répétition animationFrame
        };
    };

    $(window).keydown(function(event) {
        var codeTouche = event.which || event.keyCode;          // compatibilité
        switch(codeTouche) {
            case 32:                                            // espace
                if(lancementAnimation && ownPerso.status != 'defaite'){
                    kayokenOn();
                };
                event.preventDefault();
                break;
            default:
                event.preventDefault();
                break;
        };
        lancementAnimation = true;                           // permet de relancer l'animationFrame
    });
    
    function kayokenOff() {
        poursuivre = false;                          // stop le déplacement
        ownPerso.normal();                         // lance le deplacement
    };
    
    $(window).keyup(function(event){
        var codeTouche = event.wich || event.keyCode;
        switch(codeTouche){
            case 32:
                if(ownPerso.status != 'defaite'){
                    kayokenOff();
                } else {
                    ownPerso.defaite();
                }
                event.preventDefault();
                break;
            default:
                event.preventDefault();
                break;
        };
    });
    
    var energie = {
        sprite:
            {
                top: '-97px',
                left: '-196px'
            },
        animation: function(unPersonnage){
            var monObjet = this;
            var i = 0;
            var framesParSeconde = 3;
            
            var imageEnergie = document.createElement('img');
            $(imageEnergie).attr({id: 'imageEnergie' + unPersonnage.nom});
            $(imageEnergie).attr({ src: '../images/jeu2/sprites/energie.png', title: 'Energie', alt: 'Energie'}).css({position: 'absolute'});
            $('#divJoueur' + unPersonnage.nom).append(imageEnergie);
            
            function monAnimation (){
                setTimeout(function(){
                    $('#imageEnergie').css({top: monObjet.sprite.top, left: monObjet.sprite.left});
                    if(ownPerso.status == 'kaoyen'){
                        window.requestAnimationFrame(function() {
                            monAnimation(monObjet);
                        });
                    } else {
                        $('#imageEnergie' + unPersonnage.nom).remove();
                    };
                    
                    if(poursuivre && ownPerso.status != 'defaite'){
                        requestAnimationFrame( monAnimation );
                    };
                }, 1000 / framesParSeconde);
            };
            monAnimation(monObjet);
            return this;
        }
    };
    
// FONCTIONS UTILES
    
    // fonction de base pour créer une partie
    $('#boutonCreer').click(function(){
        $('#acceuilJeuMulti').remove();
    // première div qui contiendra les choix du users        
        var choixNbrJoueurs = document.createElement('div');        
    // on lui attribue un id pour le remove après le choix        
        $(choixNbrJoueurs).attr('id', 'choixNbrJoueurs');
    // on lui attribut un id pour remove après
        $(choixNbrJoueurs).addClass('parametragePartie').html('Combien de joueurs???<br>');        
        $('#parametragePartie').append(choixNbrJoueurs);
    // création boutons choix du nombre de joueurs
        for(var j=2; j<5; j++){
        // on fait chaque bouton
            var nouvelleDiv = document.createElement('div');            
        // on lui attache une classe               
            $(nouvelleDiv).addClass('boutonsChoixNbr').html(j);            
        // on affiche chaque bouton dans choixNbrJoueurs            
            $(choixNbrJoueurs).append(nouvelleDiv);            
        // au click, lorsque le user a choisi            
            $(nouvelleDiv).click(function(){
            // on récupère la valeur
                nbrJoueurs = $(this).html();
            // on supprime la div contenant les pitits boutons
                $('#choixNbrJoueurs').remove();
            // on fait apparaitre la div choixPersonnage
                var choixPersonnage = document.createElement('div');
                $(choixPersonnage).attr('id', 'choixPersonnage');
                $('#parametragePartie').append(choixPersonnage);
            // on fait le <ul>
                var choixPersonnageUl = document.createElement('ul');
                $(choixPersonnageUl).attr('id', 'choixPersonnageUl');
                $('#choixPersonnage').append(choixPersonnageUl);
            // on fabrique les <li><img> dynamiquement
                for(var k = 0; listeSpritesPerso[k]; k++){
                    var nouveauLi = document.createElement('li');
                    $(nouveauLi).attr('id', 'li' + k).addClass('liChoixPerso');
                    $('#choixPersonnageUl').append(nouveauLi);
                // on fabrique les <img>
                    var nouvelleImage = document.createElement('img');
                    $(nouvelleImage).attr({src: '../images/jeu2/choix/tete' + listeSpritesPerso[k] + '.png', title: listeSpritesPerso[k], id: listeSpritesPerso[k]});
                    $(nouveauLi).append(nouvelleImage);
                    
                // on récupère le choix de l'utilisateur et on transmet via webSocket
                    $(nouvelleImage).click(function(event){
                        imageJoueur = $(this).attr('id');
                        if(imageJoueur && nbrJoueurs && user){
                            var partieCree = {
                                nbrJoueurs: nbrJoueurs,
                                listeJoueurs: [user.nom],
                                imagesJoueurs: [imageJoueur],
                                dateCreation: new Date(),
                                complet: false
                            };
                            $(this)
                            socket.emit('nouvellePartie', {partieCree: partieCree});
                        };
                        $('#choixPersonnage').remove();
                        var videoAttente = document.createElement('iframe');
                        $(videoAttente).attr({id: 'videoAttente', src: "https://www.youtube.com/embed/o_2Hku874lc?list=PLkonQJrH-v6wo_MnR6BG7oc42OmBqTHhF", frameborder: 0, allowfullscreen: true}).css({width: 560, height: 315});
                        $('#parametragePartie').append(videoAttente);
                        
                        var informationAttente = document.createElement('p');
                        $(informationAttente).attr({id: 'informationAttente'}).css({width: 560, margin: 'auto', color: 'red', fontSize: '2em'}).html('En attendant les autres joueurs, nous vous proposons une petite vidéo simpas!');
                        $('#parametragePartie').append(informationAttente);
                        
                    });
                };
                monCarroussel();
            });
        };
    });
    
    var creationParamsParties = function(partieArejoindre){
        var nouvelleDiv = document.createElement('div');
        $(nouvelleDiv).attr('id', partieArejoindre.roomName);
        $(nouvelleDiv).html('<p>Partie créée par: '+ partieArejoindre.listeJoueurs[0] + '</p>' +
                           '<p>Partie créée à: ' + partieArejoindre.dateCreation + '</p>' +
                           '<p>Nombre de joueurs attendus: ' + partieArejoindre.nbrJoueurs + '</p>' +
                           '<p>Nombre de joueurs connectés: ' + partieArejoindre.listeJoueurs.length + '</p>');
        $('#partiesEnAttente').append(nouvelleDiv);

        var boutonRejoindre = document.createElement('p');
        $(boutonRejoindre).addClass('btn jaune col-xs-12').html('Rejoindre cette partie!');
        $(nouvelleDiv).append(boutonRejoindre);

        $(boutonRejoindre).click(function(){
            $('#acceuilJeuMulti').remove();
        // on choisi son perso
            var choixPersonnage = document.createElement('div');
            $(choixPersonnage).attr('id', 'choixPersonnage');
            $('#parametragePartie').append(choixPersonnage);

            var choixPersonnageUl = document.createElement('ul');
            $(choixPersonnageUl).attr('id', 'choixPersonnageUl');
            $('#choixPersonnage').append(choixPersonnageUl);

            for(var k = 0; listeSpritesPerso[k]; k++){
                var nouveauLi = document.createElement('li');
                $(nouveauLi).attr('id', 'li'+k).addClass('liChoixPerso');
                $('#choixPersonnageUl').append(nouveauLi);

                var nouvelleImage = document.createElement('img');
                $(nouvelleImage).attr('src', '../images/jeu2/choix/tete' + listeSpritesPerso[k] + '.png').attr('title', listeSpritesPerso[k]).attr('id', listeSpritesPerso[k]);
                $(nouveauLi).append(nouvelleImage);

                $(nouvelleImage).click(function(event){
                    imageJoueur = $(this).attr('id');
                    if(imageJoueur){
                        user.image = imageJoueur;
                        socket.emit('rejoindrePartie', {partieArejoindre: partieArejoindre, joueur: user});
                    };
                    $('#choixPersonnage').remove();
                    var videoAttente = document.createElement('iframe');
                    $(videoAttente).attr({id: 'videoAttente', src: "https://www.youtube.com/embed/o_2Hku874lc?list=PLkonQJrH-v6wo_MnR6BG7oc42OmBqTHhF", frameborder: 0, allowfullscreen: true}).css({width: 560, height: 315});
                    $('#parametragePartie').append(videoAttente);
                    
                    var informationAttente = document.createElement('p');
                    $(informationAttente).attr({id: 'informationAttente'}).css({width: 560, margin: 'auto', color: 'red', fontSize: '2em'}).html('En attendant les autres joueurs, nous vous proposons une petite vidéo simpas!');
                    $('#parametragePartie').append(informationAttente);
                });
            };
            monCarroussel();
        });
    };
    
    var monCarroussel = function(){
        var $carrousel = $('#choixPersonnage'),
            $img = $('#choixPersonnage img'),
            indexImg = $img.length - 1,
            l = 0,
            $currentImg = $img.eq(l);
    // gère l'affichage des images
        $img.css('display', 'none');
        $currentImg.css('display', 'block');
    // création des boutons de control
        var controlsCarroussel = document.createElement('div');
        $(controlsCarroussel).attr('id', 'controls').css({position: 'relative', top: '300px'});
        $carrousel.append(controlsCarroussel);
    // bouton précédent
        var prevImage = document.createElement('span');
        $(prevImage).addClass('prev').html('Précédent');
        $(controlsCarroussel).append(prevImage);
    // bouton suivant
        var nextImage = document.createElement('span');
        $(nextImage).addClass('next').html('Suivant');
        $(controlsCarroussel).append(nextImage);
    // gère le client bouton précédent
        $('.prev').click(function(){
            l--;
            if( l >= 0 ){
                $img.css('display', 'none');
                $currentImg = $img.eq(l);
                $currentImg.css('display', 'block');
            }
            else{
                l = 0;
            };
        });
    // gère le client bouton suivant
        $('.next').click(function(){
            l++;
            if( l <= indexImg ){
                $img.css('display', 'none');
                $currentImg = $img.eq(l);
                $currentImg.css('display', 'block');
            }
            else{
                l = $img.length-1;
            };
        });
    
    };
});