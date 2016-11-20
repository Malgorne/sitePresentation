$(document).ready(function(){
    
    var socket = io('/ioAdmin');
    socket.emit('connectionAdmin', {user: user, profil: profil});
// gère la modération d'un article complet
    $('.modeArticle').each(function(i, object){
        $(object).click(function(ev){
            socket.emit('modeArticle', $(object).attr('href'));
            return false;
        });
    });
// pareil pour chaque réponse
    $('.modeReponse').each(function(i, object){
        $(object).click(function(ev){
            socket.emit('modeReponse', $(object).attr('href'));
            return false;
        });
    });
// pareil pour les messages privés
    $('.modeMessage').each(function(i, object){
        $(object).click(function(ev){
            socket.emit('modeMessage', $(object).attr('href'));
            return false;
        });
    });
// gère le retour de chaque modération
    socket.on('modeSaved', function(data){
        var liMessage = document.createElement('li');
        if($('#moderation')){
            $('#moderation').remove();
        };
        $(liMessage).attr({id: 'moderation'}).html(data.message).addClass(' col-xs-12 liArticlesModerate warning');
        $('#' + data.type + data.objectId).parent().append(liMessage);
        $('#' + data.type + data.objectId).remove();
    });
// gère le changement de droits
    $('#formDroits').submit(function(ev){
        socket.emit('modeDroits', $('#selectDroits').val())
        return false;
    });
    socket.on('modeDroitsSaved', function(droits){
        $('#pDroits').html(profil.pseudo.toUpperCase() + ' a maintenant les droits: ' + droits.toUpperCase() + '.');
    });
// gère les avertissements
    $('.modeAvert').each(function(i,o){
        $(this).click(function(ev){
            socket.emit('modeAvertissement', $(o).attr('href'));
            return false;
        });
    });
    socket.on('modeAvertissementSaved', function(data){
        var message = profil.pseudo.toUpperCase() + ' a maintenant ' + data.avertissements + '. Le dernier a été donné le ' + data.dernierAvertissement + '.';
        $('#pAvertissements').html(message)
    });
});