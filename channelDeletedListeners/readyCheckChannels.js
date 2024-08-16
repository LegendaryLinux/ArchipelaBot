const { Client, GuildChannel } = require('discord.js');
const { dbQueryOne, dbExecute } = require('../database');

/**
 * If a channel is deleted and a ready system was in effect in that channel, delete the ready system
 * @param {Client} client
 * @param {GuildChannel} channel
 * @returns {Promise<void>}
 */
module.exports = async (client, channel) => {
  const readySystem = await dbQueryOne('SELECT id FROM readySystems WHERE channelId=?', [channel.id]);
  if (readySystem) {
    await dbExecute('DELETE FROM readyChecks WHERE readySystemId=?', [readySystem.id]);
    await dbExecute('DELETE FROM readySystems WHERE id=?', [readySystem.id]);
  }
};