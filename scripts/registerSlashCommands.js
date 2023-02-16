const { REST, Routes } = require('discord.js');
const config = require('../config.json');
const fs = require('node:fs');

const slashCommands = [];

// Find all .js files in the /slashCommandCategories directory
const slashCommandFiles = fs.readdirSync('../slashCommandCategories').filter(file => file.endsWith('.js'));

// Load each command file into memory
for (const file of slashCommandFiles) {
  const commandFile = require(file);

  // Load all slash commands from each command file
  for (const command of commandFile.commands) {
    slashCommands.push(command.data.toJSON());
  }
}

(async () => {
  try {
    console.log(`Started refreshing ${slashCommands.length} application (slash) commands.`);

    const rest = new REST({ version: '10' }).setToken(config.token);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(Routes.applicationCommands(config.clientId), { body: slashCommands });

    console.log(`Successfully reloaded ${data.length} application (slash) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
