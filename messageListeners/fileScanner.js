const {generalErrorHandler} = require('../errorHandlers');

const romExtensions = ['sfc', 'smc', 'rom', 'nes', 'z64', 'n64', 'gb', 'gbc', 'gba'];

const isRomFile = (filename) => {
  const parts = filename.split('.');
  for (const part of parts) {
    // Rom extension is present in filename
    if (romExtensions.indexOf(part) !== -1) { return true; }
  }
  // Doesn't look like a ROM file
  return false;
};

module.exports = (client, message) => {
  try{
    return message.attachments.each((attachment) => {
      // Disallow direct posting of ROM files
      if (isRomFile(attachment.name)) {
        message.channel.send(`${message.author}: Do not post links to ROMs or other copyrighted content.`);
        return message.delete();
      }
    });
  } catch (error) {
    message.channel.send('Something went wrong while trying to analyze your file. It has been deleted ' +
      'for safety purposes.');
    message.delete();
    generalErrorHandler(error);
  }
};