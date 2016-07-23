
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const db = require('./exercice_16_db');

var app = express();
var portEcoute = 1234;

app.use(cookieParser());

app.use(session({
    secret: 'trucSecret',
    saveUninitialized: false,
    resave: false
}));

app.use('/img', express.static(__dirname + '/views/img'))
    .use('/css', express.static(__dirname + '/views/css'))
    .use(bodyParser.urlencoded({
    extended: false
}));

app.engine('jade', require('jade').__express)
    .set('view engine', 'jade')
    .set('views', 'views/html');

app.post('/traitement', function(req, res){
    if(req.body.mdp === req.body.confirmMdp){
        req.session.user = {
            nom: req.body.nom,
            prenom: req.body.prenom,
            nbrConnections: 0
        };
        
        req.session.save();
        
        var collection = db.get().collection('users');
        
        collection.insert({ nom: req.body.nom,
                        prenom: req.body.prenom,
                        mdp: req.body.mdp
                        },
                        function(err, result){
                            collection.find().toArray(function(err, data){
                            var i = data.length-1;
                            res.render('traitement.jade', {nomPage: 'ExpressJS/traitement', monH1: 'traitement formulaire', nom: data[i].nom, prenom: data[i].prenom, mdp: data[i].mdp});
                            });
                        }
                    );
    } else {
        res.redirect('/formulaire');
    };
});

function restriction(req, res, next){
    if(req.session.user || req.url === '/formulaire'){
        if(req.session.user){
            req.session.user.nbrConnections +=1;
        };
        next();
    } else {
        res.redirect('/formulaire')
    };
};

app.use(restriction);

app.get('/:pageDemandee', function(req, res){
    var pageDemandee = req.params.pageDemandee;
    if(pageDemandee === 'formulaire' && req.session.user){
        res.send('vous êtes déjà connecté!');
    } else {
        var monH1 = pageDemandee;
        if(req.session.user){
            monH1 += ' - Nombre de connections: ' + req.session.user.nbrConnections;
        };
        res.render(pageDemandee + '.jade', {nomPage: 'ExpressJS/' + pageDemandee, monH1: monH1, mdp: req.body.mdp});
    };
});

app.use(function(req, res, next) {
  res.status(404).send('Sorry cant find that!');
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

db.connect('mongodb://localhost:27017/blog', function(err){
    if(err){
        console.log('Impossible de se connecter à la base de données.');
        process.exit(1);
    } else {
        app.listen(portEcoute, function(){
            console.log('Le serveur est disponible sur le port 1234');
        });
    };
});