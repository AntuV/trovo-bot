const client = require("../client.js");
const db = require("../db.js");
const utils = require("../common/utils.js");
const dayjs = require("dayjs");
const config = require("../config.js");

let cooldown = {};

const puntosCommand = async (command, messageInfo) => {

  if (cooldown[messageInfo.user.username]) {
    if (dayjs().isBefore(cooldown[messageInfo.user.username].add(10, 'second'))) {
      if (!utils.checkPermission(messageInfo)) {
        return;
      }
    }
  }

  cooldown[messageInfo.user.username] = dayjs();

  if (command.args.length === 0) {
    utils
      .getPoints(messageInfo.user.username)
      .then((userPoints) => {
        client.sendMessage(`@${messageInfo.user["display-name"]} , tenés ${userPoints.quantity} ${config.get('pointsname')}`);
      })
      .catch(() => {
        client.sendMessage(`@${messageInfo.user["display-name"]} , no tenés ${config.get('pointsname')}`);
      });
  } else if (command.args.length === 1) {
    if (command.args[0] === "rank") {
      const rank = await db.all('SELECT ROW_NUMBER() OVER (ORDER BY quantity DESC) as rank, * from points');
      for (let i = 0; i < rank.length; i++) {
        if (rank[i].username === messageInfo.user.username) {
          client.sendMessage(`#${rank[i].rank} ${messageInfo.user["display-name"]} ${rank[i].quantity} ${config.get('pointsname')}`);
          break;
        }
      }
    } else if (command.args[0].includes("top")) {
      let limit = 3;

      if (utils.utils.checkPermission(messageInfo)) {
        const numberMatch = command.args[0].match(/\d+/);
        if (numberMatch) {
          limit = Number.parseInt(numberMatch[0]);
        }
      }

      const top = await db.all(
        "SELECT * FROM points WHERE username <> ? ORDER BY quantity DESC LIMIT " + limit,
        [config.get('trovo.user').toLowerCase()]
      );

      let text = "";

      for (let i = 1; i <= top.length; i++) {
        text += `${i > 1 ? " | " : ""} #${i} ${top[i - 1].displayname ? top[i - 1].displayname : top[i - 1].username
          } ${top[i - 1].quantity}`;
      }

      client.sendMessage(text);
    } else {
      utils
        .getPoints(command.args[0])
        .then((userPoints) => {
          client.sendMessage(
            `@${messageInfo.user["display-name"]} , ${userPoints.displayname
              ? userPoints.displayname
              : userPoints.username
            } tiene ${userPoints.quantity} ${config.get('pointsname')}`
          );
        })
        .catch(() => {
          client.sendMessage(`@${messageInfo.user["display-name"]} , no se encontraron los ${config.get('pointsname')} de ${command.args[0]}`);
        });
    }
  } else if (command.args.length === 2) {
  } else if (command.args.length === 3) {
    if (command.args[0] === "agregar" || command.args[0] === "quitar") {
      if (!isNaN(command.args[2])) {
        utils
          .getPoints(command.args[1])
          .then(async (userPoints) => {
            const pointsToAdd =
              command.args[0] === "agregar"
                ? Number.parseInt(command.args[2], 10)
                : Number.parseInt(command.args[2] * -1, 10);

            const points =
              userPoints.quantity + pointsToAdd > 0
                ? userPoints.quantity + pointsToAdd
                : 0;

            if (!utils.checkPermission(messageInfo)) {
              let valid = false;

              if (pointsToAdd > 0) {
                try {
                  const originUser = await utils.getPoints(
                    messageInfo.user.username
                  );
                  if (originUser.quantity >= pointsToAdd) {
                    try {
                      await db.run(
                        "UPDATE points SET quantity = ? WHERE username = ?",
                        [
                          originUser.quantity - pointsToAdd,
                          messageInfo.user.username,
                        ]
                      );
                      valid = true;
                    } catch (err) {
                      console.error(err);
                    }
                  }
                } catch (err) {
                  console.error(err);
                }
              }

              if (!valid) {
                return client.sendMessage(`@${messageInfo.user["display-name"]} , no podés transferir esa cantidad.`);
              }
            }

            try {
              await db.run(
                "UPDATE points SET quantity = ? WHERE username = ?",
                [points, userPoints.username]
              );
              client.sendMessage(
                `@${messageInfo.user["display-name"]} , ${userPoints.displayname
                  ? userPoints.displayname
                  : userPoints.username
                } ahora tiene ${points} ${config.get('pointsname')}`
              );
            } catch (err) {
              console.error(err);
            }
          })
          .catch(() => {
            client.sendMessage(`@${messageInfo.user["display-name"]} , no se encontraron los ${config.get('pointsname')} de ${command.args[1]}`);
            return;
          });
      } else {
        client.sendMessage(`@${messageInfo.user["display-name"]} , el número ingresado es inválido`);
      }
    }
  }
};

module.exports = puntosCommand;
