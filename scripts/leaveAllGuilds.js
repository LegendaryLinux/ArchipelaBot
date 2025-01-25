const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('../config.json');

const whitelist = [
  '731205301247803413',  // Archipelago
  '1085716850370957462', // AP After Dark
  '1075579679903318046', // AginahBot
];

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

    if (!whitelist.includes(guild.id.toString())) {
      console.log(`Leaving ${guild.name}.`);
      await guild.leave();
    }
  }

  return client.destroy();
});
