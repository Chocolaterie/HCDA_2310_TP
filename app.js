const express = require('express');
const mongoose = require('mongoose');
const { Article, User } = require('./models');
const { logger } = require('./logger');
const { performResponseService } = require('./helpers');

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

// APP
const app = express();

// Autoriser envoyer json dans le body
app.use(express.json());

// Autoriser tout le monde à taper le back
const cors = require('cors');
app.use(cors());

// Import mes routes externaliser
const articleRouter = require('./routes/article-routes.js');

app.use('/article', articleRouter);

// ---------------------------------------------------------------------------
// SWAGGER UI
// ---------------------------------------------------------------------------
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./swagger_output.json'); // récupérer la doc gen


// init/conf la swagger
// Injecter toute l'application swagger dans l'url /api-docs
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

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
    const token = jwt.sign({ email : loggedUser.email }, SECRET_JWT_KEY, { expiresIn: '6000s' });

    return performResponseService(response, "200", `Authentification avec succès`, token);
});


// ----------------------------------------------------
app.listen(3000, () => {
    console.log("Serveur lancé");
});