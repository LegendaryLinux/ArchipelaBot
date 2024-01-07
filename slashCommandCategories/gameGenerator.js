const axios = require('axios');
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
          .setDescription('Archipelago yaml, json, or zip file')
          .setRequired(true))
        .addStringOption((opt) => opt
          .setName('mode')
          .setDescription('Generate this game normally, or with race or tournament presets')
          .setRequired(false)
          .addChoices(
            { name: 'Normal', value: 'normal' },
            { name: 'Race', value: 'race' },
            { name: 'Tournament', value: 'tournament' },
          )),
      async execute(interaction) {
        await interaction.deferReply();
        const configFile = interaction.options.getAttachment('config-file');
        const mode = interaction.options.getString('mode', false) ?? 'normal';

        // Default settings
        let race = '0';
        let hintCost = '10';
        let forfeitMode = 'auto';
        let remainingMode = 'disabled';
        let collectMode = 'goal';

        switch(mode){
          case 'race':
            race = '1';
            collectMode = 'disabled';
            break;

          case 'tournament':
            race = '1';
            hintCost = '101';
            forfeitMode = 'disabled';
            remainingMode = 'disabled';
            collectMode = 'disabled';
            break;
        }

        const postfix = '.' + configFile.name.split('.').reverse()[0];
        const tempFile = tmp.fileSync({ prefix: 'upload-', postfix });
        const response = await axios.get(configFile.url, { responseType: 'stream' });
        return response.data.pipe(fs.createWriteStream(tempFile.name))
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
              .then(async (apResponse) => {
                await interaction.followUp('Seed generation underway. When it\'s ready, you will be ' +
                                    `able to download your patch file from:\n${apResponse.data.url}`);
                tempFile.removeCallback();
              }).catch(async (error) => {
                let responseText = 'The Archipelago API was unable to generate your game.';
                if(error.isAxiosError && error.response && error.response.data){
                  responseText += `\nThe following data was returned from the endpoint (${API_ENDPOINT}):` +
                    `\n\`\`\`${JSON.stringify(error.response.data)}\`\`\``;
                  console.error(`Unable to generate game on ${API_ENDPOINT}. The following ` +
                    `data was returned from the endpoint:\n${JSON.stringify(error.response.data)}`);
                  console.error(error.response.data);
                }
                await interaction.followUp({ content: responseText });
                return console.error(error);
              });
          });
      }
    },
  ],
};