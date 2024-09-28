const { EmbedBuilder } = require('discord.js');

function helpCommand() {
  const helpEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Available Commands')
    .setDescription('Here are the available commands and their usage:')
    .addFields(
      { name: '/clear', value: 'Clears the conversation history.' },
      { name: '/save', value: 'Saves the current conversation and sends it to your inbox.' },
      { name: '/model', value: 'Change the model used by the bot. Usage: `/model [model_name]`' },
      { name: '/prompt', value: 'Change the system prompt used by the bot. Usage: `/prompt [prompt_name]`' },
      { name: '/reset', value: 'Reset the model and prompt to the default settings.' },
      { name: '/help', value: 'Displays this help message.' },
      { name: '/settings', value: 'Displays your current model and prompt settings.' },
      {
        name: 'Installation & Activation',
        value: `To install and activate the Discord bot on your server, please DM <@1012984419029622784> on Discord or visit their Twitter profile: https://twitter.com/markllego.`,
      },
    )
    .setTimestamp();

  return {
    type: 4, // InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE
    data: {
      embeds: [helpEmbed.toJSON()],
      flags: 64 // EPHEMERAL flag
    }
  };
}

module.exports = { helpCommand };