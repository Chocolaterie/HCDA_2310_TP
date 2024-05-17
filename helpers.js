const { logger } = require('./logger');

module.exports = {
   /**
     * 
     * @param {*} response Réponse HTTP
     * @param {*} code Code métier
     * @param {*} message Message métier
     * @param {*} data La donnéte
     * @returns 
     */
    performResponseService : (response, code, message, data=null) => {
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
    },

    errorSurfaceResponseService : (response, code, message, errors) => {
        const responseService = {
            code : code,
            message : message,
            data : null,
            errors: errors
        };

        // Avant d'envoyer une réponse JSON
        // LOGGER la réponse
        logger.info(`Code : ${responseService.code} - Message : ${responseService.message}`);

        // Envoyer une réponse JSON
        return response.json(responseService);
    }
};