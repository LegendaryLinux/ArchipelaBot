const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
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
    GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent],
});
client.messageListeners = [];
client.slashCommandCategories = [];

client.tempData = {
  apInterfaces: new Map(),
};

// Load slash command category files
fs.readdirSync('./slashCommandCategories').filter((file) => file.endsWith('.js')).forEach((categoryFile) => {
  const slashCommandCategory = require(`./slashCommandCategories/${categoryFile}`);
  client.slashCommandCategories.push(slashCommandCategory);
});

// Run messages through the listeners
client.on(Events.MessageCreate, async (msg) => {
  // Fetch message if partial
  const message = await cachePartial(msg);
  if (message.member) { message.member = await cachePartial(message.member); }
  if (message.author) { message.author = await cachePartial(message.author); }

  // Ignore all bot messages
  if (message.author.bot) { return; }

  // Run the message through the message listeners
  return client.messageListeners.forEach((listener) => listener(client, message));
});

// Run the interactions through the interactionListeners
client.on(Events.InteractionCreate, async(interaction) => {
  // Load message listener files
  fs.readdirSync('./messageListeners').filter((file) => file.endsWith('.js')).forEach((listenerFile) => {
    const listener = require(`./messageListeners/${listenerFile}`);
    client.messageListeners.push(listener);
  });

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