# ArchipelaBot
A Discord bot designed to provide Archipelago-specific functionality.
Find it in use at the [Archipelago Discord](https://discord.gg/B5pjMYy).

Install it to your server by clicking here:  
[Install ArchipelaBot on your server!](https://discord.com/oauth2/authorize?client_id=1075564303610023967&scope=bot&permissions=274878032960)

## Current Features
- Automatically delete ROM files, and compressed files containing them
- Generate single-player or multiplayer games using the `generate` command
- Connect to a running Archipelago server as a spectator and print messages to a Discord channel

## Supported Games
All games supported by the Multiworld Multi-Game Randomizer
[Archipelago](https://github.com/ArchipelagoMW/Archipelago)
are compatible and have full MultiWorld compatibility with each other.

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
