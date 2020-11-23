const config = require("./config");
const trovojs = require('trovo.js');

const client = new trovojs.BrowserClient();

if (!config.get('trovo.user')) {
    throw new Error('No hay usuario configurado. Base de datos inicializada');
}

module.exports = client;
