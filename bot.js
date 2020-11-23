const dayjs = require("dayjs");
const config = require("./config");
const pointsHandler = require("./schedule/points");

config.initialize().then(() => {
    const client = require("./client.js");
    const commandResolver = require("./commandResolver.js");

    client.on('ready', () => {
        console.log('[' + dayjs().toISOString() + '] ¡Conectado!');
    });

    client.on('chatMessage', (message) => {
        if (!message || message.user === undefined) return;
        if (message.user === config.get('trovo.user')) return;
        if (!message.content) return;

        commandResolver.resolve(message.user, message.content);

        pointsHandler({ username: message.user.toLowerCase(), 'display-name': message.user });

    });
    
    console.log('[' + dayjs().toISOString() + '] Conectando...');

    client.login(
        'https://trovo.live/' + config.get('trovo.user'),
        config.get('trovo.email'),
        config.get('trovo.password')
    );
});