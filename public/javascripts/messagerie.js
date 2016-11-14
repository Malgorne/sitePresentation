$(document).ready(function(){
// connexion a la room messagerie
    var socket = io('/ioMessagerie');
    socket.emit('connectionMessagerie', {user: user});
// bloque le submit du form de tri des messages
    $('#triMessages').submit(function(){
        return false;
    });
// au chargement de la page, on affiche tout
    $('#triMessages input').each(function(i, o){
        $(o).prop({checked: true});
    });
// GERE LE TRI DE LA LISTE DE MESSAGES
    $('#triMessages input').change(function(){
        showHideTr(this);
        return false;
    });
    var showHideTr = function(checkbox){
        $('tr').each(function(i, tr){
        // évite de supp la première ligne
            if($(tr).attr('data-type')){
                if($(tr).attr('data-type') == $(checkbox).attr('name').split('-')[1]){
                    if($(checkbox).attr('name').split('-')[2] == 'envoyes'){
                        if(user.id == $(tr).attr('id').split('-')[2]){
                            if(!$(checkbox).prop('checked')){
                                $(tr).addClass('hidden');
                            } else {
                                $(tr).removeClass('hidden');
                            };
                        };
                    };
                    if($(checkbox).attr('name').split('-')[2] == 'recus'){
                        if(user.id != $(tr).attr('id').split('-')[2]){
                            if(!$(checkbox).prop('checked')){
                                $(tr).addClass('hidden');
                            } else {
                                $(tr).removeClass('hidden');
                            };
                        };
                    };
                    if($(checkbox).attr('name').split('-')[1] == 'demandeAmis'){
                        if(!$(checkbox).prop('checked')){
                            $(tr).addClass('hidden');
                        } else {
                            $(tr).removeClass('hidden');
                        };
                    };
                };
            };
        });
    };
    
    $('#form_MP').submit(function(){
        return $('#searchDestinataire').val($('#searchDestinataire').attr('data-choix'));
    });
// gère la suppression de plusieurs messages dans messagesListe
    $('.selectedInputs').change(function(){
        var afficherSuppMessages = false;
        $('.selectedInputs').each(function(ev){
            if($(this).prop('checked')){
                afficherSuppMessages = true;
            };
        });
    // si un input est checked, on affiche le bouton supp
        if(afficherSuppMessages){
            var pSupp = document.createElement('p');
            $(pSupp).attr({id: 'suppListeMessages'});
            var aSupp = document.createElement('a');
            $(aSupp).attr({id: 'supMessages'}).addClass('col-xs-offset-2 col-xs-8  btn btn-danger btn-lg').attr({href:'#', title:'supprimer le/les message(s).'}).html('Supprimer le/les message(s)').click(function(ev){
            // on gère le click sur le bouton
                var messagesAsupp = [];
                $('.selectedInputs').each(function(){
                    if($(this).prop('checked')){
                        messagesAsupp.push($(this).prop('name'))
                    };
                });
                socket.emit('suppMuliMessages', messagesAsupp);
                return false;
            });
            $(pSupp).append(aSupp);
            if(!$('#suppListeMessages').length){
                $('#listeMessages').append(pSupp);
            } else {
                $('#suppListeMessages').replaceWith(pSupp);
            };
    // si non on le remove
        } else {
            $('#suppListeMessages').remove();
        };
    });
    
// tr(id="message-#{message.id}-#{message.envoyeParId}", data-type="#{message.dataType}")

    socket.on('suppMuliMessagesSaved', function(listeMessages){
        for(var i=0; listeMessages[i]; i++){
            $('input[name=' + listeMessages[i] + ']').parent().parent().remove();
            $('#suppListeMessages').remove();
        };
    });
    
    var clickTdMessages = function(object){
        $(object).click(function(ev){
            var messageId = $(object).parent().attr('id');
            messageId = messageId.split('-')[1];
            var messageType = $(object).parent().attr('data-type');
            var messageEmeteurId = $(object).parent().attr('id').split('-')[2];
            socket.emit('lectureMessage', {messageId: messageId, messageType: messageType, messageEmeteurId: messageEmeteurId});
            socket.on('lectureMessageConfirmed', function(data){
                window.location.href = data.destination;
            });
        });
    };
    $('.tdMessages').each(function(index, object){
        clickTdMessages(object);
    });
    $('#searchDestinataire').keyup(function(ev, truc){
        console.log('dans le .change')
        if($('#searchDestinataire').val().length){
            socket.emit('searchDest', {value: $('#searchDestinataire').val(), submit: false});
        };
    });
    socket.on('searchDestResult', function(data){
    // lorsqu'on a un résultat, on supprime lancienne liste de choix
        if($('#ulChoixDest').length){
            $('#ulChoixDest').remove();
        };
    // on crée la liste de 5 choix maxi
        var ulListeChoix = document.createElement('ul');
        $(ulListeChoix).attr({id: 'ulChoixDest'}).addClass('col-xs-12 col-md-7');
        for(var i=0; data[i]; i++){
            if(data[i].id != user.id){
                if(i<=5){
                    var liChoix = document.createElement('li');
                    $(liChoix).attr({id: 'choixDest-'+data[i].id}).addClass('liChoixDest col-xs-12 text-left');
                    var pChoix = document.createElement('p');
                    $(pChoix).attr({id: data[i].pseudo+'-'+data[i].id}).addClass('col-xs-12');
                    var imgLinkProfil = document.createElement('img');
                    $(imgLinkProfil).attr({title: data[i].pseudo, alt: data[i].pseudo}).addClass('miniaturesPhotoprofils');
                    var textLinkProfil = document.createElement('span');
                    $(textLinkProfil).html(data[i].pseudo);
                    if(data[i].photoProfil){
                        $(imgLinkProfil).attr({src: '../../'+data[i].photoProfil});
                    } else {
                        $(imgLinkProfil).attr({src: '../../images/uploads/photoProfil/photoProfilDefault.jpg'});
                    };
                    $(pChoix).html(imgLinkProfil);
                    $(liChoix).append(pChoix);
                    $(pChoix).append(textLinkProfil);
                    $(ulListeChoix).append(liChoix);
                    setTimeout(function(){
                        $('.liChoixDest').each(function(index, object){
                            $(object).click(function(ev){
                                var pseudoDest = $(object).children('p').attr('id').split('-')[0];
                                var idDest = $(object).children('').attr('id').split('-')[1];
                                $('#searchDestinataire').val(pseudoDest).attr({"data-choix": pseudoDest+'-'+idDest});
                                $('#ulChoixDest').remove();
                            });
                        }, 50);
                    });
                };
            };
        };
    // on l'insert
        $(ulListeChoix).insertAfter($('#searchDestinataire'));
    });
    
    $('#supMessage').click(function(ev){
        var messageSupId = $('#supMessage').attr('href').split('-')[2];
        console.log($('#supMessage').attr('href'));
        console.log(messageSupId);
        socket.emit('supMessage', $('#supMessage').attr('href').split('-')[2]);
        return false;
    });
    
    socket.on('supMessageSaved', function(destination){
        console.log('dans le saved')
        window.location.href = destination;
    });
    $('#repMessage').click(function(ev){
    // contient 1- 'rep-' / 2- idMessage / 3- idEmetteur
        var refMessage = $('#repMessage').attr('href');
    // on crée le form et le textarea
        var formRepMessage = document.createElement('form');
        $(formRepMessage).attr({id: 'formRepMessage', action: '/network/messagerie/repondre', method: 'POST'}).submit(function(ev){
            var reponse = {
                titre: $('h2').html(),
                contenu: $('#formRepMessage').find('.nicEdit-main').html()
            };
            socket.emit('repMessage', {refMessage: refMessage, reponse: reponse});
            return false;
        });
        var textareaRepMessage = document.createElement('textarea');
        $(textareaRepMessage).attr({id: 'textareaRepMessage', name:'area1', required: true}).addClass('col-xs-12').css({height: '100px'}).html('Réponse');
        var submitRepMessage = document.createElement('input');
        $(submitRepMessage).attr({type: "submit", value:"Envoyer la réponse!"}).addClass('col-xs-12 btn btn-success btn-lg');
        $(formRepMessage).append(textareaRepMessage);
        $(formRepMessage).append(submitRepMessage);
        $('#repMessage').parent().replaceWith(formRepMessage);
        var myNicEditor = new nicEditor().panelInstance('textareaRepMessage');
    // bloque le liens
        return false;
    });
    socket.on('repMessageSaved', function(destination){
        window.location.href = destination;
    });
});