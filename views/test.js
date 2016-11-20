
// selecteur


var queryRemoveListes = {$pull: {$or: [{listeAmis: {_id: new ObjectID(profilId)}}, {"demandesAmis.demandeur.id": profilId}, {"demandesAmis.userCible._id": new ObjectID(profilId)}]}};

// Remove les réponse
// EMETTEUR   5831ceaae879a2903febc446
var i= {"nouvelArticle.reponses": {$elemMatch: {auteurId: "5831ceaae879a2903febc446"}}}, { $pull: { "nouvelArticle.reponses": {auteurId: "5831ceaae879a2903febc446"}} }


db.users.update({listeMessages: { $elemMatch: {"envoyeParId": ObjectId("5831f5be132bbeb14893673d")}}}, {$pull: {listeMessages: { envoyeParId: ObjectId("5831f5be132bbeb14893673d")}}}, {multi: true});



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

