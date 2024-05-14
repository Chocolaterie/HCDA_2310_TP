const express = require('express');

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
app.get('/articles', (request, response) => {

    response.json(DB_ARTICLES);
});

app.get('/article/:id', (request, response) => {

    // Forcer à mettre en entier pour la validité de la condition ===
    const id = Number.parseInt(request.params.id);

    // Pour trouver un article avec l'id
    // predicate
    const foundArticle = DB_ARTICLES.find((article) => article.id === id);

    // Si je ne trouve pas
    if (!foundArticle){
        return response.json({ message : `L'article ayant l'id ${id} n'existe pas`});
    }

    // T'as trouvé
    return response.json(foundArticle);
});

app.post('/save-article', (request, response) => {
    // Récupérer l'article envoyé
    const articleJson = request.body;

    console.log(articleJson);
    
    // UPDATE
    // Essaye de trouver un article existant si dans l'article envoyé y'a un id
    if (articleJson.id){
        // On veut modifier
        // -- récuperer et modifier
        let article = DB_ARTICLES.find((article) => article.id === articleJson.id);

        article.title = articleJson.title
        article.content = articleJson.content
        article.author = articleJson.author

        // Return = Arreter le code et envoye l'article modifié
        return response.json(article);
    }
  
    // CREATE
    // Si y'a pas l'id c'est une création
    // -- generer un id
    articleJson.id = DB_ARTICLES.length + 1;
    // -- ajouter dans le tableau
    DB_ARTICLES.push(articleJson);

    // Retourner le json l'article crée
    return response.json(articleJson);
});

app.delete('/article/:id', (request, response) => {

    // PARSER EN ENTIER l'ID de la requête (dans l'url)
    const id = Number.parseInt(request.params.id);

    // Tester que l'element existe
    const indexToDelete = DB_ARTICLES.findIndex((article) => article.id === id);

    // Une erreur si trouve pas l'article
    if (indexToDelete == -1){
        return response.json({ message : `Impossible de supprimer un article inexistant`});  
    }

    // - supprimer
    DB_ARTICLES.splice(indexToDelete, 1);

    return response.json({ message : `Article ${id} supprimé avec succès`});
});

// ----------------------------------------------------
app.listen(3000, () => {
    console.log("Serveur lancé");
});