# ArchipelaBot
A Discord bot designed to provide Archipelago-specific functionality.
Find it in use at the [Archipelago Discord](https://discord.gg/B5pjMYy).

## Current Features
- Automatically delete ROM files
- Generate single-player or multiplayer games using the `generate` command

# Self-Hosting

## Prerequisites
- `node` and `npm` should be installed to run the bot and install dependencies

## Configuration
A `config.json` file is required to be present in the base directory of the repository. This file should contain
your Discord bot's secret key and SQLite filename. This file may be named `:memory:` to keep the database in memory,
which is recommended for production environments.

Example config:
```json
{
  "token": "discord-bot-token",
  "clientId": "application-client-id",
  "sqliteFile": ":memory:"
}
```

If you intend to create your own bot on Discord using the code in this repository, your bot will need
permissions granted by the permissions integer `274878032960`.

The following permissions will be granted
to ArchipelaBot:
- View Channels
- Send Messages
- Send Messages in Threads
- Manage Messages
- Embed Links
- Attach Files
- Add Reactions
- Read Message History

## Setup
```shell script
# Clone the repo
git clone https://github.com/LegendaryLinux/ArchipelaBot

# Enter its directory
cd ArchipelaBot

# Install required packages
npm install

# Set up your config.json file
vim config.json

# Register application (slash) commands
node scripts/registerSlashCommands.js

# Run the bot
node bot.js
```
