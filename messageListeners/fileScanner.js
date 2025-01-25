const {generalErrorHandler} = require('../errorHandlers');
const romFileExtensions = require('../romFileExtensions');

const isRomFile = (filename) => {
  const parts = filename.split('.');
  for (const part of parts) {
    // Rom extension is present in filename
    if (romFileExtensions.indexOf(part) !== -1) { return true; }
  }
  // Doesn't look like a ROM file
  return false;
};

module.exports = async (client, message) => {
  try{
    const roles = await message.guild.roles.fetch();
    const moderatorRole = roles.find((r) => r.name === 'Moderator');

    const channels = await message.guild.channels.fetch();
    const modChannel = channels.find((c) => c.name === 'problem-report-history');

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
          `The ${moderatorRole} team has been alerted to this incident.`
      });

      await modChannel.send({
        content: `${moderatorRole}: ${message.author} has just posted a potentially pirated file ` +
          `in ${message.channel}.\n**Problem files:**\n- ${romFileNames.join('\n- ')}`
      });

      return message.delete();
    }
  } catch (error) {
    message.channel.send('Something went wrong while trying to analyze your file. It has been deleted ' +
      'for safety purposes.');
    message.delete();
    generalErrorHandler(error);
  }
};