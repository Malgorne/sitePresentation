$(document).ready(function(){
// AU CHARGEMENT
// connection à la room
    var socket = io('/ioArticlesMurs');
    socket.emit('consultationProfil', {profil: profil, user: user});
// CREATION articles
    $('#form_articles').submit(function () {
        $('#form_articles').find('.nicEdit-main')
        if($('#form_articles').find('.nicEdit-main').html()){
            socket.emit('nouvelArticle', $('#form_articles').find('.nicEdit-main').html());
            $('#form_articles').find('.nicEdit-main').html('Exprime toi ici!').focus();
        } else {
            $('#form_articles').find('.nicEdit-main').html('Merci de mettre un petit mot avant de valider!');
        };
        return false; // Permet de bloquer l'envoi "classique" du formulaire
    });
    
// Quand on reçoit un message, on l'insère dans la page
    socket.on('nouvelArticleSaved', function(data) {
        $('#listeArticles').prepend(data.nouvelArticle).ready(function(){
            $('.editArticle').each(function(index, object){
                clickEdit(object);
            });
            $('.supArticle').each(function(index, object){
                clickSup(object);
            });
            $('.repArticle').each(function(index, object){
                clickRep(object);
            });
            $('.supReponse').each(function(index, object){
                clickSupRep(object);
            });
        });
    });
// EDITION articles
    var clickEdit = function(object){
        $(object).click(function(ev){
            if($('form').length<2){
                $('input').prop({disabled: true});
            // récupère l'id
                var articleId = $(this).parent().parent().attr('id');
                var contenuArticleDiv = $('#contenu-'+articleId);
                var contenuArticleHtml = $('#contenu-'+articleId).html();
            // création du form d'édition
                var formEdit = document.createElement('form');
                $(formEdit).attr({id: 'formEditArticle-'+articleId, method: 'POST', action: "#"}).addClass('row formEditArticle');
            // création de l'input
                var textareaEdit = document.createElement('textarea');
                $(textareaEdit).attr({id: 'textareaEditArticle-'+articleId, name:'area-'+articleId, required: true}).addClass('col-xs-12 editArticle').css({height: '100px'}).html(contenuArticleHtml);
            // on remplace le contenu par le nicEdit
                $(formEdit).append(textareaEdit);
                $('#contenu-'+articleId).replaceWith(formEdit);
                var myNicEditor = new nicEditor().panelInstance('textareaEditArticle-'+articleId);
            // supprimer EDITION SUPPRESSION
                // faire replaceWith à la place pour EDITER ANNULER
                var oldDivSpanArticle = $(this).parent();
                var newDivSpanArticle = document.createElement('div');
                $(newDivSpanArticle).addClass('row spanArticle');
                var aEditer = document.createElement('input');
                $(aEditer).addClass('col-xs-6 btn btn-success btn-lg editerArticle').attr({type: 'submit', value: 'EDITER', form: 'formEditArticle-'+articleId});
                var aAnnuler = document.createElement('a');
                $(aAnnuler).addClass('col-xs-6 btn btn-warning btn-lg annulerEditionArticle').attr({href: '#'+articleId, title:'Annuler'}).html('Annuler');
                $(newDivSpanArticle).append(aEditer).append(aAnnuler);
                $(oldDivSpanArticle).replaceWith(newDivSpanArticle);
            // si on annule retour à l'état initial
                $(aAnnuler).click(function(ev){
                    $(formEdit).replaceWith(contenuArticleDiv);
                    $(newDivSpanArticle).replaceWith(oldDivSpanArticle);
                    clickEdit($('#edit-'+articleId));
                    clickSup($('#sup-'+articleId));
                    clickRep($('#rep-'+articleId));
                    $('input').prop({disabled: false});
                });
            // au submit
                $('#formEditArticle-'+articleId).submit(function(){
                    if($('#formEditArticle-'+articleId).find('.nicEdit-main').html()){
                        var articleAediter = {
                            id: articleId,
                            contenu: $('#formEditArticle-'+articleId).find('.nicEdit-main').html()
                        };
                        socket.emit('editArticle', articleAediter);
                        $('input').prop({disabled: false});
                    } else {
                        $('#formEditArticle-'+articleId).find('.nicEdit-main').html('Merci de mettre un petit mot avant de valider!');
                    };
                    return false; // Permet de bloquer l'envoi "classique" du formulaire
                });
            };
        });
    };
    socket.on('editArticleSaved', function(data){
        $('#'+data.idArticle).replaceWith(data.divArticle).ready(function(){
            clickEdit($('#edit-'+data.idArticle));
            clickSup($('#sup-'+data.idArticle));
            clickRep($('#rep-'+data.idArticle));
            $('.supReponse').each(function(i, object){
                clickSupRep(object);
            });
        });
    });
// SUPPRESSION articles
    var clickSup = function(object){
        $(object).click(function(ev){
            if($('form').length<2){
                var articleId = $(object).parent().parent().attr('id');
                socket.emit('supArticle', articleId);
            };
            socket.on('supArticleSaved', function(data){
                $('#'+data).remove();
            });
        });
    };
// REPONDRE articles
    var clickRep = function(object){
        $(object).click(function(ev){
            if($('form').length<2){
                $('input').prop({disabled: true});
                var articleId = $(this).parent().parent().attr('id');

                // création du form d'édition
                var formRep = document.createElement('form');
                $(formRep).attr({id: 'formRepArticle-'+articleId, method: 'POST', action: "#"}).addClass('row formRepArticle');
            // création de l'input
                var inputRep = document.createElement('input');
                $(inputRep).attr({id: 'inputRepArticle-'+articleId, name:'area-'+articleId, type:'text', placeholder: 'Ecrire une répone...', required: true}).addClass('col-xs-11 repArticle');
            // on remplace le contenu par l'input'
                $(formRep).append(inputRep);
                $(this).parent().before(formRep);
            // on crée la barre de soumission/annulation du form
                var oldDivSpanArticle = $(this).parent();
                var newDivSpanArticle = document.createElement('div');
                $(newDivSpanArticle).attr({id: 'spanRep-'+articleId}).addClass('row spanRep');
                var aEditer = document.createElement('input');
                $(aEditer).addClass('col-xs-6 btn btn-success btn-lg repondreArticle').attr({type: 'submit', value: 'REPONDRE', form: 'formRepArticle-'+articleId});
                var aAnnuler = document.createElement('a');
                $(aAnnuler).addClass('col-xs-6 btn btn-warning btn-lg annulerReponseArticle').attr({href: '#'+articleId, title:'Annuler'}).html('Annuler');
            // on supprimer lancienne par la nouvelle et on gère l'annulation
                $(newDivSpanArticle).append(aEditer).append(aAnnuler);
                $(oldDivSpanArticle).replaceWith(newDivSpanArticle);
            // si on annule retour à l'état initial
                $(aAnnuler).click(function(ev){
                    $(formRep).remove();
                    $(newDivSpanArticle).replaceWith(oldDivSpanArticle);
                    clickEdit($('#edit-'+articleId));
                    clickSup($('#sup-'+articleId));
                    clickRep($('#rep-'+articleId));
                    $('input').prop({disabled: false});
                });
            // au submit
                $('#formRepArticle-'+articleId).submit(function(){
                    if($('#inputRepArticle-'+articleId).val()){newDivSpanArticle
                        $(newDivSpanArticle).replaceWith(oldDivSpanArticle);
                        socket.emit('repArticle', {reponse: $('#inputRepArticle-'+articleId).val(), articleId: articleId});
                        $('input').prop({disabled: false});
                    } else {
                        $('#inputRepArticle-'+articleId).val('Il faut ecrire quelques mots...');
                    };
                    return false; // Permet de bloquer l'envoi "classique" du formulaire
                });
            };
        });
    };
    socket.on('repArticleSaved', function(reponseSaved){
        $('#'+reponseSaved.idArticle).append(reponseSaved.divReponse).ready(function(){
            console.log("$('#supRep-'+reponseSaved.idArticle)")
            console.log($('#supRep-'+reponseSaved.idArticle))
            $('#formRepArticle-'+reponseSaved.idArticle).remove()
            $('#spanRep-'+reponseSaved.idArticle).remove();
            clickEdit($('#edit-'+reponseSaved.idArticle));
            clickSup($('#sup-'+reponseSaved.idArticle));
            clickRep($('#rep-'+reponseSaved.idArticle));
            clickSupRep($('#supRep-'+reponseSaved.idReponse));
        });
    });
    var clickSupRep = function(object){
        console.log('avant le click')
        console.log(object)
        $(object).click(function(ev){
            if($('form').length<2){
                var reponseId = $(object).parent().parent().attr('id');
                var articleId = $(object).parent().parent().parent().attr('id');
                socket.emit('supReponse', {reponseId: reponseId, articleId: articleId});
            };
            socket.on('supReponseSaved', function(data){
                $('#'+data.reponseId).remove();
                clickEdit($('#edit-'+data.idArticle));
                clickSup($('#sup-'+data.idArticle));
                clickRep($('#rep-'+data.idArticle));
                clickSupRep($('#supRep-'+data.reponseId));
            });
        });
    };
    $('.editArticle').each(function(index, object){
        clickEdit(object);
    });
    $('.supArticle').each(function(index, object){
        clickSup(object);
    });
    $('.repArticle').each(function(index, object){
        clickRep(object);
    });
    $('.supReponse').each(function(index, object){
        clickSupRep(object);
    });
});