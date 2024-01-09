const ArchipelagoInterface = require('../Archipelago/ArchipelagoInterface');
const { SlashCommandBuilder } = require('discord.js');
const { AsciiTable3, AlignmentEnum } = require('ascii-table3');

module.exports = {
  category: 'Archipelago',
  commands: [
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-connect')
        .setDescription('Begin monitoring an Archipelago game in the current text channel')
        .setDMPermission(false)
        .addStringOption((opt) => opt
          .setName('server-address')
          .setDescription('Server address and port (ex. archipelago.gg) of the Archipelago server to connect to')
          .setRequired(true))
        .addNumberOption((opt) => opt
          .setName('port')
          .setDescription('Port number your game is hosted on')
          .setRequired(true))
        .addStringOption((opt) => opt
          .setName('slot-name')
          .setDescription('`name` field in your settings file')
          .setRequired(true))
        .addStringOption((opt) => opt
          .setName('password')
          .setDescription('Optional password required to connect to the server')
          .setRequired(false)),
      async execute(interaction) {
        const serverAddress = interaction.options.getString('server-address');
        const port = interaction.options.getNumber('port');
        const slotName = interaction.options.getString('slot-name');
        const password = interaction.options.getString('password', false) ?? null;

        if (interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.reply({
            content: 'An Archipelago game is already being monitored in this channel ' +
              'and must be disconnected before a new game can be monitored.',
            ephemeral: true,
          });
        }

        // Establish a connection to the Archipelago game
        const APInterface = new ArchipelagoInterface(interaction.channel, serverAddress, port,
          slotName, password);

        // Check if the connection was successful every half second for five seconds
        for (let i=0; i<10; ++i){
          // Wait half of a second
          await new Promise((resolve) => (setTimeout(resolve, 500)));

          if (APInterface.APClient.status === 'Connected') {
            interaction.client.tempData.apInterfaces.set(interaction.channel.id, APInterface);
            await interaction.reply({
              content: `Connected to ${serverAddress} with slot ${slotName}.`,
              ephemeral: false,
            });

            // Automatically disconnect and destroy this interface after six hours
            return setTimeout(() => {
              if (interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
                interaction.client.tempData.apInterfaces.get(interaction.channel.id).disconnect();
                interaction.client.tempData.apInterfaces.delete(interaction.channel.id);
              }
            }, 21600000);
          }
        }

        // If the client fails to connect, notify the user
        return interaction.reply({
          content: `Unable to connect to AP server at ${serverAddress}.`,
          ephemeral: false,
        });
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-disconnect')
        .setDescription('Stop monitoring an Archipelago game in the current text channel')
        .setDMPermission(false),
      async execute(interaction) {
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.reply({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Disconnect the ArchipelagoInterface from the game and destroy the object in tempData
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).disconnect();
        interaction.client.tempData.apInterfaces.delete(interaction.channel.id);
        return interaction.reply('Disconnected from Archipelago game.');
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-set-alias')
        .setDescription('Associate your discord user with a specified alias')
        .addStringOption((opt) => opt
          .setName('alias')
          .setDescription('Your new alias')
          .setRequired(true))
        .setDMPermission(false),
      async execute(interaction) {
        const alias = interaction.options.getString('alias');

        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.reply({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Associate the user with the specified alias
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).setPlayer(alias, interaction.user);
        return interaction.reply(`Associated ${interaction.user} with alias ${alias}.`);
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-unset-alias')
        .setDescription('Disassociate your discord user with a specified alias')
        .addStringOption((opt) => opt
          .setName('alias')
          .setDescription('Alias to disassociate from')
          .setRequired(true))
        .setDMPermission(false),
      async execute(interaction) {
        const alias = interaction.options.getString('alias');

        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.reply({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Determine if the alias has been set
        const apInterface = interaction.client.tempData.apInterfaces.get(interaction.channel.id);
        if (apInterface.players.has(alias)) {
          // Only the user associated with an alias may unset it
          if (apInterface.players.get(alias) !== interaction.user) {
            return interaction.reply('Only the user associated with an alias may unset it.');
          }

          // Disassociate the user from the specified alias
          interaction.client.tempData.apInterfaces.get(interaction.channel.id).unsetPlayer(alias);
          return interaction.reply(`${interaction.user} has been disassociated from ${alias}.`);
        }

        return interaction.reply(`${alias} is not associated with any user.`);
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-list-aliases')
        .setDescription('Display a list of aliases for the game in the current channel')
        .setDMPermission(false),
      async execute(interaction) {
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.reply({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Display the list of aliases for the current channel's game
        const aliases = interaction.client.tempData.apInterfaces.get(interaction.channel.id).players;
        if (aliases.size === 0) {
          return interaction.reply('No aliases are currently assigned.');
        }

        const table = new AsciiTable3()
          .setHeading('Player', 'Alias')
          .addRowMatrix(Array.from(aliases, (alias) => [alias[1].displayName || alias[1].username, alias[0]]))
          .setAlign(1, AlignmentEnum.LEFT)
          .setAlign(2, AlignmentEnum.RIGHT)
          .setStyle('compact');
        return interaction.reply(`\`\`\`${table.toString()}\`\`\``);
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-show-chat')
        .setDescription('Show normal messages while connected to an AP game')
        .setDMPermission(false),
      async execute(interaction) {
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.reply({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Set the APInterface to show chat messages
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showChat = true;
        return interaction.reply('Showing normal chat messages.');
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-hide-chat')
        .setDescription('Hide normal messages while connected to an AP game')
        .setDMPermission(false),
      async execute(interaction) {
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.reply({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Set the APInterface to show chat messages
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showChat = false;
        return interaction.reply('Hiding normal chat messages.');
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-show-hints')
        .setDescription('Show hint messages while connected to an AP game')
        .setDMPermission(false),
      async execute(interaction) {
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.reply({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Set the APInterface to show chat messages
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showHints = true;
        return interaction.reply('Showing hints.');
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-hide-hints')
        .setDescription('Hide hint messages while connected to an AP game')
        .setDMPermission(false),
      async execute(interaction) {
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.reply({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Set the APInterface to show chat messages
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showHints = false;
        return interaction.reply('Hiding hints.');
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-show-progression')
        .setDescription('Show progression item messages while connected to an AP game. Hides other item messages')
        .setDMPermission(false),
      async execute(interaction) {
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.reply({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Set the APInterface to show chat messages
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showItems = false;
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showProgression = true;
        return interaction.reply('Showing progression.');
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-show-items')
        .setDescription('Show all item messages while connected to an AP game')
        .setDMPermission(false),
      async execute(interaction) {
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.reply({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Set the APInterface to show chat messages
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showItems = true;
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showProgression = true;
        return interaction.reply('Showing all item messages.');
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-hide-items')
        .setDescription('Hide all item messages while connected to an AP game')
        .setDMPermission(false),
      async execute(interaction) {
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.reply({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Set the APInterface to show chat messages
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showItems = false;
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showProgression = false;
        return interaction.reply('Hiding all item messages.');
      },
    },
  ],
};
