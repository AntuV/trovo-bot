const db = require("./db");

let allConfig = {};

const config = {
    initialize: () => {
        return new Promise(resolve => {
            db.all('SELECT * FROM config').then(configs => {
                for (let i = 0; i < configs.length; i++) {
                    allConfig[configs[i].key] = JSON.parse(configs[i].value);
                }
                resolve();
            }).catch(err => {
                setTimeout(() => {
                    config.initialize().then(() => resolve());
                }, 100);
            });
        });
    },
    get: (key) => {
        if (allConfig[key] === undefined) {
            return null;
        }

        return allConfig[key];
    },
    set: (key, value) => {
        return new Promise((resolve) => {
            if (allConfig[key] === undefined) {
                db.run('INSERT INTO config(key, value) VALUES (?, ?)', [key, JSON.stringify(value)]).then(() => {
                    allConfig[key] = value;
                    resolve();
                });
                return;
            }

            db.run('UPDATE config SET value = ? WHERE key = ?', [JSON.stringify(value), key]).then(() => {
                allConfig[key] = value;
                resolve();
            });
        });
    },
    getAll: () => {
        return allConfig;
    }
}

module.exports = config;