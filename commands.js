const puntosCommand = require("./commands/puntos.js");
const historiaCommand = require("./commands/historia.js");
const comandosCommand = require("./commands/comandos.js");

const callCommand = async (command, messageInfo) => {
  switch (command.command) {
    case "puntos":
      puntosCommand(command, messageInfo);
      break;
    case 'historia':
      historiaCommand(command, messageInfo);
      break;
    default:
      comandosCommand(command, messageInfo);
      break;
  }
};

module.exports = {
  call: (command, messageInfo) => {
    callCommand(command, messageInfo);
  },
};
