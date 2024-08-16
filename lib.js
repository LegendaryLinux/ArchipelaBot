const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  cachePartial: (partial) => new Promise((resolve, reject) => {
    if (!partial.hasOwnProperty('partial') || !partial.partial) { resolve(partial); }
    partial.fetch()
      .then((full) => resolve(full))
      .catch((error) => reject(error));
  }),

  verifyIsAdmin: (guildMember) => {
    if (!guildMember) { return false; }
    return guildMember.permissions.has(PermissionFlagsBits.Administrator);
  },
};
