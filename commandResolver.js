const commands = require('./commands.js');

let commandResolver = (user, message) => {
  const command = recognizeCommand(message);

  if (!command) {
    return;
  }

  // Formateo para compatibilidad con bot de Twitch
  commands.call(command, { user: {
    username: user.toLowerCase(),
    'display-name': user
  }, message });
}

let recognizeCommand = (message) => {
  const regex = /\!(.*?)$/gm;
  const fullCommand = regex.exec(message);

  if (fullCommand) {
    const splittedCommand = fullCommand[1].split(' ');
    const command = splittedCommand[0];

    splittedCommand.shift(); // remove command from array

    return {
      command: command,
      originalCommand: fullCommand[0].split(' ')[0],
      args: splittedCommand
    };
  }

  return false;
}

module.exports = {
  resolve: (user, message) => {
    commandResolver(user, message);
  }
};
