# ArchipelaBot
A Discord bot designed to provide Archipelago-specific functionality.
Find it in use at the [Archipelago Discord](https://discord.gg/B5pjMYy).

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
your Discord bot's secret key.

Example config:
```json
{
  "token": "discord-bot-token"
}
```

If you intend to create your own bot on Discord using the code in this repository, your bot will need
permissions granted by the permissions integer `277025508416`.

The following permissions will be granted
to ArchipelaBot:
- View Channels
- Send Messages
- Send Messages in Threads
- Embed Links
- Attach Files
- Add Reactions
- Read Message History
- Use Application Commands

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

# Run the bot
node bot.js
```
