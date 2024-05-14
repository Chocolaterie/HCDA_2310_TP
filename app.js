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

// Simulation de données en mémoire
let DB_ARTICLES = [
    { id: 1, title: 'Premier article', content: 'Contenu du premier article', author: 'Isaac' },
    { id: 2, title: 'Deuxième article', content: 'Contenu du deuxième article', author: 'Sanchez' },
    { id: 3, title: 'Troisième article', content: 'Contenu du troisième article', author: 'Toto' }
];

// ----------------------------------------------------
// * ROUTES
// ----------------------------------------------------
app.get('/articles', async (request, response) => {

    // Récupérer les articles via mongo
    const articles = await Article.find();

    response.json(articles);
});

app.get('/article/:id', async (request, response) => {

    // Forcer à mettre en entier pour la validité de la condition ===
    const id = Number.parseInt(request.params.id);

    // Pour trouver un article avec l'id
    const foundArticle = await Article.findOne({ id : id});

    // Si je ne trouve pas
    if (!foundArticle){
        return response.json({ message : `L'article ayant l'id ${id} n'existe pas`});
    }

    // T'as trouvé
    return response.json(foundArticle);
});

app.post('/save-article', async (request, response) => {
    // Récupérer l'article envoyé
    const articleJson = request.body;

    // UPDATE
    // Essaye de trouver un article existant si dans l'article envoyé y'a un id
    if (articleJson.id){
        // On veut modifier
        // -- récuperer et modifier
        let article = await Article.findOne({ id : articleJson.id });

        article.title = articleJson.title
        article.content = articleJson.content
        article.author = articleJson.author

        // -- save
        await article.save();

        // Return = Arreter le code et envoye l'article modifié
        return response.json(article);
    }
  
    // CREATE
    // Si y'a pas l'id c'est une création
    // -- generer un id
    // -- compter combien d'article en base
    const count = await Article.find().count();

    articleJson.id = count + 1;

    // -- ajouter dans le tableau
    const article = new Article(articleJson);

    await article.save();

    // Retourner le json l'article crée
    return response.json(articleJson);
});

app.delete('/article/:id', async (request, response) => {

    // PARSER EN ENTIER l'ID de la requête (dans l'url)
    const id = Number.parseInt(request.params.id);

    // Tester que l'element existe
    const articleToDelete = await Article.findOne({ id : id });

    // Une erreur si trouve pas l'article
    if (!articleToDelete){
        return response.json({ message : `Impossible de supprimer un article inexistant`});  
    }

    // - supprimer
    await articleToDelete.deleteOne();

    return response.json({ message : `Article ${id} supprimé avec succès`});
});

// ----------------------------------------------------
app.listen(3000, () => {
    console.log("Serveur lancé");
});