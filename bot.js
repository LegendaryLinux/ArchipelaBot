const { Client, Events, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const config = require('./config.json');
const { cachePartial } = require('./lib');
const { generalErrorHandler } = require('./errorHandlers');
const fs = require('fs');

// Catch all unhandled errors
process.on('uncaughtException', (err) => generalErrorHandler(err));
process.on('unhandledRejection', (err) => generalErrorHandler(err));

const client = new Client({
  partials: [ Partials.GuildMember, Partials.Message ],
  intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent],
});
client.messageListeners = [];
client.channelDeletedListeners = [];
client.slashCommandCategories = [];

client.tempData = {
  apInterfaces: new Map(),
};

// Load channelDeleted listeners
fs.readdirSync('./channelDeletedListeners').filter((file) => file.endsWith('.js')).forEach((listenerFile) => {
  const listener = require(`./channelDeletedListeners/${listenerFile}`);
  client.channelDeletedListeners.push(listener);
});

// Load slash command category files
fs.readdirSync('./slashCommandCategories').filter((file) => file.endsWith('.js')).forEach((categoryFile) => {
  const slashCommandCategory = require(`./slashCommandCategories/${categoryFile}`);
  client.slashCommandCategories.push(slashCommandCategory);
});

// Run channelDelete events through their listeners
client.on(Events.ChannelDelete, async(channel) => {
  client.channelDeletedListeners.forEach((listener) => listener(client, channel));
});

// Run the interactions through the interactionListeners
client.on(Events.InteractionCreate, async(interaction) => {
  // Handle slash command interactions independently of other interactions
  if (interaction.isChatInputCommand()) {
    for (const category of client.slashCommandCategories) {
      for (const listener of category.commands) {
        if (listener.commandBuilder.name === interaction.commandName) {
          return listener.execute(interaction);
        }
      }
    }

    // If this slash command has no known listener, notify the user and log a warning
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
