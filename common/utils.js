const dayjs = require("dayjs");
const config = require("../config.js");

const utils = {
  mods: [],
  checkPermission: (messageInfo) => {
    return (
      utils.mods.some(m => m.username === messageInfo.user.username) ||
      messageInfo.user.username === config.get('channel').toLowerCase() ||
      messageInfo.user.username === config.get('owner').toLowerCase()
    );
  },
  getPoints: (username) => {
    const db = require('../db.js');

    return new Promise(async (resolve, reject) => {
      if (username.indexOf("@") === 0) {
        username = username.substring(1);
      }
      username = username.toLowerCase();
  
      try {
        const userPoints = await db.get('SELECT * FROM points WHERE username = ?', [username]);
        if (userPoints) {
          resolve(userPoints);
        } else {
          db.run(
            "INSERT INTO points(username, displayname, quantity) VALUES (?, ?, ?)",
            [username, null, 0]
          ).then(() => {
            resolve ({
              username,
              displayname: null,
              quantity: 0
            });
          })
        }
      } catch (err) {
        db.run(
          "INSERT INTO points(username, displayname, quantity) VALUES (?, ?, ?)",
          [username, null, 0]
        ).then(() => {
          resolve ({
            username,
            displayname: null,
            quantity: 0
          });
        }).catch(e => {
          reject();
        });
      }
    });
  },
  setCooldown: async (username, command, expiration) => {
    const db = require('../db.js');
    const cooldown = await db.get('SELECT * FROM cooldowns WHERE username = ? AND command = ?', [username, command]);
    if (!cooldown) {
      await db.run('INSERT INTO cooldowns(username, command, expiration) VALUES (?, ?, ?)', [username, command, expiration.toISOString()]);
    } else {
      await db.run('UPDATE cooldowns SET expiration = ? WHERE username = ? AND command = ?', [expiration.toISOString(), username, command]);
    }
  },
  hasCooldown: async (username, command) => {
    const db = require('../db.js');
    const now = dayjs();
    const cooldown = await db.get('SELECT * FROM cooldowns WHERE username = ? AND command = ?', [username, command]);
    if (cooldown) {
      return now.isBefore(dayjs(cooldown.expiration));
    } else {
      return false;
    }
  }
};

module.exports = utils;
