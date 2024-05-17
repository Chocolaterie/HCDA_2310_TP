
const express = require('express');
const router = express.Router();
const { middlewareJWT } = require('../middlewares');
const { performResponseService, errorSurfaceResponseService } = require('../helpers');
const { Article, User, Category } = require('../models');
const { logger } = require('../logger');

router.get('/', async (request, response) => {

    // Récupérer les articles via mongo
    const articles = await Article.find();

    // RG-001 : Récupérer les articles
    return performResponseService(response, "200", "La liste des articles a été récupérés avec succès", articles);
});

router.get('/:id', async (request, response) => {

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

router.post('/save', middlewareJWT, async (request, response) => {
    // Récupérer l'article envoyé
    const articleJson = request.body;

    // CONTROLE DE SURFACE
    if (articleJson.title.length >= 255){
        // erreurs des données vérifiés
        const errors = [
            { key : "title", message: "Le titre ne doit pas dépasser 255 caractères"}
        ];

        return errorSurfaceResponseService(response, "901", "Controle de surface incorrect", errors);
    }

    // CONTROLE METIER
    const idArticle = Number.parseInt(articleJson.id);

    // POUR LA DEMO PAR DEFAUT ASSOCIER A LA CATEGORY : HEHEHEHEHEHEHE
    const category = await Category.findById('664752924adf3d6f6255a913');
    console.log(category);
    
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

    // - associer un objet
    article.category = category;
    // -- many to many
    //article.categories.push(category)

    await article.save();
    
    // RG-003 : 200
    return performResponseService(response, "200", `Article ajouté avec succès`, article);
});

router.delete('/:id', middlewareJWT, async (request, response) => {

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

// exporter le router pour le reutiliser dans app.js
module.exports = router;