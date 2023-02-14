const { Client, GuildChannel } = require('discord.js');
/**
 * If a channel is deleted and there was an ArchipelagoInterface attached to it, disconnect and delete that interface
 * @param {Client} client
 * @param {GuildChannel} channel
 * @returns {Promise<void>}
 */
module.exports = async (client, channel) => {
  if (client.tempData.apInterfaces.has(channel.id)) {
    client.tempData.apInterfaces.get(channel.id).disconnect();
    client.tempData.apInterfaces.delete(channel.id);
  }
};