const ArchipelagoInterface = require('../Archipelago/ArchipelagoInterface');
const { SlashCommandBuilder } = require('discord.js');

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
          .setDescription('Server address and port (ex. archipelago.gg:12345) of the Archipelago server to connect to')
          .setRequired(true))
        .addStringOption((opt) => opt
          .setName('game-name')
          .setDescription('Name of the game to connect as a client of')
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
        await interaction.deferReply();
        const serverAddress = interaction.options.getString('server-address');
        const gameName = interaction.options.getString('game-name');
        const slotName = interaction.options.getString('slot-name');
        const password = interaction.options.getString('password', false) ?? null;

        if (interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.followUp({
            content: 'An Archipelago game is already being monitored in this channel ' +
              'and must be disconnected before a new game can be monitored.',
            ephemeral: true,
          });
        }

        // Establish a connection to the Archipelago game
        const APInterface = new ArchipelagoInterface(interaction.channel, serverAddress, gameName, slotName, password);

        // Check if the connection was successful every half second for ten seconds
        for (let i=0; i<20; ++i){
          // Wait half of a second
          await new Promise((resolve) => (setTimeout(resolve, 500)));

          // If the client fails to connect, its status will eventually read disconnected
          if (APInterface.APClient.status === 'Disconnected') {
            return interaction.followUp({
              content: `Unable to connect to AP server at ${serverAddress}.`,
              ephemeral: true,
            });
          }

          if (APInterface.APClient.status === 'Connected') {
            interaction.client.tempData.apInterfaces.set(interaction.channel.id, APInterface);
            await interaction.followUp(`Connected to ${serverAddress} using game ${gameName} with slot ${slotName}.`);

            // Automatically disconnect and destroy this interface after six hours
            return setTimeout(() => {
              if (interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
                interaction.client.tempData.apInterfaces.get(interaction.channel.id).disconnect();
                interaction.client.tempData.apInterfaces.delete(interaction.channel.id);
              }
            }, 21600000);
          }
        }
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-disconnect')
        .setDescription('Stop monitoring an Archipelago game in the current text channel')
        .setDMPermission(false),
      async execute(interaction) {
        await interaction.deferReply();

        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.followUp({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Disconnect the ArchipelagoInterface from the game and destroy the object in tempData
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).disconnect();
        interaction.client.tempData.apInterfaces.delete(interaction.channel.id);
        return interaction.followUp('Disconnected from Archipelago game.');
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
        await interaction.deferReply();
        const alias = interaction.options.getString('alias');

        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.followUp({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Associate the user with the specified alias
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).setPlayer(alias, interaction.user);
        return interaction.followUp(`Associated ${interaction.user} with alias ${alias}.`);
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
        await interaction.deferReply();
        const alias = interaction.options.getString('alias');

        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.followUp({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Disassociate the user from the specified alias
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).unsetPlayer(alias);
        return interaction.followUp(`User ${interaction.user} disassociated from ${alias}.`);
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-show-chat')
        .setDescription('Show normal messages while connected to an AP game')
        .setDMPermission(false),
      async execute(interaction) {
        await interaction.deferReply();
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.followUp({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Set the APInterface to show chat messages
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showChat = true;
        return interaction.followUp('Showing normal chat messages.');
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-hide-chat')
        .setDescription('Hide normal messages while connected to an AP game')
        .setDMPermission(false),
      async execute(interaction) {
        await interaction.deferReply();
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.followUp({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Set the APInterface to show chat messages
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showChat = false;
        return interaction.followUp('Hiding normal chat messages.');
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-show-hints')
        .setDescription('Show hint messages while connected to an AP game')
        .setDMPermission(false),
      async execute(interaction) {
        await interaction.deferReply();
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.followUp({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Set the APInterface to show chat messages
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showHints = true;
        return interaction.followUp('Showing hints.');
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-hide-hints')
        .setDescription('Hide hint messages while connected to an AP game')
        .setDMPermission(false),
      async execute(interaction) {
        await interaction.deferReply();
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.followUp({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Set the APInterface to show chat messages
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showHints = false;
        return interaction.followUp('Hiding hints.');
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-show-progression')
        .setDescription('Show progression item messages while connected to an AP game. Hides other item messages')
        .setDMPermission(false),
      async execute(interaction) {
        await interaction.deferReply();
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.followUp({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Set the APInterface to show chat messages
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showItems = false;
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showProgression = true;
        return interaction.followUp('Showing progression.');
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-show-items')
        .setDescription('Show all item messages while connected to an AP game')
        .setDMPermission(false),
      async execute(interaction) {
        await interaction.deferReply();
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.followUp({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Set the APInterface to show chat messages
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showItems = true;
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showProgression = true;
        return interaction.followUp('Showing all item messages.');
      },
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-hide-items')
        .setDescription('Hide all item messages while connected to an AP game')
        .setDMPermission(false),
      async execute(interaction) {
        await interaction.deferReply();
        // Notify the user if there is no game being monitored in the current text channel
        if (!interaction.client.tempData.apInterfaces.has(interaction.channel.id)) {
          return interaction.followUp({
            content: 'There is no Archipelago game being monitored in this channel.',
            ephemeral: true,
          });
        }

        // Set the APInterface to show chat messages
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showItems = false;
        interaction.client.tempData.apInterfaces.get(interaction.channel.id).showProgression = false;
        return interaction.followUp('Hiding all item messages.');
      },
    },
  ],
};
