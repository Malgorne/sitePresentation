$(document).ready(function(){
    var socket = io('/ioTchat');
    socket.emit('connectionTchat', {user: user});
// gère la liste des users connectés
    var creationUser = function(newUser){
        if(!$('#titre-li-salon').length){
            var titreLi = document.createElement('li');
            $(titreLi).attr({id: 'titre-li-salon'}).addClass('col-xs-11 liRight').html('Participants au salon :');
            $('#listeUsers').append(titreLi);
        };
        if(user.id != newUser.id){
            var liUser = document.createElement('li');
            $(liUser).attr({id: newUser.id}).addClass('col-xs-11').html(newUser.pseudo).dblclick(function(){
                creationRoomPrivee(this);
            });
            $('#listeUsers').append(liUser);
        };
    };
// une fois connecté à une room, on affiche la liste des salons et la liste des users connectés
    socket.on('connectionSaved', function(data){
        var listeUsers = data.listeUsers;
    // dans le cas d'un changement de room, on supprime les users connectés, on change l'onglet
        if(data.roomCourante){
            $('#roomCourante').html(data.roomCourante);
            $('#listeUsers li').remove()
        };
    // à l'arrivée sur le chat, on envoie la liste des salons
        if(data.listeSalons){
            var listeSalons = data.listeSalons;
        };
    // évite de réécrire la liste
        if(data.listeSalons && $('#listeSalons li').length == 1){
            for(var i=0; listeSalons[i]; i++){
                var liSalon = document.createElement('li');
                $(liSalon).attr({id: 'salon-'+listeSalons[i]}).addClass('col-xs-11 liRight').html(listeSalons[i]).dblclick(function(){
                    if($('.active').children('a').html() != $(this).html()){
                        var salonAquitter = $('#roomCourante').html();
                        var salonAjoindre = $(this).attr('id').split('-')[1];
                        $('#main-roomCourante').find('p').each(function(i, p){
                            $(this).remove();
                        })
                        socket.emit('rejoindreSalon', {salonAquitter: salonAquitter, salonAjoindre: salonAjoindre});
                    };
                });
                $('#listeSalons').append(liSalon);
            };
        };
    // dans tous les cas, on recrée la liste des users connectés à la room
        for(var i=0; listeUsers[i]; i++){
            creationUser(listeUsers[i]);
        };
    });
// affiche le user qui vient d'arriver
    socket.on('newConnection', function(newUser){
        creationUser(newUser);
    });
// on remove de la liste les users qui se déco
    socket.on('decoUser', function(userDeco){
        $('#' + userDeco.id).remove();
    });
// création de rooms privées......
    // au click sur un nom,
    var creationRoomPrivee = function(userCible){
        userCible = {
            id: $(userCible).attr('id'),
            pseudo: $(userCible).html()
        };
        socket.emit('creationRoomPrivee', userCible);
    };
    
    socket.on('creationRoomPriveeSaved', function(room){
        if(!$('#'+room.nomRoomPrivee).length){
            var idCible = room.nomRoomPrivee.split('-')[0];
            var idEmetteur = room.nomRoomPrivee.split('-')[1];
            var liOnglet = document.createElement('li');
            $('#listeDiscutions li').each(function(i, o){
                $(this).removeClass('active');
            });
            var aOnglet = document.createElement('a');
            if(idEmetteur == user.id){
                $(liOnglet).attr({role: 'presentation'}).addClass('uneDiscution active');
                $(aOnglet).attr({id: room.nomRoomPrivee, href:"#"+room.nomRoomPrivee}).html(room.userCible.pseudo);
                invitationRoomPrivee();
            } else {
                $('#roomCourante').parent().addClass('active');
                $(liOnglet).attr({role: 'presentation'}).addClass('uneDiscution');
                $(aOnglet).attr({id: room.nomRoomPrivee, href:"#"+room.nomRoomPrivee}).html(room.listeUsers[0].pseudo);
            };
            $(liOnglet).click(function(ev){
                changementOnglets(this);
                invitationRoomPrivee();
            });
            var spanCloseOnglet = document.createElement('span');
            $(spanCloseOnglet).addClass('spanCloseOnglet').html('X').click(function(ev){
                quitterRoomPrivee(this)
            });
            $(aOnglet).append(spanCloseOnglet);
            $(liOnglet).append(aOnglet);
            $('#listeDiscutions').append(liOnglet);
            affichageListesRoomPrivee();
            affichageRoomPrivee(room);
        };
    });
    
    var affichageRoomPrivee = function(room){
    // on retire la liste des salons et on affiche la liste des users du salon privé
    // si on est sur le MP, on ajoute un span pour inviter de une autre personne
    // au click, on envoi le nom de la room, son id et on ajoute le nouveau user
        // on crée le ul
        if(!$('#salonPrive-'+room.nomRoomPrivee).length){
            var ulListeUsersSalon = document.createElement('ul');
            $(ulListeUsersSalon).attr({id: 'salonPrive-'+room.nomRoomPrivee}).addClass('listeUsersMp row');
            var firstLi = document.createElement('li');
            $(firstLi).attr({id: 'titre-li-salonPrive'}).addClass('liRight col-xs-11 text-left').html('Participants discution :');
            $(ulListeUsersSalon).append(firstLi);
            for(var i=0; room.listeUsers[i]; i++){
                if(room.listeUsers[i].id != user.id){
                    var liUser = document.createElement('li');
                    $(liUser).attr({id: 'userSalon-'+room.listeUsers[i].id}).addClass('col-xs-11 liRight').html(room.listeUsers[i].pseudo);
                    $(ulListeUsersSalon).append(liUser);
                    if($('#user-'+room.listeUsers[i].id)){
                        $('#user-'+room.listeUsers[i].id).off('dblclick');
                    };
                };
            };

            $("#listeSalons").after(ulListeUsersSalon)
            var divMainAffichage = document.createElement('div');
            $(divMainAffichage).attr({id: 'main-'+room.nomRoomPrivee}).addClass('affMessages');
            $('#formTchat').before(divMainAffichage);
            affichageMain();
            affichageListesRoomPrivee();
        };
    };
    
    var affichageListesRoomPrivee = function(){
        if($('#roomCourante').parent().hasClass('active')){
            $('#listeSalons').removeClass('hidden');
            $('.listeUsersMp').addClass('hidden');
        } else {
            $('#listeSalons').addClass('hidden');
            $('.uneDiscution').each(function(i, li){
                $($('#salonPrive-'+$(li).children('a').attr('id'))).addClass('hidden')
                if($(li).hasClass('active')){
                    $('#salonPrive-'+$(li).children('a').attr('id')).removeClass('hidden');
                };
            });
        };
    };
    
    var affichageMain = function(){
        $('.affMessages').each(function(i, div){
            $(this).addClass('hidden');
        });
        $('.uneDiscution').each(function(i, li){
            if($(this).hasClass('active')){
                $('#main-'+$(this).children('a').attr('id')).removeClass('hidden');
            };
        });
    };
    
    var changementOnglets = function(ongletSelected){
        if(!$(ongletSelected).hasClass('active')){
        // on remove active de tous les onglets
            $('.uneDiscution').each(function(i, onglet){
                $(onglet).removeClass('active');
            });
        // on active le nouvel onglet
            $(ongletSelected).addClass('active');
        // on gère l'affichage du main et des listes
            affichageMain();
            affichageListesRoomPrivee();
            invitationRoomPrivee()
        };
    };
// gère l'affichage du salon
    $('#roomCourante').click(function(){
        changementOnglets($(this).parent());
    });
    
    var invitationRoomPrivee = function(onglet){
        setTimeout(function(){
        // au click je récupère le nom du salon actif
            $('.uneDiscution').each(function(i, li){
                if($(this).hasClass('active')){
                    $('.spanInviter').remove();
                    var salonPrive = $(this).children('a').attr('id');
                    if(salonPrive != 'roomCourante'){
                    // je vérifie dans la liste des usersSalon
                        $('#listeUsers').find('li').each(function(i, object){
                            var dansLeSalon = false;
                            var userCible = {};
                            if($(object).attr('id') != 'titre-li-salon'){
                            // dans la liste des users de la room
                                $($('#salonPrive-'+salonPrive)).find('li').each(function(i, comparaison){
                                    if($(comparaison).attr('id') != 'titre-li-salonPrive'){
                                    // le user est dans la liste salon et la liste room
                                        if($(object).attr('id') == $(comparaison).attr('id').split('-')[1]){
                                            dansLeSalon = true;
                                        };
                                    }
                                });
                                if(!dansLeSalon){
                                    if(!$('#invitation-'+$(object).attr('id')).length){
                                        userCible.id = $(object).attr('id');
                                        userCible.pseudo = $(object).html();
                                        
                                        var spanInvitationSalonPrive = document.createElement('span');
                                        
                                        $(spanInvitationSalonPrive).attr({id: 'invitation-'+userCible.id}).addClass('spanInviter').html('+').click(function(){
                                            
                                            socket.emit('invationRoomPrivee', {newUser: userCible, room: salonPrive, roomCourante: $('#roomCourante').html()});
                                            $('#invitation-'+$(object).attr('id')).remove();
                                        });
                                        $(object).append(spanInvitationSalonPrive);
                                    };
                                };
                            };
                         });
                    } else {
                        $('#listeUsers').find('li').each(function(i, userSalon){
                            if($(this).attr('id') != 'titre-li-salon'){
                                $(this).dblclick(function(){
                                    creationRoomPrivee(this);
                                });
                                $('.spanInviter').each(function(i, o){
                                    $(this).remove();
                                });
                            };
                        });
                    };
                };
            })
        }, 10);
    };
    
    socket.on('invationRoomPriveeSaved', function(data){
    // informe les autres gère l'affichage
    // on ajoute a la liste des users de la roomPrivee
    // on supprimer le span ajouter
        console.log(data)
        console.log(data.nomRoomPrivee)
        if(user.id != data.userCible.id){
            var liNeewUser = document.createElement('li');
            $(liNeewUser).attr({id: 'userSalon-'+ data.userCible.id}).addClass('col-xs-11 liRight').html(data.userCible.pseudo);
            $('#salonPrive-'+data.nomRoomPrivee).append(liNeewUser);
            $('#invitation-' + data.userCible.id).remove();
        } else {
            console.log('on fait rien')
        }
    });
    
    var quitterRoomPrivee = function(object){
        $(object).parent().attr('id');
        socket.emit('deconnectionRoomPrivee', {roomId: $(object).parent().attr('id'), userId: user.id})
    };
    socket.on('deconnectionRoomPriveeSaved', function(data){
        $('#userSalon-' + data.userId).remove();
        if(data.userId == user.id){
            $('#salonPrive-'+data.roomId).remove();
            $('#'+data.roomId).parent().remove();
            $('#main-'+data.roomId).remove();
            if(!$('.active').length){
                $('#roomCourante').parent().addClass('active');
                $('#main-roomCourante').removeClass('hidden');
                $('#listeSalons').removeClass('hidden');
                $('.listeUsersMp').addClass('hidden');
            };
        };
    });
// GESTION DES INPUTS
    $('#formTchat').submit(function(ev){
        if($('#inputTchat').val()){
            var message ={
                emetteurName: user.pseudo,
                emetteurID: user.id,
                contenu: $('#inputTchat').val()
            };
            if($('.active').children('a').attr('id') == "roomCourante"){
                message.roomId = $('.active').children('a').html();
            } else {
                message.roomId = $('.active').children('a').attr('id').split('-')[0]+'-'+$('.active').children('a').attr('id').split('-')[1];
            };
            $('#inputTchat').val('');
            socket.emit('envoieMessage', message);
        };
        return false
    });
    socket.on('receptionMessage', function(message){
        var pReponse = document.createElement('p');
        $(pReponse).addClass('text-left col-xs-12');
        var spanEmetteur = document.createElement('span');
        $(spanEmetteur).css({"font-weight": 'bold'}).html(message.emetteurName + ' ');
        var spanHeure = document.createElement('span');
        $(spanHeure).html('('+message.date+') :  ');
        var spanContenu = document.createElement('span');
        $(spanContenu).html(message.contenu);
        $(pReponse).append(spanEmetteur).append(spanHeure).append(spanContenu);
        $('#main-'+message.mainAff).prepend(pReponse);
    });
});