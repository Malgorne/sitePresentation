
// selecteur


var queryRemoveListes = {$pull: {$or: [{listeAmis: {_id: new ObjectID(profilId)}}, {"demandesAmis.demandeur.id": profilId}, {"demandesAmis.userCible._id": new ObjectID(profilId)}]}};

// Remove les réponse
// EMETTEUR   5831ceaae879a2903febc446
var i= {"nouvelArticle.reponses": {$elemMatch: {auteurId: "5831ceaae879a2903febc446"}}}, { $pull: { "nouvelArticle.reponses": {auteurId: "5831ceaae879a2903febc446"}} }

// purge première version. Ne supprime que le compte pas le reste...
    var collection = db.get().collection('users');
    var dateActu = new Date();
    var datePurge = new Date(dateActu-15778800000);
    collection.remove({derniereConnection: {$lte: datePurge}}, function(err, result){
        var listeUsers=[];
        collection.find().toArray( function(err, data){
            listeUsers = data;
        })
        if(!err){
            var message = "Tout s'est bien passé!";
        } else {
            var message = "Une erreure est survenue, merci de recommancer!";
        };
        res.render('admin/listeUsers.jade', {title: 'Gestion des utilisateurs', message: message, user: req.session.user, listeUsers: listeUsers, moment: moment});
    });



// FONCTIONNE
// remove des messages envoyés
db.users.update({listeMessages: { $elemMatch: {"envoyeParId": new ObjectID(profilId)}}}, {$pull: {listeMessages: { envoyeParId: new ObjectID(profilId)}}}, {multi: true});
// remove de la liste d'amis
db.users.update({listeAmis: { $elemMatch: {"_id": new ObjectID(profilId)}}}, {"$pull": { "listeAmis": {"_id": new ObjectID(profilId)} } }, {multi: true});
// remove de la liste des demande d'ami
db.users.update({demandesAmis: { $elemMatch: {"demandeur.id": profilId.toString()}}}, {"$pull": { "demandesAmis": {"demandeur.id": profilId.toString()} } }, false, true);
// remove les articles
db.articles.remove({"nouvelArticle.auteurId": profilId.toString()}, {multi: true})
// remove les réponses
db.articles.update({"nouvelArticle.reponses": {$elemMatch: {auteurId: profilId.toString()}}}, { $pull: { "nouvelArticle.reponses": {auteurId: profilId.toString()}}}, {multi: true})

