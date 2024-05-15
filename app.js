const express = require('express');

const mongoose = require('mongoose');

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

// APP
const app = express();

// Autoriser envoyer json dans le body
app.use(express.json());


// ----------------------------------------------------
// * ROUTES
// ----------------------------------------------------
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

app.post('/save-article', async (request, response) => {
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

app.delete('/article/:id', async (request, response) => {

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