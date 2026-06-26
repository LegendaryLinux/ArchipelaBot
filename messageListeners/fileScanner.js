const {generalErrorHandler} = require('../errorHandlers');
const romFileExtensions = require('../romFileExtensions');
const {PermissionsBitField} = require('discord.js');

const isRomFile = (filename) => {
  const fileExtension = filename.split('.').pop().toLowerCase();
  return romFileExtensions.includes(fileExtension);
};

const roleData = {
  roles: null,
  lastUpdate: 0,
};
const channelData = {
  channels: null,
  lastUpdate: 0,
};

module.exports = async (client, message) => {
  try{
    if (!message.channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.ManageMessages)) {
      console.warn(`ManageMessages permission is missing in guild ${message.guild.name} (${message.guild.id}) / ` +
          `channel ${message.channel.name} (${message.channel.id}).`);
      return;
    }

    if (!roleData.roles || roleData.lastUpdate < (new Date().getTime() - 450000)) {
      roleData.roles = await message.guild.roles.fetch();
      roleData.lastUpdate = new Date().getTime();
    }
    const moderatorRole = roleData.roles.find((r) => r.name === 'Moderator');

    if (!channelData.channels || channelData.lastUpdate < (new Date().getTime() - 450000)) {
      channelData.channels = await message.guild.channels.fetch();
      channelData.lastUpdate = new Date().getTime();
    }
    const modChannel = channelData.channels.find((c) => c.name === 'mod-zone-chat');

    const romFileNames = [];
    message.attachments.each((attachment) => {
      // Disallow direct posting of ROM files
      if (isRomFile(attachment.name)) {
        romFileNames.push(attachment.name);
      }
    });

    if (romFileNames.length > 0) {
      await message.channel.send({
        content: `${message.author}: Do not post links to ROM files or other copyrighted content.\n` +
          `The ${moderatorRole} team has been alerted to this incident.\n` +
          `The potentially problematic file(s) in question were:\n- ${romFileNames.join('\n- ')}`
      });

      await message.delete();

      await modChannel.send({
        content: `${moderatorRole}: ${message.author} has just posted a potentially pirated file ` +
          `in ${message.channel}.\n**Problem files:**\n- ${romFileNames.join('\n- ')}`
      });
    }
  } catch (error) {
    generalErrorHandler(error);
  }
};