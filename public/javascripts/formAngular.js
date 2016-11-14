var app = angular.module('fritzSolutions', []);
// gère la partie sur le mdp
app.controller('editionProfil', [function() {
    this.verifPassW = function(){
        if(this.oldPassW || this.passW || this.confirmPassW){
            $('input[type=submit]').prop({disabled: true});
            if(this.passW){
                if(this.oldPassW != this.passW){
                    $('#passW').addClass('good').removeClass('bad');
                } else {
                    $('#passW').addClass('bad').removeClass('good');
                };
            };
            if(this.confirmPassW){
                if(this.passW == this.confirmPassW){
                    $('#confirmPassW').addClass('good').removeClass('bad');
                } else {
                    $('#confirmPassW').addClass('bad').removeClass('good');
                };
            };
            if(this.oldPassW && this.passW && this.confirmPassW){
                if(this.oldPassW != this.passW && this.passW == this.confirmPassW){
                    $('input[type=submit]').prop({disabled: false});
                };
            };
        } else {
            $('#passW').removeClass('good').removeClass('bad');
            $('#confirmPassW').removeClass('good').removeClass('bad');
            $('input[type=submit]').prop({disabled: false});
        };
    };
    
    this.changerAdresse = function(){
// affiche les inputs et bloque lenvoi du form
        if(!this.changeAdresse){
            this.changeAdresse = true;
            $('input[type=submit]').prop({disabled: true});
        } else {
            this.changeAdresse = false;
            $('input[type=submit]').prop({disabled: false});
        };
    };
    
    this.verifAdresseComplete = function(inputId){
// indique au user ce quil est obligatoire
        if($(inputId).val()){
            $(inputId).addClass('good').removeClass('bad');
        } else {
            $(inputId).addClass('bad').removeClass('good');
        };
// bloque ou débloque le form
        var formInvalide = false;
        $('.adresseUser').each(function(){
            if($(this).hasClass('bad')){
                formInvalide = true;
            };
        });
        if(formInvalide){
            $('input[type=submit]').prop({disabled: true});
        } else {
            $('input[type=submit]').prop({disabled: false});
        };
    };
    
    this.i=0;
    this.arrayNumber = [];
    this.numberComplet;
    
    this.verifTelephone = function(telNumber){
        console.log(typeof(telNumber))
        var regexGlobale =/[0-9]/;
        
        if(regexGlobale.test(telNumber[telNumber.length-1])){
            this.arrayNumber.push(telNumber[telNumber.length-1]);
        };
        
        for(;this.arrayNumber[this.i]; this.i++){
            if(this.i==0){
                this.numberComplet = this.arrayNumber[this.i];
            } else {
                this.numberComplet += this.arrayNumber[this.i];
            };
        };
        
        this.telUser = this.numberComplet;
    };
}]);