const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config.json');
const { cachePartial } = require('./lib');
const { dbInit } = require('./database');
const { generalErrorHandler } = require('./errorHandlers');
const fs = require('fs');

// Catch all unhandled errors
process.on('uncaughtException', (err) => generalErrorHandler(err));
process.on('unhandledRejection', (err) => generalErrorHandler(err));

// Initialize database in memory
dbInit();

const client = new Client({
  partials: [ Partials.GuildMember, Partials.Message, Partials.Channel ],
  intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates],
});
client.messageListeners = [];
client.channelDeletedListeners = [];
client.voiceStateListeners = [];
client.slashCommandCategories = [];
client.routines = [];

client.tempData = {
  apInterfaces: new Map(),
};

// Load message listener files
fs.readdirSync('./messageListeners').filter((file) => file.endsWith('.js')).forEach((listenerFile) => {
  const listener = require(`./messageListeners/${listenerFile}`);
  client.messageListeners.push(listener);
});

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

// Load voice state listener files
fs.readdirSync('./voiceStateListeners').filter((file) => file.endsWith('.js')).forEach((listenerFile) => {
  const listener = require(`./voiceStateListeners/${listenerFile}`);
  client.voiceStateListeners.push(listener);
});

// Load routines and run them once per hour
fs.readdirSync('./routines').filter((file) => file.endsWith('.js')).forEach((routineFile) => {
  const routine = require(`./routines/${routineFile}`);
  setInterval(routine, 3600000);
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

// Run channelDelete events through their listeners
client.on(Events.ChannelDelete, async(channel) => {
  client.channelDeletedListeners.forEach((listener) => listener(client, channel));
});

// Run the voice states through the listeners
client.on(Events.VoiceStateUpdate, async(oldState, newState) => {
  oldState.member = await cachePartial(oldState.member);
  newState.member = await cachePartial(newState.member);
  client.voiceStateListeners.forEach((listener) => listener(client, oldState, newState));
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
