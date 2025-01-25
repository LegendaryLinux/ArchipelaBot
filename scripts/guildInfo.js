const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('../config.json');

console.debug('Logging into Discord...');
const client = new Client({
  partials: [ Partials.GuildMember, Partials.Message, Partials.Channel ],
  intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates],
});
client.login(config.token).then(async () => {
  console.debug('Connected.');
  console.debug(`This bot has been installed in ${client.guilds.cache.size} guilds.\n`);
  for (let guild of Array.from(client.guilds.cache.values())){
    await guild.fetch();
    console.log(`${guild.name} (${guild.id})`);
    console.log(`Members: ${guild.memberCount}\n`);
  }

  return client.destroy();
});
