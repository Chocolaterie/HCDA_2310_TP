const express = require('express');
const mongoose = require('mongoose');

// JWT
const jwt = require('jsonwebtoken');
const SECRET_JWT_KEY="pain_au_chocolat";

// Connecte à la bdd
mongoose.connect("mongodb://127.0.0.1:27017/db_article");

// Afficher un message quand connectioné avec succès
mongoose.connection.once('open', () => {
    console.log(`Connecté(e) à la base`);
});

// Afficher message erreur si pas connecté
mongoose.connection.on('error', () => {
    console.log(`Erreur de connection à la base`);
})

// Déclarer le modele Article
// 1 : Le nom de module - 2 : Les attributs du model - 3: Le nom de table/collection 
const Article = mongoose.model("Article", { id: Number, title : String, content : String, author : String }, "articles");

// -- Modèle User (utilisé pour l'authentification)
const User = mongoose.model("User", { email: String, password : String }, "users");

// APP
const app = express();

// Autoriser envoyer json dans le body
app.use(express.json());

// ---------------------------------------------------------------------------
// SWAGGER UI
// ---------------------------------------------------------------------------
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./swagger_output.json'); // récupérer la doc gen

// =========================================================
// LOGGER CONFIG 
// =========================================================
const winston = require('winston');

// -- configuer le logger
const logger = winston.createLogger({
    // Log only if level is less than (meaning more severe) or equal to this
    level: "info",
    // Use timestamp and printf to create a standard log format
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
    // Log to the console and a file
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: "logs/app.log" }),
    ],
  });

/**
 * 
 * @param {*} response Réponse HTTP
 * @param {*} code Code métier
 * @param {*} message Message métier
 * @param {*} data La donnéte
 * @returns 
 */
function performResponseService(response, code, message, data=null) {
    const responseService = {
        code : code,
        message : message,
        data : data
    };

    // Avant d'envoyer une réponse JSON
    // LOGGER la réponse
    logger.info(`Code : ${responseService.code} - Message : ${responseService.message}`);

    // Envoyer une réponse JSON
    return response.json(responseService);
}

// init/conf la swagger
// Injecter toute l'application swagger dans l'url /api-docs
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// Middleware JWT
async function middlewareJWT(request, response, next){

    // RG-658-01 : Test si header est valide (erreur si pas valide)
    if (!request.headers.authorization){
        return performResponseService(response, "756", `Le token doit être renseigné`);
    }

    // RG-658-02 : Tester token valide (erreur si pas valide)
    const token = request.headers.authorization.substring(7);

    // Tester la validté du token (en vie ? existe ? etc)
    let valid = false;
    await jwt.verify(token, SECRET_JWT_KEY, (err, decoded) => {
        return valid = !err;
    });

    // Si pas valide erreur métier
    if (!valid){
        return performResponseService(response, "789", `Le token n'est pas valide`);

    }

    // Par défaut si aucune erreur
    return next();
}

// ----------------------------------------------------
// * ROUTES
// ----------------------------------------------------
app.post('/auth', async (request, response) => {
    // RG 056 : Tester couple email mot de passe (connexion user)
    const formDataJSON = request.body;

    // Chercher un user en base avec le couple email/password
    const loggedUser = await User.findOne({ email : formDataJSON.email, password : formDataJSON.password});

    // Si couple email/password invalide
    if (!loggedUser){
        // retourner l'erreur dans la réponse métier
        return performResponseService(response, "704", `Couple email/mot de passe incorrect`);
    }

    // Génére un token
    const token = jwt.sign({ email : loggedUser.email }, SECRET_JWT_KEY, { expiresIn: '60s' });

    return performResponseService(response, "200", `Authentification avec succès`, token);
});


app.get('/articles', async (request, response) => {

    // Récupérer les articles via mongo
    const articles = await Article.find();

    // RG-001 : Récupérer les articles
    return performResponseService(response, "200", "La liste des articles a été récupérés avec succès", articles);
});

app.get('/article/:id', async (request, response) => {

    // Forcer à mettre en entier pour la validité de la condition ===
    const id = Number.parseInt(request.params.id);

    // Pour trouver un article avec l'id
    const foundArticle = await Article.findOne({ id : id});

    // Si je ne trouve pas
    if (!foundArticle){
        // RG-002 : 702
        return performResponseService(response, "702", `Impossible de récupérer un article avec l'UID ${id}`);
    }

    // RG-002 : 200
    return performResponseService(response, "200", `Article récupéré avec succès`, foundArticle);
});

app.post('/save-article', middlewareJWT, async (request, response) => {
    // Récupérer l'article envoyé
    const articleJson = request.body;
    const idArticle = Number.parseInt(articleJson.id);

    // UPDATE
    // Essaye de trouver un article existant si dans l'article envoyé y'a un id
    if (articleJson.id){
        // RG-004 701 : Titre unique
        // ATTENTION : Exclure moi même (l'article qu'on modifie) dans la recherche des doublons de titre
        const foundArticleByTitle = await Article.findOne({ id : {$ne : idArticle}, title : articleJson.title });
        if (foundArticleByTitle){
            return performResponseService(response, "701", `Impossible de modifier un article avec un titre déjà existant`);
        }

        // On veut modifier
        // -- récuperer et modifier
        let article = await Article.findOne({ id : idArticle });

        article.title = articleJson.title
        article.content = articleJson.content
        article.author = articleJson.author

        // -- save
        await article.save();

        // RG-003 : 200
        return performResponseService(response, "200", `Article modifié avec succès`, article);
    }
  
    // CREATE
    // RG-003 701 : Titre unique
    const foundArticleByTitle = await Article.findOne({ title : articleJson.title });
    if (foundArticleByTitle){
        return performResponseService(response, "701", `Impossible d'ajouter un article avec un titre déjà existant`);
    }

    // Si y'a pas l'id c'est une création
    // -- generer un id
    // -- compter combien d'article en base
    const count = await Article.find().count();

    articleJson.id = count + 1;

    // -- ajouter dans le tableau
    const article = new Article(articleJson);

    await article.save();
    
    // RG-003 : 200
    return performResponseService(response, "200", `Article ajouté avec succès`, article);
});

app.delete('/article/:id', middlewareJWT, async (request, response) => {

    // PARSER EN ENTIER l'ID de la requête (dans l'url)
    const id = Number.parseInt(request.params.id);

    // Tester que l'element existe
    const articleToDelete = await Article.findOne({ id : id });

    // Une erreur si trouve pas l'article
    if (!articleToDelete){
        // RG-005 : 702
        return performResponseService(response, "702", `Impossible de supprimer un article dont l'UID n'existe pas`);
    }

    // - supprimer
    await articleToDelete.deleteOne();

    // RG-005 : 200
    return performResponseService(response, "200", `L'article ${id} a été supprimé avec succès`, articleToDelete);
});

// ----------------------------------------------------
app.listen(3000, () => {
    console.log("Serveur lancé");
});