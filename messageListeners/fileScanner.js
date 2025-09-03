const {generalErrorHandler} = require('../errorHandlers');
const romFileExtensions = require('../romFileExtensions');

const isRomFile = (filename) => {
  const fileExtension = filename.split('.').pop().toLowerCase();
  return romFileExtensions.includes(fileExtension);
};

module.exports = async (client, message) => {
  try{
    const roles = await message.guild.roles.fetch();
    const moderatorRole = roles.find((r) => r.name === 'Moderator');

    const channels = await message.guild.channels.fetch();
    const modChannel = channels.find((c) => c.name === 'mod-zone-chat');

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

      await modChannel.send({
        content: `${moderatorRole}: ${message.author} has just posted a potentially pirated file ` +
          `in ${message.channel}.\n**Problem files:**\n- ${romFileNames.join('\n- ')}`
      });

      return message.delete();
    }
  } catch (error) {
    generalErrorHandler(error);
  }
};