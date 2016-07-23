// MENU DROITE
$(document).ready(function() {
    
    var topMenu = $('.menuIntern').css('top');
    
    $(window).scroll(function() {
        
        if ($(document).scrollTop() >= 200) {
            $('.menuIntern').css({ position: 'fixed', top: '0px' });
        };
        
        if ($(document).scrollTop() < 200) {
            $('.menuIntern').css({ position: 'absolute', top: topMenu });
        };
    });
    
    
});