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

// Middleware JWT
async function middlewareJWT(request, response, next){

    // RG-658-01 : Test si header est valide (erreur si pas valide)
    if (!request.headers.authorization){
        const responseService = {
            code : "756",
            message : `Le token doit être renseigné`,
            data : null
        }
        return response.json(responseService);
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
        const responseService = {
            code : "789",
            message : `Le token n'est pas valide`,
            data : null
        }
        return response.json(responseService);
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
        const responseService = {
            code : "704",
            message : `Couple email/mot de passe incorrect`,
            data : null
        }
    
        return response.json(responseService);
    }

    // Génére un token
    const token = jwt.sign({ email : loggedUser.email }, SECRET_JWT_KEY, { expiresIn: '60s' });

    const responseService = {
        code : "200",
        message : `Authentification avec succès`,
        data : token
    };

    return response.json(responseService);
});


app.get('/articles', async (request, response) => {

    // Récupérer les articles via mongo
    const articles = await Article.find();

    // RG-001 : Récupérer les articles
    const responseService = {
        code : "200",
        message : "La liste des articles a été récupérés avec succès",
        data : articles
    }
    return response.json(responseService);
});

app.get('/article/:id', async (request, response) => {

    // Forcer à mettre en entier pour la validité de la condition ===
    const id = Number.parseInt(request.params.id);

    // Pour trouver un article avec l'id
    const foundArticle = await Article.findOne({ id : id});

    // Si je ne trouve pas
    if (!foundArticle){
        // RG-002 : 702
        const responseService = {
            code : "702",
            message :`Impossible de récupérer un article avec l'UID ${id}`,
            data : null
        }
        return response.json(responseService);
    }

    // RG-002 : 200
    const responseService = {
        code : "200",
        message :`Article récupéré avec succès`,
        data : foundArticle
    }
    return response.json(responseService);
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
            const responseService = {
                code : "701",
                message :`Impossible de modifier un article avec un titre déjà existant `,
                data : null
            }
            return response.json(responseService);
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
        const responseService = {
            code : "200",
            message :`Article modifié avec succès`,
            data : article
        }
        return response.json(responseService);
    }
  
    // CREATE
    // RG-003 701 : Titre unique
    const foundArticleByTitle = await Article.findOne({ title : articleJson.title });
    if (foundArticleByTitle){
        const responseService = {
            code : "701",
            message :`Impossible d'ajouter un article avec un titre déjà existant`,
            data : null
        }
        return response.json(responseService);
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
    const responseService = {
        code : "200",
        message :`Article ajouté avec succès`,
        data : article
    }
    return response.json(responseService);
});

app.delete('/article/:id', middlewareJWT, async (request, response) => {

    // PARSER EN ENTIER l'ID de la requête (dans l'url)
    const id = Number.parseInt(request.params.id);

    // Tester que l'element existe
    const articleToDelete = await Article.findOne({ id : id });

    // Une erreur si trouve pas l'article
    if (!articleToDelete){
        // RG-005 : 702
        const responseService = {
            code : "702",
            message : `Impossible de supprimer un article dont l'UID n'existe pas`,
            data : null
        }
        return response.json(responseService);
    }

    // - supprimer
    await articleToDelete.deleteOne();

    // RG-005 : 200
    const responseService = {
        code : "200",
        message :`L'article ${id} a été supprimé avec succès`,
        data : articleToDelete
    }
    return response.json(responseService);
});

// ----------------------------------------------------
app.listen(3000, () => {
    console.log("Serveur lancé");
});