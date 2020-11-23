const client = require("../client.js");
const db = require("../db.js");
const utils = require("../common/utils.js");
const dayjs = require("dayjs");
const config = require("../config.js");

let globalCooldown = false;
let alreadyWarnedUserCD = false;
let alreadyWarnedGlobalCD = false;

const historiaCommand = async (command, messageInfo) => {

  if (globalCooldown) {
    if (!alreadyWarnedGlobalCD) {
      client.sendMessage("@" + messageInfo.user["display-name"] + ", !historia tiene un CD global de 5 min.");
      alreadyWarnedGlobalCD = true;
    }
    return;
  }

  if (await utils.hasCooldown(messageInfo.user.username, 'historia')) {
    if (!alreadyWarnedUserCD) {
      client.sendMessage("@" + messageInfo.user["display-name"] + ", !historia tiene un CD de 8hs por usuario.");
      alreadyWarnedUserCD = true;
    }
    return;
  }
  
  alreadyWarnedGlobalCD = false;
  alreadyWarnedUserCD = false;

  await utils.setCooldown(messageInfo.user.username, 'historia', dayjs().add(8, 'hour'));

  const storyNumber = Math.floor(Math.random() * 2) + 1;
  const random = Math.floor(Math.random() * 2);

  let username = null;

  if (command.args[0]) {
    username = command.args[0];
    if (username.indexOf("@") === 0) {
      username = username.substring(1);
    }

    if (await utils.hasCooldown(username.toLowerCase(), 'historia-duo')) {
      client.sendMessage(`@${messageInfo.user["display-name"]} , ${username} ya tuvo duo historia hace menos de una hora`);
      return;
    }

    await utils.setCooldown(username.toLowerCase(), 'historia-duo', dayjs().add(1, 'hour'));

  }

  switch (storyNumber) {
    case 1:
      if (username) {
        const users = [messageInfo.user.username, username];
        const user1 = users[random];
        const user2 = user1 === messageInfo.user.username ? username : messageInfo.user['display-name'];

        client.sendMessage(`${user1} y ${user2} iban en el barco y encontraron un tesoro. ${user1} le disparó a ${user2} y se quedo con el tesoro (+25 ${config.get('pointsname')}).`);
        client.sendMessage('/ban ' + user2 + ' ' + 5 * 60);

        try {
          const userPoints = await utils.getPoints(user1);
          if (userPoints) {
            await db.run('UPDATE points SET quantity = ? WHERE username = ?', [userPoints.quantity + 25, user1]);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        const user = messageInfo.user.username;
        if (Math.floor(Math.random() * 2)) {
          client.sendMessage(`${user} iba en el barco y ve una isla a lo lejos. En el trayecto es devorado por un monstruo marino.`);
          client.sendMessage('/ban ' + user + ' ' + 5 * 60);
        } else {
          client.sendMessage(`${user} iba en el barco y ve una isla a lo lejos. Para su sorpresa, ¡encuentra un tesoro! (+25 ${config.get('pointsname')}).`);
          
          try {
            const userPoints = await utils.getPoints(user);
            if (userPoints) {
              await db.run('UPDATE points SET quantity = ? WHERE username = ?', [userPoints.quantity + 25, user]);
            }
          } catch (err) {
            console.error(err);
          }
        }
      }
      break;
    case 2:
      const divisiones = [
        { liga: 'Hierro', puntos: 1 },
        { liga: 'Bronce', puntos: 3 },
        { liga: 'Plata', puntos: 5 },
        { liga: 'Oro', puntos: 8 },
        { liga: 'Platino', puntos: 10 },
        { liga: 'Diamante', puntos: 15 },
        { liga: 'Master', puntos: 20 },
        { liga: 'GrandMaster', puntos: 25 },
        { liga: 'Challenger', puntos: 30 }
      ];

      const division = divisiones[Math.floor(Math.random() * divisiones.length)];

      if (username) {
        const users = [messageInfo.user.username, username];
        const user1 = users[random];
        const user2 = user1 === messageInfo.user.username ? username : messageInfo.user['display-name'];

        const randomStory = Math.floor(Math.random() * 2);

        if (randomStory === 0) {
          client.sendMessage(`${user1} y ${user2} jugaron una ranked duo. ${user1} la troleó y ambos bajaron a Hierro.`);
          client.sendMessage('/ban ' + user1 + ' ' + 5 * 60);
          client.sendMessage('/ban ' + user2 + ' ' + 5 * 60);
        } else if (randomStory === 1) {
          client.sendMessage(`${user1} y ${user2} jugaron una ranked duo. ¡Subieron a ${division.liga}! (+${division.puntos} ${config.get('pointsname')})`);
          for (let i = 0; i < 2; i++) {
            try {
              const userPoints = await utils.getPoints(i === 0 ? user1 : user2);
              if (userPoints) {
                await db.run('UPDATE points SET quantity = ? WHERE username = ?', [userPoints.quantity + division.puntos, i === 0 ? user1 : user2]);
              }
            } catch (err) {
              console.error(err);
            }
          }
        }
      } else {
        const user = messageInfo.user.username;
        if (Math.floor(Math.random() * 2)) {
          client.sendMessage(`${user} jugó una SoloQ. La troleó y bajó a Hierro.`);
          client.sendMessage('/ban ' + user + ' ' + 5 * 60);
        } else {
          client.sendMessage(`${user} jugó una SoloQ. ¡Subió a ${division.liga}! (+${division.puntos} ${config.get('pointsname')})`);
          try {
            const userPoints = await utils.getPoints(user);
            if (userPoints) {
              await db.run('UPDATE points SET quantity = ? WHERE username = ?', [userPoints.quantity + division.puntos, user]);
            }
          } catch (err) {
            console.error(err);
          }
        }
      }
      break;
    default:
      break;
  }

  // Cooldown global de 5 minutos
  globalCooldown = true;
  setTimeout(() => {
    globalCooldown = false;
  }, 5 * 60 * 1000);
};

module.exports = historiaCommand;
