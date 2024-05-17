
const jwt = require('jsonwebtoken');
const { performResponseService } = require('./helpers');

const SECRET_JWT_KEY="pain_au_chocolat";

module.exports = {
    // Middleware JWT
    middlewareJWT: async (request, response, next) => {

        // RG-658-01 : Test si header est valide (erreur si pas valide)
        if (!request.headers.authorization) {
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
        if (!valid) {
            return performResponseService(response, "789", `Le token n'est pas valide`);
        }

        // Par défaut si aucune erreur
        return next();
    }
};
