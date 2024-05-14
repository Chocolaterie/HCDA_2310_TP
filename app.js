const express = require('express');

const app = express();


// ----------------------------------------------------
// * ROUTES
// ----------------------------------------------------
app.get('/articles', (request, response) => {

    response.json({ message : `Retournera la liste des articles`});
});

app.get('/article/:id', (request, response) => {

    const id = request.params.id;

    response.json({ message : `Retournera l'article ayant l'id ${id}`});
});

app.post('/save-article', (request, response) => {

    response.json({ message : `Va créer/mettre à jour un article envoyé`});
});

app.delete('/article/:id', (request, response) => {

    const id = request.params.id;

    response.json({ message : `Supprimera un article par l'id ${id}`});
});

// ----------------------------------------------------
app.listen(3000, () => {
    console.log("Serveur lancé");
});