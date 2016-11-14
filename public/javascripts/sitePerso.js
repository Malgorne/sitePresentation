
// MENU LATERAUX

$(document).ready(function() {
    var menuIntern =$('.menuIntern'),
        topMenuIntern = $('.menuIntern').css('top'),
        menuNetwork = $('.menuNetwork'),
        topMenuLeft = $('.menuNetwork').css('top');
    
    var gestionScrollMenusLateraux = function(menu, topMenu){
        if ($(document).scrollTop() >= 200) {
            menu.css({ position: 'fixed', top: '0px' });
        };
        if ($(document).scrollTop() < 200) {
            menu.css({ position: 'absolute', top: topMenu });
        };
    };
    
    $(window).scroll(function() {
        gestionScrollMenusLateraux(menuIntern, topMenuIntern);
        gestionScrollMenusLateraux(menuNetwork, topMenuLeft);
    });
    
// EDITION PHOTO DE PROFIL
    
// on bloque le submit au chargement de la page
    $('#submitEditPhotoProfil').prop({disabled: true});
    
// si linput nest pas vide on debloque le submit
    if($('input[name="photoProfil"]').val()){
        $('#submitEditPhotoProfil').prop({disabled: false});
    };
    
// si la valeur de linput change, on débloque le submit si linput contient qqch.
// gère le bind de l'image
    function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $('#imgPhotoProfil').attr('src', e.target.result);
            };
            reader.readAsDataURL(input.files[0]);
        };
    };
    
// lance le bind au changement du selected
    $('input[name="photoProfil"]').change(function(){
        if($('input[name="photoProfil"]').val()){
            readURL(this);
            $('#submitEditPhotoProfil').prop({disabled: false});
        } else {
            $('#submitEditPhotoProfil').prop({disabled: true});
        };
    });
    
// GESTION MULTI-LAYOUT
    if($('footer').length>1){
        $('footer')[0].remove();
    };
});