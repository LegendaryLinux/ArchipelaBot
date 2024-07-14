# ArchipelaBot
A Discord bot designed to provide Archipelago-specific functionality.

## Current Features
- Connect to a running Archipelago server as a spectator and print messages to a Discord channel
- Messages use colored text where different items types get different colors
- Works for sync & async games

# Self-Hosting

## Prerequisites
- `node` and `npm` should be installed to run the bot and install dependencies

## Configuration
A `config.json` file is required to be present in the base directory of the repository. This file should contain
your Discord bot's secret key.

Optionally, you can provide server connection info that will be used if not provided through the Discord 
ap-conenct command arguments.

Example config:
```json
{
  "token": "discord-bot-token",
  "clientId": "application-client-id",

  // Can be used to specify AP server info so you don't have to provide arguments to the ap-connect command.
  "serverAddress": "127.0.0.1",
  "port": "12345",
  "slotName": "slotname",
  "password": "secret"
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
git clone https://github.com/evilwb/ArchipelaBot.git

# Enter its directory
cd ArchipelaBot

# Install required packages
npm install

# Set up your config.json file
vim config.json

# Run the bot
node bot.js
```
