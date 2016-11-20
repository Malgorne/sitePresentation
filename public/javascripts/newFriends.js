$(document).ready(function(){
    var socket = io('/ioFriends');
    socket.emit('connectionFriends', {user: user});
// INPUT RECHERCHE AMIS
    $('#formSearchFriends').submit(function (ev) {
        if($('#inputSearchFriends').val().length){
            if(profil){
                socket.emit('searchOwnFriends', {value: $('#inputSearchFriends').val(), submit: true});
            } else {
                socket.emit('searchFriends', {value: $('#inputSearchFriends').val(), submit: true});
            };
        };
        socket.on('searchFriendsSubmitResult', function(data){
            if(profil){
                $('.liNewFriends').each(function(i,o){
                    $(this).addClass('hidden');
                })
                if(data && data.length){
                    for(var i=0; data[i]; i++){
                        $('#profil-'+ data[i]._id).parent().removeClass('hidden');
                    };
                };
            } else {
                if(data.length){
                    $('#ulChoixProfil').remove();
                    var ulProfils = document.createElement('ul');
                    $(ulProfils).attr({id: 'ulProfils'}).addClass('col-xs-12 col-md-offset-2 col-md-8 text-left');
                    for(var i=0; data[i]; i++){
                        if(data[i]._id != user.id){
                            var liProfils = document.createElement('li');
                            $(liProfils).addClass('liNewFriends col-xs-12 col-md-4');
                            var aProfils = document.createElement('a');
                            $(aProfils).attr({id: 'profil-' + data[i]._id, href: '/network/mur/'+data[i]._id, title: data[i].pseudo});
                            $(liProfils).append(aProfils);
                            var imgProfil = document.createElement('img');
                            $(imgProfil).attr({title: data[i].pseudo, alt: data[i].pseudo}).addClass('imgNewFriends');
                            if(data[i].photoProfil){
                                $(imgProfil).attr({src:"../../"+data[i].photoProfil});
                            } else {
                                $(imgProfil).attr({src:"../../images/uploads/photoProfil/photoProfilDefault.jpg"});
                            };
                            $(aProfils).append(imgProfil);
                            var pProfils = document.createElement('p');
                            var aPseudo = document.createElement('a');
                            $(aPseudo).attr({id: 'profil-'+data[i]._id, href: '/network/mur/'+data[i]._id, title: data[i].pseudo}).html(data[i].pseudo);
                            $(pProfils).append(aPseudo);
                            var aAjouter = document.createElement('a');
                            $(aAjouter).attr({id: data[i]._id, herf:'#', title: 'Ajouter'}).addClass('addFriend').html('Ajouter');
                            $(pProfils).append(aAjouter);
                            $(liProfils).append(pProfils);
                            $(ulProfils).append(liProfils);
                        };
                        $('#ulProfils').replaceWith(ulProfils)
                    };
                };
            };
        });
        return false;
    });
// gère la recherche d'amis par nom/ pseudo/ prenom
    $('#inputSearchFriends').keyup(function(ev, truc){
        if($('#inputSearchFriends').val().length){
            if(profil){
                socket.emit('searchOwnFriends', {value: $('#inputSearchFriends').val(), submit: false});
            } else {
                socket.emit('searchFriends', {value: $('#inputSearchFriends').val(), submit: false});
            };
        };
    });
    socket.on('searchFriendsResult', function(data){
    // lorsqu'on a un résultat, on supprime lancienne liste de choix
        if($('#ulChoixProfil').length){
            $('#ulChoixProfil').remove();
        };
    // on crée la liste de 5 choix maxi
        var ulListeChoix = document.createElement('ul');
        $(ulListeChoix).attr({id: 'ulChoixProfil'}).addClass('col-xs-12 col-md-offset-2 col-md-6');
        for(var i=0; data[i]; i++){
            if(data[i]._id != user.id){
                if(i<=5){
                    var liChoix = document.createElement('li');
                    $(liChoix).attr({id: 'choixProfil-'+data[i]._id}).addClass('liChoixProfil col-xs-12 text-left');
                    var aLinkProfil = document.createElement('a');
                    $(aLinkProfil).attr({href:'/network/mur/'+data[i]._id, title: data[i].pseudo}).addClass('col-xs-12');
                    var imgLinkProfil = document.createElement('img');
                    $(imgLinkProfil).attr({title: data[i].pseudo, alt: data[i].pseudo}).addClass('miniaturesPhotoprofils');
                    var textLinkProfil = document.createElement('span');
                    $(textLinkProfil).html(data[i].pseudo);
                    if(data[i].photoProfil){
                        $(imgLinkProfil).attr({src: '../../'+data[i].photoProfil});
                    } else {
                        $(imgLinkProfil).attr({src: '../../images/uploads/photoProfil/photoProfilDefault.jpg'});
                    };
                    $(aLinkProfil).html(imgLinkProfil);
                    $(liChoix).append(aLinkProfil);
                    $(aLinkProfil).append(textLinkProfil);
                    $(ulListeChoix).append(liChoix);
                };
            };
        // on l'insert
            $(ulListeChoix).insertAfter( $("#formSearchFriends") );
        };
    });
    $('#inputSearchFriends').focusout(function(ev){
    // permet de cliquer avant le remove
        setTimeout(function(){
            $('#ulChoixProfil').remove();
        }, 50);
    });
// BOUTON AJOUTER AMI
    var clickAddFriend = function(object){
        $(object).click(function(ev){
            var friendId = $(object).attr('id');
            friendId = friendId.split('-')[1];
            socket.emit('addFriend', friendId);
            socket.on('addFriendSaved', function(data){
                $(object).html('En attente').removeClass('addFriend').addClass('waitingFriend').attr({title: 'en attente Benji', href:'/network/messagerie/own'}).off('click');
            });
        });
    };
    $('.addFriend').each(function(index, object){
        clickAddFriend(object);
    });
// BOUTON SUPPRIMER UN AMI
    var clickSupFriend = function(object){
        $(object).click(function(ev){
            var friendId = $(object).attr('id');
            friendId = friendId.split('-')[1];
            socket.emit('removeFriend', friendId);
            socket.on('removeFriendSaved', function(data){
                $('#li-'+data).remove();
                $(object).parent().parent().remove();
            });
        });
    };
    $('.supFriend').each(function(index, object){
        clickSupFriend(object);
    });
});