const axios = require('axios');
const request = require('request');
const FormData = require('form-data');
const tmp = require('tmp');
const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');

const API_ENDPOINT = 'https://archipelago.gg/api/generate';

module.exports = {
  category: 'Game Generator',
  commands: [
    {
      commandBuilder: new SlashCommandBuilder()
        .setName('ap-generate')
        .setDescription('Generate a game based on an uploaded file.')
        .setDMPermission(true)
        .addAttachmentOption((opt) => opt
          .setName('config-file')
          .setDescription('Archipelago config file')
          .setRequired(true))
        .addBooleanOption((opt) => opt
          .setName('race-mode')
          .setDescription('If true, a spoiler will not be generated')
          .setRequired(false)),
      async execute(interaction) {
        const configFile = interaction.options.getAttachment('config-file');
        const raceMode = interaction.options.getBoolean('race-mode') ?? false;

        // Handle requests to generate a game from a file
        let race = raceMode ? '1' : '0';
        let hintCost = '10';
        let forfeitMode = 'auto';
        let remainingMode = 'disabled';
        let collectMode = raceMode ? 'disabled' : 'goal';

        const postfix = '.' + configFile.name.split('.').reverse()[0];
        const tempFile = tmp.fileSync({ prefix: 'upload-', postfix });
        return request.get(configFile.url)
          .pipe(fs.createWriteStream(tempFile.name))
          .on('close', () => {
            // Send request to api
            const formData = new FormData();
            formData.append('file', fs.createReadStream(tempFile.name), tempFile.name);
            formData.append('hint_cost', hintCost);
            formData.append('forfeit_mode', forfeitMode);
            formData.append('remaining_mode', remainingMode);
            formData.append('collect_mode', collectMode);
            formData.append('race', race);
            const axiosOpts = { headers: formData.getHeaders() };
            axios.post(API_ENDPOINT, formData, axiosOpts)
              .then((apResponse) => {
                interaction.reply('Seed generation underway. When it\'s ready, you will be ' +
                                    `able to download your patch file from:\n${apResponse.data.url}`);
                tempFile.removeCallback();
              }).catch((error) => {
                interaction.reply('I couldn\'t generate that game, sorry.');
                if(error.isAxiosError && error.response && error.response.data){
                  console.error(`Unable to generate game on ${API_ENDPOINT}. The following ` +
                                      'data was returned from the endpoint:');
                  return console.error(error.response.data);
                }

                return console.error(error);
              });
          });
      }
    },
  ],
};