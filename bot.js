const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config.json');
const { generalErrorHandler } = require('./errorHandlers');
const fs = require('fs');

// Catch all unhandled errors
process.on('uncaughtException', (err) => generalErrorHandler(err));
process.on('unhandledRejection', (err) => generalErrorHandler(err));

const client = new Client({
  partials: [ Partials.GuildMember, Partials.Message, Partials.Reaction ],
  intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers ],
});
client.devMode = process.argv[2] && process.argv[2] === 'dev';
client.slashCommandCategories = [];

client.tempData = {
  apInterfaces: new Map(),
};

// Load slash command category files
fs.readdirSync('./slashCommandCategories').filter((file) => file.endsWith('.js')).forEach((categoryFile) => {
  const slashCommandCategory = require(`./slashCommandCategories/${categoryFile}`);
  client.slashCommandCategories.push(slashCommandCategory);
});

// Run the interactions through the interactionListeners
client.on(Events.InteractionCreate, async(interaction) => {
  // Handle slash command interactions independently of other interactions
  if (interaction.isChatInputCommand()) {
    for (const listener of client.slashCommandCategories.commands) {
      if (listener.commandBuilder.name === interaction.commandName) {
        return listener(interaction);
      }
    }

    // If this slash command has no known listener, notify the user and log a warning
    console.warn(`Unknown slash command received: ${interaction.commandName}`);
    return interaction.reply('Unknown command.');
  }
});

// Use the general error handler to handle unexpected errors
client.on(Events.Error, async(error) => generalErrorHandler(error));

client.once(Events.ClientReady, async () => {
  // Login and initial setup successful
  console.info(`Connected to Discord. Active in ${client.guilds.cache.size} guilds.`);
});

client.login(config.token);