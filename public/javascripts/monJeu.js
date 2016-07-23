$(document).ready(function() {
    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    
// MES VARIABLES GLOBALES
    
    var poursuivre;                                             // active-désactive le déplacement
    var lancementAnimation = true;                              // évite répétition animationFrame
    var lancementSaut = true;                                   // évite de sauter pendant un saut
    var victoire = false;                                       // fin du jeu
    
// MUSIQUES DU JEU
    
    var musique = {
        jeu: document.querySelector('#musiqueJeu'),
        saut: document.querySelector('#musiqueSaut'),
        competence: document.querySelector('#musiqueCompetence'),
        gameOver: document.querySelector('#musiqueGameOver'),
        victory: document.querySelector('#musiqueVictory'),
    };
    
// VERIFIE SI LES OBJETS SONT DANS LE JEU. RENVOI UN BOOLEAN
    
    var airDeJeux = {
        haut: $('#bacASable').position().top,
        droite: $('#bacASable').position().left + $('#bacASable').width(),
        bas: $('#bacASable').position().top + $('#bacASable').height(),
        gauche: $('#bacASable').position().left,
        
        dansLeJeu: function(objetTeste) {
            var dansLeJeu = true;
            if(objetTeste.orientation == 'frameHaut' && objetTeste.haut < airDeJeux.haut){
                dansLeJeu = false;
            };
            if(objetTeste.orientation == 'frameDroite' && objetTeste.droite > airDeJeux.droite){
                dansLeJeu = false;
            };
            if(objetTeste.orientation == 'frameBas' && objetTeste.bas > airDeJeux.bas){
                dansLeJeu = false;
            };
            if(objetTeste.orientation == 'frameGauche' && objetTeste.gauche < airDeJeux.gauche){
                dansLeJeu = false;
            };
            return dansLeJeu;
        }
    };
    
// RECUPERE LISTE DES TROUX ET RETOURNE UN BOOLEAN SI UN OBJET EST DEDANS ET DECLENCHE LA CHUTTE
    
    var dansUnTrou = function(objetTeste){
        var leTrou = false;
        $('.passerelles').each(function(i){
            var passerelle = {
                haut: $('.passerelles')[i].offsetTop,
                droite: $('.passerelles')[i].offsetLeft + $('.passerelles')[i].offsetWidth,
                bas: $('.passerelles')[i].offsetTop + $('.passerelles')[i].offsetHeight,
                gauche: $('.passerelles')[i].offsetLeft
            };
            
            if (objetTeste.bas == passerelle.haut){
                if(passerelle.droite == airDeJeux.droite ){
                    if(objetTeste.droite < passerelle.gauche){
                        leTrou = true;
                    };
                };
                if (passerelle.gauche == airDeJeux.gauche){
                    if(objetTeste.gauche > passerelle.droite){
                        leTrou = true;
                    };
                };
            };
            
            if(leTrou && objetTeste.nom == 'joueur'){
                var arriveeChutte = (Math.round(objetTeste.bas + 20)/100)*100;

                $('#monPersonnage').animate({ top: arriveeChutte }, 500, function(){
                    objetTeste.bas = (Math.round(arriveeChutte/100))*100;
                });
            };
            
            if(leTrou && objetTeste.nom == 'tonneau') {
                var arriveeChutte = objetTeste.bas + 70;
                $(objetTeste).animate({ top: arriveeChutte }, 500);
            };
            
            leTrou=false;
        });
    };
    
// RECUPERE LISTE DES ECHELLES, RENVOIE UN BOOLEAN
    
    var dansUneEchelle = function(objetTeste){
        var lEchelle = false;
        $('.echelles').each(function(i){
            var objetEchelle = $('.echelles')[i];
            var echelle = {
                haut: $('.echelles')[i].offsetTop,
                droite: $('.echelles')[i].offsetLeft + $('.echelles')[i].offsetWidth,
                bas: $('.echelles')[i].offsetTop + $('.echelles')[i].offsetHeight,
                gauche: $('.echelles')[i].offsetLeft
            };
            
            if ( objetTeste.orientation == 'frameHaut' && objetTeste.droite <= echelle.droite && echelle.gauche <= objetTeste.gauche && echelle.haut < objetTeste.bas && objetTeste.haut <= echelle.bas ) {
                lEchelle = true;
            };
            
            if ( objetTeste.orientation == 'frameDroite' && objetTeste.droite <= echelle.droite && echelle.gauche <= objetTeste.gauche && echelle.haut < objetTeste.bas && objetTeste.bas < echelle.bas ) {
                lEchelle = true;
            };
            
            if ( objetTeste.orientation == 'frameBas' && objetTeste.droite <= echelle.droite && echelle.gauche <= objetTeste.gauche && echelle.haut <= objetTeste.bas && objetTeste.bas <= echelle.bas ) {
                lEchelle = true;
            };
            
            if ( objetTeste.orientation == 'frameGauche' && objetTeste.droite <= echelle.droite && echelle.gauche <= objetTeste.gauche && echelle.haut < objetTeste.bas && objetTeste.bas < echelle.bas ) {
                lEchelle = true;
            };
            
            if ( objetTeste.orientation == 'frameSaut' && objetTeste.droite <= echelle.droite && echelle.gauche <= objetTeste.gauche && echelle.haut < objetTeste.bas && objetTeste.bas < echelle.bas ) {
                lEchelle = true;
            };

            if(objetTeste.nom == 'tonneau' && objetTeste.droite <= echelle.droite && echelle.gauche <= objetTeste.gauche && echelle.haut == objetTeste.bas){
                lEchelle = true;
            };
        });
        
        return lEchelle;
    };
    
// FINS DU JEU
    
    function looser(){
        musique.jeu.pause();
        musique.gameOver.play();
        $('#defaite').removeClass('hidden');
        $('#imagePanda').addClass('hidden');
        $('#imagePersonnage').addClass('hidden');
        $('.tonneauxQuiRoulentDroite').addClass('hidden');
        $('.tonneauxQuiRoulentGauche').addClass('hidden');
    };
    
    function winner(){
        victoire = true;
        musique.jeu.pause();
        musique.victory.play();
        
        $('#victoire').removeClass('hidden');
        $('#reglesJeu').addClass('hidden');
        $('#logoHtml').css({display: 'block'});
        $('#logoCss').css({display: 'block'});
        $('#logoJs').css({display: 'block'});
        $('#logoBootstrap').css({display: 'block'});
        $('#logoJquery').css({display: 'block'});
        $('#logoAngularJS').css({display: 'block'});
        $('#logoMongoDB').css({display: 'block'});
        $('#logoNodeJS').css({display: 'block'});
        $('#logoExpress').css({display: 'block'});
        $('#logoAjax').css({display: 'block'});
        $('#logoMeteor').css({display: 'block'});
        $('#logoGit').css({display: 'block'});
        
        panda.defaite();
    };
    
// SCORE
    
    var score = {
        total: 0,
        gagnerPoint: function(personnageJoueur, monTonneau){
            var seuilHaut = monTonneau.haut - 30;
            var point = false;
            
            if(personnageJoueur.bas >= seuilHaut && personnageJoueur.bas <= monTonneau.haut){
                if(personnageJoueur.gauche <= monTonneau.droite && personnageJoueur.gauche >= monTonneau.gauche){
                    musique.competence.play();
                    point = true;
                };
            };
            
            return point;
        },
        
        affichageCompetences: function(){
            switch(this.total) {
                case 100:
                    $('#logoHtml').css({display: 'block'});
                    $('#reglesJeu').addClass('hidden');
                    break;
                case 200:
                    $('#logoCss').css({display: 'block'});
                    break;
                case 300:
                    $('#logoJs').css({display: 'block'});
                    break;
                case 400:
                    $('#logoBootstrap').css({display: 'block'});
                    break;
                case 500:
                    $('#logoJquery').css({display: 'block'});
                    break;
                case 600:
                    $('#logoAngularJS').css({display: 'block'});
                    break;
                case 700:
                    $('#logoMongoDB').css({display: 'block'});
                    break;
                case 800:
                    $('#logoNodeJS').css({display: 'block'});
                    break;
                case 900:
                    $('#logoExpress').css({display: 'block'});
                    break;
                case 1000:
                    $('#logoAjax').css({display: 'block'});
                    break;
                case 1100:
                    $('#logoMeteor').css({display: 'block'});
                    break;
                case 1200:
                    $('#logoGit').css({display: 'block'});
                    break;
                default:
                    break;
            };
        }
    };
    
// MAJ LE SCORE
    
    function afficherLeScore(){
        score.affichageCompetences();
        $('#affichageScore').html('<p>SCORE : ' + score.total + '</p>');
        
        window.requestAnimationFrame(function() {
            afficherLeScore();
        });
    };
    
    afficherLeScore();
    
// LES TONNEAUX
    
    var tonneaux = {
        listeTonneaux: [],
        nouveauTonneau: function() {
            var nouveauTonneau = document.createElement('div');
            nouveauTonneau.className = 'tonneauxQuiRoulentDroite';
            $('#bacASable').append(nouveauTonneau);
            this.listeTonneaux.push(nouveauTonneau);
            this.deplacementTonneaux(nouveauTonneau);
        },
        deplacementTonneaux: function(nouveauTonneau){
            
    // CREATION DE LA POSITION DE CHAQUE TONNEAU + ORIENTATION + VITESSES + ARRIVEE CHUTTE
            
            nouveauTonneau.nom = 'tonneau';
            nouveauTonneau.orientation = 'frameDroite';
            nouveauTonneau.vitesseDeplacementHorizontal = 0,
            nouveauTonneau.vitesseDeplacementVertical = 0;
            var arriveeChutte;
            var i = 0; // pour un seul random dans echelle
            var j = 0; // pour gagner un seul point
            
    // ANIMATION DES TONNEAUX
            
            function rouler (monTonneau) {
                
        // MET A JOUR LA POSITION DU TONNEAU
                
                monTonneau.haut = $(monTonneau).position().top;
                monTonneau.droite = $(monTonneau).position().left + $(monTonneau).width();
                monTonneau.bas = $(monTonneau).position().top + $(monTonneau).height();
                monTonneau.bas = Math.round(monTonneau.bas/100)*100;
                monTonneau.gauche = $(monTonneau).position().left;
                
        // GAGNER DES POINTS
                
                var gagnerUnPoint = score.gagnerPoint(personnageJoueur, monTonneau);
                if(gagnerUnPoint && j == 0){
                    score.total += 100;
                    j++;
                };
                if(!gagnerUnPoint){
                    j = 0;
                };
                
        // VERIFIE LES COLLISIONS
                
                tonneaux.collision(personnageJoueur, monTonneau);
                
        // VERIFIE SI DANS LE JEU DEPLACEMENT VERS LA DROITE
                
                var dansLeJeu = airDeJeux.dansLeJeu(monTonneau);
                
        // VERIFIE SI DANS UNE ECHELLE
                
                var dansLechelle = dansUneEchelle(monTonneau);
                
        // VERIFIE SI DANS UN TROU
                
                dansUnTrou(monTonneau);
                
        // DEPLACEMENT HORIZONTAL DROITE
                
                monTonneau.vitesseDeplacementHorizontal = 0;
                
                if(monTonneau.orientation == 'frameDroite' && dansLeJeu) {
                    monTonneau.vitesseDeplacementHorizontal = 1;
                } else {
                    monTonneau.orientation = 'frameGauche';
                    $(monTonneau).removeClass('tonneauxQuiRoulentDroite');
                    $(monTonneau).addClass('tonneauxQuiRoulentGauche');
                };
                
        // VERIFIE SI DANS LE JEU DEPLACEMENT GAUCHE
                
                var dansLeJeuBis = airDeJeux.dansLeJeu(monTonneau);
                
        // DEPLACEMENT HORIZONTAL GAUCHE
                
                if(monTonneau.orientation == 'frameGauche' && dansLeJeuBis) {
                    monTonneau.vitesseDeplacementHorizontal = -1;
                } else {
                    monTonneau.orientation = 'frameDroite';
                    $(monTonneau).removeClass('tonneauxQuiRoulentGauche');
                    $(monTonneau).addClass('tonneauxQuiRoulentDroite');
                };
                
        // DEPLACEMENT SI DANS UNE ECHELLE
                
                if(dansLechelle && i == 0){
                    var nombreAleatoire = Math.random();
                    if(nombreAleatoire <= 0.5){
                        monTonneau.vitesseDeplacementVertical = 5;
                        arriveeChutte =  monTonneau.bas + 60;
                    } else {
                        monTonneau.vitesseDeplacementVertical = 0;
                        arriveeChutte =  0;
                    };
                    i++;
                };
                
        // évite de vérifier la condition plusieurs fois par échelle
                
                if(!dansLechelle){
                    i=0;
                };
                
        // POINT DE CHUTTE
                
                if(monTonneau.haut >= arriveeChutte){
                    monTonneau.vitesseDeplacementVertical = 0;
                };
                
        // MOUVEMENT
                
                $(monTonneau).css({ left: '+=' + monTonneau.vitesseDeplacementHorizontal,
                                    top: '+=' + monTonneau.vitesseDeplacementVertical });
                
        // SUPPRIME LE TONNEAU EN BAS DU JEU
                
            if(!dansLeJeuBis && monTonneau.bas >= airDeJeux.bas){
                    monTonneau.remove();
            };
                
        // RELANCE ANIMATION
                
                window.requestAnimationFrame(function() {
                    rouler(monTonneau);
                });
            };
            
            rouler(nouveauTonneau); // PREMIER LANCEMENT ANIMATION
        },
        collision: function(personnageJoueur, monTonneau){
            var tonneauTestCollision = {
                haut: monTonneau.haut + 2,
                droite: monTonneau.droite - 2,
                bas: monTonneau.bas - 2,
                gauche: monTonneau.gauche + 2
            }
            
    //tonneau arrive de la gauche
            
            if(personnageJoueur.droite >= tonneauTestCollision.gauche && personnageJoueur.gauche <= tonneauTestCollision.gauche && personnageJoueur.haut <= tonneauTestCollision.haut && personnageJoueur.bas >= tonneauTestCollision.bas){
                looser();
            };
            
    // tonneau arrive de la droite
            
            if(personnageJoueur.gauche <= tonneauTestCollision.droite && personnageJoueur.droite >= tonneauTestCollision.droite && personnageJoueur.haut <= tonneauTestCollision.haut && personnageJoueur.bas >= tonneauTestCollision.bas){
                looser();
            };
            
    //tonneau tombe vers la gauche
            
            if(personnageJoueur.top <= tonneauTestCollision.bas && personnageJoueur.bas >= tonneauTestCollision.bas && personnageJoueur.droite >= tonneauTestCollision.gauche && personnageJoueur.gauche <= tonneauTestCollision.gauche){
                looser();
            };
            
    // tonneau tombe vers la droite
            
            if(personnageJoueur.top <= tonneauTestCollision.bas && personnageJoueur.bas >= tonneauTestCollision.bas && personnageJoueur.gauche <= tonneauTestCollision.droite && personnageJoueur.droite <= tonneauTestCollision.droite){
                looser();
            };
            
    // contact bas droite
            
            if(personnageJoueur.bas >= tonneauTestCollision.haut && personnageJoueur.haut <= tonneauTestCollision.haut && personnageJoueur.droite >= tonneauTestCollision.gauche && personnageJoueur.gauche <= tonneauTestCollision.gauche){
                looser();
            };
            
    // contact bas gauche
            
            if(personnageJoueur.bas >= tonneauTestCollision.haut && personnageJoueur.haut <= tonneauTestCollision.haut && personnageJoueur.droite >= tonneauTestCollision.droite && personnageJoueur.gauche <= tonneauTestCollision.droite){
                looser();
            };
        },
    };
    
// LE MECHANT PANDA
    
    var panda = {
        haut: $('#monPanda').position().top,
        droite: $('#monPanda').position().left + $('#monPanda').width(),
        bas: $('#monPanda').position().top + $('#monPanda').height(),
        gauche: $('#monPanda').position().left,
        frameDeplacement: {
            containerLargeur: [90, 90, 90, 90],
            containerHauteur: [100, 100, 100, 100],
            imageLargeur: [2, -92, -182, -272],
            imageHauteur: [-109, -109, -109, -109]
        },
        frameDefaite: {
            containerLargeur: [90, 90, 90, 90],
            containerHauteur: [100, 100, 100, 100],
            imageLargeur: [2, -86, -178, -269],
            imageHauteur: [-216, -216, -216, -216]
        },
        vitesseDeplacementHorizontal: 5,
        deplacer: function(){
            var monObjetPanda = this;
            var i = 0; // compteur de frames
            var framesParSeconde = 5; // reglage vitesse animation
            
/*pour tester*/            /*var j = 0;*/
            
    // ANIMATION DU PANDA
            
            function monAnimation(){
                
        //  REGLAGE VITESSE
                
                setTimeout(function() {
                    
            // MAJ COORDONNEES PANDA
                    
                    monObjetPanda.haut = $('#monPanda').position().top;
                    monObjetPanda.droite = $('#monPanda').position().left + $('#monPanda').width();
                    monObjetPanda.bas = $('#monPanda').position().top + $('#monPanda').height();
                    monObjetPanda.gauche = $('#monPanda').position().left;
                    
            // SI PANDA BOUSCULE TONNEAU DE DEPART : CREATION DUN NOUVEAU TONNEAU + DEPLACEMENT VERS LA GAUCHE
                    
                    if(monObjetPanda.droite > $('#tonneauDepart').position().left){
                        
/*pour tester*/                        /*j++;*/
                        
                        tonneaux.nouveauTonneau(); // ligne pour désactiver la fabrication de tonneaux
                        monObjetPanda.vitesseDeplacementHorizontal = -5;
                    };
                    
            // VERIFIE SI PANDA SORT DU JEU CHANGEMENT DEPLACEMENT VERS LA DROITE
                    
                    if (monObjetPanda.gauche < airDeJeux.gauche) {
                        monObjetPanda.vitesseDeplacementHorizontal = 5;
                    };
                    
            // MOUVEMENT DU PANDA
                    
                    $('#monPanda').css({    width: monObjetPanda.frameDeplacement.containerLargeur[i] + 'px',
                                            height: monObjetPanda.frameDeplacement.containerHauteur[i] + 'px',
                                            left: monObjetPanda.gauche + monObjetPanda.vitesseDeplacementHorizontal + 'px' });
                    
            // MOUVEMENT IMAGE PANDA
                    
                    $('#imagePanda').css({  top: monObjetPanda.frameDeplacement.imageHauteur[i] + 'px',
                                            left: monObjetPanda.frameDeplacement.imageLargeur[i] + 'px' });
                    i++; // maj compteur frames

                    if(i == monObjetPanda.frameDeplacement.containerLargeur.length) { // boucle frames
                        i = 0; // RAZ compteur frame
                    };
                    
            // BOUCLE ANIMATION
                    
/* pour tester*/                    /*if(j<1){*/
                    
                    window.requestAnimationFrame(function() {
                        monAnimation();
                    });
                    
/*pour tester*/                   /*}*/
                    
                }, 1000/framesParSeconde);// fin setTimeout
            };
            
    // LANCEMENT PREMIER ANIMATION
            
            monAnimation();
        },
        defaite: function() {
            var monObjetPanda = this;
            var i = 0;
            var framesParSeconde = 2;
            this.vitesseDeplacementHorizontal = 0;
            function monAnimation(){
                setTimeout(function() {
                    $('#imagePanda').css({  top: monObjetPanda.frameDefaite.imageHauteur[i] + 'px',
                                            left: monObjetPanda.frameDefaite.imageLargeur[i] + 'px' });
                    i++;
                    if(i>=monObjetPanda.frameDefaite.imageHauteur.length){
                        i = 0;
                    };
                    window.requestAnimationFrame(function() {
                        monAnimation();
                    });
                }, 1000/framesParSeconde);
            };
            
            monAnimation();
        }
    };
    
// PERSONNAGE DU JOUEUR
    
    var personnageJoueur = {
        nom: 'joueur',
        haut: $('#monPersonnage').position().top,
        droite: $('#monPersonnage').position().left + $('#monPersonnage').width(),
        bas: $('#monPersonnage').position().top + $('#monPersonnage').height(),
        gauche: $('#monPersonnage').position().left,
        orientation: 'frameDepart',
        vitesseDeplacementHorizontal: 0,
        vitesseDeplacementVertical: 0,
        frameDepart: {
            containerLargeur: [40],
            containerHauteur: [80],
            imageLargeur: [-4],
            imageHauteur: [-5]
        },
        frameHaut: {
            containerLargeur: [40, 40, 40, 40],
            containerHauteur: [80, 80, 80, 80],
            imageLargeur: [-4, -54, -104, -155],
            imageHauteur: [-260, -260, -260, -260]
        },
        frameDroite: {
            containerLargeur: [48, 48, 48, 48],
            containerHauteur: [80, 80, 80, 80],
            imageLargeur: [-2, -53, -102, -151],
            imageHauteur: [-175, -175, -175, -175]
        },
        frameBas: {
            containerLargeur: [40, 40, 40, 40],
            containerHauteur: [80, 80, 80, 80],
            imageLargeur: [-151, -102, -53, -2],
            imageHauteur: [-260, -260, -260, -260]
        },
        frameGauche: {
            containerLargeur: [48, 48, 48, 48],
            containerHauteur: [80, 80, 80, 80],
            imageLargeur: [-2, -50, -103, -149],
            imageHauteur: [-90, -90, -90, -90]
        },
        frameSaut:{
            containerLargeur: [48],
            containerHauteur: [80],
            imageLargeur: [],
            imageHauteur: []
        },
        frameEchelle:{
            containerLargeur: [40],
            containerHauteur: [80],
            imageLargeur: [-151],
            imageHauteur: [-260]
        },
        deplacer: function(){
            var monObjet = this;
            var i = 0; // compteur pour frames
            var framesParSeconde = 20; // réglage vitesse animation
            
    // DEPLACEMENT
            
            function monAnimation() {
                
        // GESTION DE LA VITESSE DE DEFILEMENT DES FRAMES
                
                setTimeout(function() {
                    
            // MAJ COORDONNEES
                    
                    monObjet.haut = $('#monPersonnage').position().top;
                    monObjet.droite = $('#monPersonnage').position().left + $('#monPersonnage').width();
                    monObjet.bas = $('#monPersonnage').position().top + $('#monPersonnage').height();
                    monObjet.gauche = $('#monPersonnage').position().left;
                    
            // VICTOIRE JOUEUR
                    
                    if(monObjet.bas <= 100 && monObjet.gauche <= 250){
                        poursuivre = false;
                        winner();
                    };
                    
            // VERIFIE SI DANS LE JEU
                    
                    var dansLeJeu = airDeJeux.dansLeJeu(monObjet);
                    
            // VERIFIE SI DANS UNE ECHELLE
                    
                    var dansEchelle = dansUneEchelle(monObjet);
                    
            // VERIFIE SI DANS UN TROU
                    
                    dansUnTrou(monObjet);
                    
            // DEPLACEMENTS
                    
                    if (monObjet.orientation == 'frameDepart') {
                        monObjet.vitesseDeplacementHorizontal = 0;
                        monObjet.vitesseDeplacementVertical = 0;
                    };
                    
                    if(monObjet.orientation == 'frameHaut') {
                        monObjet.vitesseDeplacementHorizontal = 0;
                        if(dansLeJeu && dansEchelle){
                            monObjet.vitesseDeplacementVertical = -5;
                        } else {
                            monObjet.vitesseDeplacementVertical = 0;
                        };
                    };
                    
                    if(monObjet.orientation == 'frameDroite') {
                        if(dansLeJeu && !dansEchelle){
                            monObjet.vitesseDeplacementHorizontal = 7;
                        } else {
                            monObjet.vitesseDeplacementHorizontal = 0;
                        };
                        monObjet.vitesseDeplacementVertical = 0;
                    };
                    
                    if(monObjet.orientation == 'frameBas') {
                        monObjet.vitesseDeplacementHorizontal = 0;
                        if(dansLeJeu && dansEchelle){
                            monObjet.vitesseDeplacementVertical = 5;
                        } else {
                            monObjet.vitesseDeplacementVertical = 0;
                        };
                    };
                    
                    if(monObjet.orientation == 'frameGauche') {
                        if(dansLeJeu && !dansEchelle){
                            monObjet.vitesseDeplacementHorizontal = -7;
                        } else {
                            monObjet.vitesseDeplacementHorizontal = 0;
                        };
                        monObjet.vitesseDeplacementVertical = 0;
                    };
                    
            // MOUVEMENTS JOUEUR
                    
                    $('#monPersonnage').css({   width: monObjet[monObjet.orientation].containerLargeur[i] + 'px',
                                                height: monObjet[monObjet.orientation].containerHauteur[i] + 'px',
                                                left: monObjet.gauche + monObjet.vitesseDeplacementHorizontal + 'px',
                                                top: monObjet.haut + monObjet.vitesseDeplacementVertical + 'px' });
                    
            // MOUVEMENTS IMAGE
                    
                    $('#imagePersonnage').css({ top: monObjet[monObjet.orientation].imageHauteur[i] + 'px',
                                                left: monObjet[monObjet.orientation].imageLargeur[i] + 'px' });
                    i++; // maj compteur frames
                    
                    if(i == monObjet[monObjet.orientation].containerLargeur.length) {
                        i = 0; // boucle compteur frames
                    };
                    
            // BOUCLE ANIMATION
                    
                    if(poursuivre){
                        window.requestAnimationFrame(function() {
                            monAnimation(monObjet);
                        });
                    };
                    
                }, 1000 / framesParSeconde); // fin setTimeout
            };
            
        // LANCEMENT PREMIERE ANIMATION
            
            monAnimation(monObjet);
            return this;
        },
        sauter: function(){
            var maxSaut = this.haut - 70;
            var minSaut = this.haut;
            var monPersonnage = this;
            var dansLeJeu = airDeJeux.dansLeJeu(this); // vérifie si dans le jeu
            var dansEchelle = dansUneEchelle(this); // vérifie si dans une échelle
            
    // EMPECHE SAUT LORSQUON MONTE UNE ECHELLE ET STOP LE SAUT SI ON SORT DU JEU
            
            if(!dansEchelle){
                $('#monPersonnage').animate({ top: maxSaut }, 500, function(){ // le personnage monte
                    $('#monPersonnage').animate({ top: minSaut }, 500, function() { // après être monté, il redescend
                        monPersonnage.bas = Math.round(minSaut/100)*100; // MAJ + arrondit bottom (si non bug)
                        dansUnTrou(monPersonnage);
                        lancementSaut = true; // autorise de sauter à nouveau
                    });
                });
            };
        }
    };
    
    function deplacementPersoOn() {
        if(victoire == false){
            if(lancementAnimation){
                poursuivre = true;                                  // lance le déplacement
                personnageJoueur.deplacer();
                lancementAnimation = false;                         // évite répétition animationFrame
            };
        };
    };
    
// DETECTIONS TOUCHES USER
    
    $(window).keydown(function(event) {
        var codeTouche = event.which || event.keyCode;          // compatibilité
        switch(codeTouche) {
            case 37:                                            // gauche
                personnageJoueur.orientation = 'frameGauche';
                deplacementPersoOn();
                event.preventDefault();
                break;
            case 38:                                            // haut
                personnageJoueur.orientation = 'frameHaut';
                deplacementPersoOn(poursuivre);
                event.preventDefault();
                break;
            case 39:                                            // droite
                personnageJoueur.orientation = 'frameDroite';
                deplacementPersoOn();
                event.preventDefault();
                break;
            case 40:                                            // bas
                personnageJoueur.orientation = 'frameBas';
                deplacementPersoOn();
                event.preventDefault();
                break;
            case 32:                                            // Saut Espace
                if(lancementSaut){
                    musique.saut.play();
                    lancementSaut = false;
                    personnageJoueur.sauter();
                };
                event.preventDefault();
                break;
            default:
                event.preventDefault();
                break;
        };
    });
    
// ARRET DEPLACEMENT
    
    function deplacementPersoOff() {
        poursuivre = false;                                  // stop le déplacement
        personnageJoueur.deplacer();                         // lance le deplacement
    };
    
// DETECTION UP-TOUCHES USER
    
    $(window).keyup(function(event) {
        var codeTouche = event.which || event.keyCode;
        switch(codeTouche) {
            case 37:                                         // gauche
            case 38:                                         // haut
            case 39:                                         // droite
            case 40:                                         // bas
                deplacementPersoOff();
                event.preventDefault();
                break;
            default:
                event.preventDefault();
                break;
        };
        lancementAnimation = true;                           // permet de relancer l'animationFrame
    });
    
/*    window.document.querySelector('#controlsSons').click(function(){
        console.log(window.document.querySelector('#controlsSons').src())
        if(window.document.querySelector('#controlsSons').src()== 'img/lecture.png'){
            alert('coucou')
        }
    });*/
    
// INITIALISATION DU JEU
    
    $('#start').click(function(){
        musique.jeu.play()
        $('#messageAccueil').addClass('hidden');
        $('#reglesJeu').removeClass('hidden');
        personnageJoueur.deplacer(personnageJoueur.orientation);    // création personnage
        panda.deplacer();                                           // création méchant panda
    });
});