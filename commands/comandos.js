const client = require("../client.js");
const db = require("../db.js");
const utils = require("../common/utils.js");
const jsBeautify = require('js-beautify').js;
const safeEval = require('safe-eval');
const fetch = require("node-fetch");
const cooldown = {};

const comandosCommand = async (command, messageInfo) => {

    let existing = null;

    if (['addcom', 'editcom', 'delcom'].indexOf(command.command) !== -1) {
        if (!utils.checkPermission(messageInfo)) {
            return;
        }

        if (['addcom', 'editcom'].indexOf(command.command) !== -1 && command.args.length < 2) {
            return client.sendMessage('El comando debe tener contenido');
        }

        existing = await db.get('SELECT * FROM commands WHERE command = ?', [command.args[0]]);
    }

    const addcom = async () => {
        try {
            if (existing) {
                editcom();
            } else {

                const content = command.args.slice(1).join(' ');

                if (content.includes('$(eval ') && !content.includes('return ')) {
                    return client.sendMessage('El script debe retornar un valor. Por ej: "var message = \'Juan\'; return message;"');
                }

                await db.run(`INSERT INTO commands(command, content, times) VALUES (?, ?, 0)`, [
                    command.args[0],
                    content
                ]);

                client.sendMessage('Se agregó el comando ' + command.args[0]);
            }
        } catch (err) {
            console.error(err);
            client.sendMessage('Ocurrió un error agregando el comando');
        }
    }

    const editcom = async () => {
        try {
            if (existing) {
                await db.run(`UPDATE commands SET command = ?, content = ?`, [
                    command.args[0],
                    command.args.slice(1).join(' ')
                ]);

                client.sendMessage('Se actualizó el comando ' + command.args[0]);
            } else {
                addcom();
            }
        } catch (err) {
            console.error(err);
            client.sendMessage('Ocurrió un error actualizando el comando');
        }
    }

    switch (command.command) {
        case 'addcom':
            addcom();
            break;
        case 'editcom':
            editcom();
            break;
        case 'delcom':
            try {
                if (existing) {
                    await db.run(`DELETE FROM commands WHERE command = ?`, [
                        command.args[0]
                    ]);

                    client.sendMessage('Se borró el comando ' + command.args[0]);
                } else {
                    client.sendMessage('El comando no existe');
                }
            } catch (err) {
                console.error(err);
                client.sendMessage('Ocurrió un error borrando el comando');
            }
            break;
        default:

            const dbCommand = await db.get('SELECT * FROM commands WHERE command = ?', [command.originalCommand]);

            if (dbCommand && !cooldown[command.command]) {

                let message = dbCommand.content;

                message = message.split('$(user)').join(messageInfo.user['display-name']);

                if (command.args.length > 0) {
                    message = message.split('$(touser)').join(command.args[0].replace(/@/g, ''));
                } else if (message.includes('$(touser)')) {
                    return;
                }

                message = message.split('$(query)').join(command.args.join(' '));

                message = message.split('$(querystring)').join(encodeURIComponent(command.args.join(' ')));

                for (let i = 1; i <= command.args.length; i++) {
                    if (message.includes(`$(${i})`)) {
                        message = message.split(`$(${i})`).join(command.args[i - 1]);
                    }
                }

                if (message.includes('$(count)')) {
                    const count = dbCommand.times + 1;
                    message = message.split('$(count)').join(count);
                    await db.run('UPDATE commands SET times = ? WHERE command = ?', [count, command.originalCommand]);
                }

                if (message.includes('$(urlfetch ')) {
                    const fetchCount = message.split('$(urlfetch ').length - 1;

                    for (let i = 0; i < fetchCount; i++) {
                        const url = message.substring(message.indexOf('$(urlfetch ') + 11, message.indexOf('/urlfetch)'));

                        let value = '';
                        try {
                            const response = await fetch(url);
                            value = await response.text();
                        } catch (err) {
                            value = '(error urlfetch #' + (i + 1) + ')';
                        }

                        message = message.substring(0, message.indexOf('$(urlfetch ')) + value + message.substring(message.indexOf('/urlfetch)') + 10, message.length);
                    }
                }

                // $(eval /** CODE */ /eval)
                if (message.includes('$(eval ')) {
                    
                    const scriptsCount = message.split('$(eval ').length - 1;

                    for (let i = 0; i < scriptsCount; i++) {

                        const script = message.substring(message.indexOf('$(eval ') + 7, message.indexOf('/eval)'));

                        const opCounterFnc = 'let __opCount__ = 0; function __opCounter__() { if (__opCount__ > 100000) { throw new Error("El script ejecutado parece ser un bucle infinito."); } else { __opCount__++; }};';
                        const toEval = `(async function evaluation () { ${opCounterFnc} ${jsBeautify(script).split(';\n').map(line => '__opCounter__();' + line).join(';\n')} })()`;

                        let value = '';
                        try {
                            value = await safeEval(toEval);
                        } catch (e) {
                            console.error(e);
                            value = '(error evaluando script #' + (i + 1) + ')';
                        }

                        message = message.substring(0, message.indexOf('$(eval ')) + value + message.substring(message.indexOf('/eval)') + 6, message.length);
                    }

                }

                client.sendMessage(message);

                cooldown[command.command] = true;
                setTimeout(() => {
                    cooldown[command.command] = false;
                }, 5 * 1000);
            }

            break;
    }

};

module.exports = comandosCommand;
