
// selecteur

{articlesProfil: {$elemMatch: {id: reponse.articleId}}}

// on set la reponse de larticle poste

{$set:{ "articlesProfil.$.reponses": reponse.contenu }}

// on push la reponse dans reponses

{$push: { "reponses": reponse }}

// resultat

{$push:{ "articlesProfil.$.reponses": reponse }}

db.articles.find({"nouvelArticle.auteurId": "5829d60d149ee29c31a143d1"}).toArray()


db.users.ensureIndex({pseudo : "text"})

db.users.runCommand("text", {search:"za"})


db.users.find( { pseudo: {$text: { $search: "Coffee", $caseSensitive: true, $diacriticSensitive: false }} } )
db.articles.createIndex( { subject: "text" } )

db.inventory.createIndex( { "stock.size": 1, "stock.quantity": 1 } )


db.users.createIndex({pseudo: "text"});
db.users.createIndex({nom: "text"});
db.users.createIndex({prenom: "text"});

db.users.createIndex({"pseudo": "text", "description.nom": "text", "description.prenom": "text"});

db.users.find( {$or: [{$text: { $search: "z", $caseSensitive: false, $diacriticSensitive: false }}]} );

db.users.update({demandesAmis: {$elemMatch: {"demandeur.id": new ObjectID(otherUserId)}}},
                {$pull: {"demandeur.id": otherUserId}},
                {multi: true},
                function(err, result){
    
})

{ $pull: { "demandesAmis": { id: new ObjectID(articleId)} }}

{demandesAmis: {$elemMatch: {$and: [{"demandeur.id": "581cb1df50d7a3d0116456a8"}, {"userCible._id": ObjectId("581cb2411a77bc1912959bdf")}]}}}

{ $elemMatch: { score: 8 , item: "B" } }
db.users.update(
    {demandesAmis: { $elemMatch: {id: Number(1478446643826)}}},
    {$pull: {demandesAmis: { id: Number(1478446643826)}}},
    {multi: true}
);
db.survey.update(
  { },
  { $pull: { results: { $elemMatch: { score: 8 , item: "B" } } } },
  { multi: true }
)

db.users.find({demandesAmis: {$elemMatch: {$and: [{"demandeur.id": "581cb1df50d7a3d0116456a8"}, {"userCible._id": ObjectId("581cb2411a77bc1912959bdf")}]}}});


{_id: new ObjectID(req.session.user.id)}, {$push: {listeAmis: result}}

{ reponses: { $elemMatch: { id: Number(1478508714943)} } }

[ Number(1478684231898) ]
{$pullAll: {"listeMessages.$.id": [ Number(1478684231898) ]}}$or

db.users.update({_id: ObjectId("58204d937b5fd59e1ee41f39")}, {$pull: {listeMessages: {$or: [{id: 1478684231898}]} }})


db.users.update({_id: ObjectId("58204d937b5fd59e1ee41f39")}, {$pullAll: [{"listeMessages.$.id": Number(1478684231898)}]})

db.articles.update({ "nouvelArticle.reponses": { $elemMatch: { id: Number(1478508714943)} } } ,{$pullAll: {"listeMessages.$.id": [ Number(1478684231898) ]}})

db.users.updateOne({_id: ObjectId("58204d937b5fd59e1ee41f39")}, { $pull: { listeMessages: {id: Number(1478546125034)}}})

{demandesAmis: { id: Number(1478545989747)}}}
{_id: new ObjectID("58204d857b5fd59e1ee41f38")}
 {$elemMatch: {id: Number(1478545989747)}}, {$set: { statut : "lu"}}

idUser: ObjectId("58204d937b5fd59e1ee41f39")
idMessage: 1478546125034

db.users.findOne({$and: [{_id: ObjectId("58204d857b5fd59e1ee41f38")}, {listeMessages: {$elemMatch: {id: Number(1478545989747)}}}]})
































