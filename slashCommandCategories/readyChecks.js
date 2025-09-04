const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, InteractionContextType } = require('discord.js');
const { dbExecute, dbQueryOne, dbQueryAll } = require('../database');
const { verifyIsAdmin } = require('../lib');

module.exports = {
  category: 'Ready System',
  commands: [
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ready-create')
        .setDescription('Create a ready system in this channel.')
        .setContexts(InteractionContextType.Guild),
      async execute(interaction) {
        // Determine if a game is already running in this channel
        let sql = 'SELECT 1 FROM readySystems WHERE guildId=? AND channelId=?';
        const existingGame = await dbQueryOne(sql, [interaction.guild.id, interaction.channel.id]);
        if (existingGame) {
          return interaction.reply({
            content: 'A ready system has already been created in this channel.',
            flags: MessageFlags.Ephemeral,
          });
        }

        // Create the game in this channel
        await dbQueryOne(
          'INSERT INTO readySystems (guildId, channelId, userId) VALUES (?, ?, ?)',
          [interaction.guild.id, interaction.channel.id, interaction.user.id],
        );
        return interaction.reply({
          content: 'A ready system has created in this channel.\n' +
            '- `/ready-join` to join the game\n' +
            '- `/ready` to indicate you are ready to begin\n' +
            '- `/unready` to indicate you are no longer ready to begin\n' +
            '- `/ready-cancel` to delete the ready system'
        });
      }
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ready-join')
        .setDescription('Join a ready system in this channel.')
        .setContexts(InteractionContextType.Guild),
      async execute(interaction) {
        // Find ready system for this channel
        const readySystem = await dbQueryOne(
          'SELECT id FROM readySystems WHERE guildId=? AND channelId=?',
          [interaction.guild.id, interaction.channel.id],
        );

        // Inform the user if there is no ready system
        if (!readySystem) {
          return interaction.reply({
            content: 'A ready system has not been created in this channel.',
            flags: MessageFlags.Ephemeral,
          });
        }

        // Add the user to the ready system
        await dbExecute(
          'REPLACE INTO readyChecks (readySystemId, userId) VALUES (?,?)',
          [readySystem.id, interaction.user.id],
        );

        return interaction.reply({
          content: `${interaction.user} has joined the game.`,
        });
      }
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ready-leave')
        .setDescription('Leave a ready system in this channel.')
        .setContexts(InteractionContextType.Guild),
      async execute(interaction) {
        // Find ready system for this channel
        const readySystem = await dbQueryOne(
          'SELECT id FROM readySystems WHERE guildId=? AND channelId=?',
          [interaction.guild.id, interaction.channel.id],
        );

        // Inform the user if there is no ready system
        if (!readySystem) {
          return interaction.reply({
            content: 'A ready system has not been created in this channel.',
            flags: MessageFlags.Ephemeral,
          });
        }

        // Remove the user from the ready system
        await dbExecute(
          'DELETE FROM readyChecks WHERE readySystemId=? AND userId=?',
          [readySystem.id, interaction.user.id],
        );

        return interaction.reply({
          content: `${interaction.user} has left the game.`,
        });
      }
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ready')
        .setDescription('Indicate you are ready to begin.')
        .setContexts(InteractionContextType.Guild),
      async execute(interaction) {
        // Find ready system for this channel
        const readySystem = await dbQueryOne(
          'SELECT id FROM readySystems WHERE guildId=? AND channelId=?',
          [interaction.guild.id, interaction.channel.id],
        );

        // Inform the user if there is no ready system
        if (!readySystem) {
          return interaction.reply({
            content: 'A ready system has not been created in this channel.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const isJoined = await dbQueryOne(
          'SELECT 1 FROM readyChecks WHERE readySystemId=? AND userId=?',
          [readySystem.id, interaction.user.id],
        );

        if (!isJoined) {
          await dbExecute(
            'REPLACE INTO readyChecks (readySystemId, userId, isReady) VALUES (?, ?, 1)',
            [readySystem.id, interaction.user.id]
          );
        }

        await dbExecute(
          'UPDATE readyChecks SET isReady=1 WHERE readySystemId=? AND userId=?',
          [readySystem.id, interaction.member.id],
        );

        await interaction.reply({
          content: `${interaction.member} is ready to begin.`
        });

        const unreadyPlayers = await dbQueryOne(
          'SELECT 1 FROM readyChecks WHERE readySystemId=? AND NOT isReady',
          [readySystem.id],
        );

        if (!unreadyPlayers) {
          return interaction.followUp('All players are ready to begin!');
        }
      }
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('unready')
        .setDescription('Indicate you are no longer ready to begin.')
        .setContexts(InteractionContextType.Guild),
      async execute(interaction) {
        // Find ready system for this channel
        const readySystem = await dbQueryOne(
          'SELECT id FROM readySystems WHERE guildId=? AND channelId=?',
          [interaction.guild.id, interaction.channel.id],
        );

        // Inform the user if there is no ready system
        if (!readySystem) {
          return interaction.reply({
            content: 'A ready system has not been created in this channel.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const isJoined = await dbQueryOne(
          'SELECT 1 FROM readyChecks WHERE readySystemId=? AND userId=?',
          [readySystem.id, interaction.user.id],
        );

        if (!isJoined) {
          return interaction.reply({
            content: 'You have not joined the ready system.',
            flags: MessageFlags.Ephemeral,
          });
        }

        await dbExecute(
          'UPDATE readyChecks SET isReady=0 WHERE readySystemId=? AND userId=?',
          [readySystem.id, interaction.member.id],
        );

        return interaction.reply({
          content: `${interaction.member} is no longer ready to begin.`
        });
      }
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ready-cancel')
        .setDescription('Cancel the ready system in this channel if one is present.')
        .setContexts(InteractionContextType.Guild),
      async execute(interaction) {
        // Find ready system for this channel
        const readySystem = await dbQueryOne(
          'SELECT id, userId FROM readySystems WHERE guildId=? AND channelId=?',
          [interaction.guild.id, interaction.channel.id],
        );

        // Inform the user if there is no ready system
        if (!readySystem) {
          return interaction.reply({
            content: 'A ready system has not been created in this channel.',
            flags: MessageFlags.Ephemeral,
          });
        }

        // Disallow anyone except the one who started the game from cancelling it
        if (
          !verifyIsAdmin(interaction.member) &&
          !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) &&
          !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) &&
          !interaction.user.id !== readySystem.userId
        ) {
          return interaction.reply({
            content: `Only <@${readySystem.userId}> or an otherwise privileged user may cancel the game.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        await dbExecute('DELETE FROM readyChecks WHERE readySystemId=?', readySystem.id);
        await dbExecute('DELETE FROM readySystems WHERE id=?', [readySystem.id]);

        return interaction.reply({
          content: `${interaction.user} has cancelled the ready system.`,
        });
      }
    },
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ready-check')
        .setDescription('Cancel the ready system in this channel if one is present.')
        .setContexts(InteractionContextType.Guild),
      async execute(interaction) {
        // Find ready system for this channel
        const readySystem = await dbQueryOne(
          'SELECT id FROM readySystems WHERE guildId=? AND channelId=?',
          [interaction.guild.id, interaction.channel.id],
        );

        // Inform the user if there is no ready system
        if (!readySystem) {
          return interaction.reply({
            content: 'A ready system has not been created in this channel.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const players = await dbQueryAll(
          'SELECT userId, isReady FROM readyChecks WHERE readySystemId=?',
          [readySystem.id],
        );

        if (!players) {
          return interaction.reply({
            content: 'No players have joined the ready system.',
            flags: MessageFlags.Ephemeral,
          });
        }

        let content = '## Players:';
        players.forEach((p) => content += `\n- ${p.isReady ? '✅' : '❌'} <@${p.userId}>`);

        return interaction.reply({
          content,
          allowedMentions: {},
        });
      }
    },
  ],
};