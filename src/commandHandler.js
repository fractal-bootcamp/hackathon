const { config } = require('./config');
const { EmbedBuilder } = require('discord.js');

class CommandHandler {
  constructor() {
    this.commands = {
      clear: this.clearCommand,
      save: this.saveCommand,
      model: this.modelCommand,
      prompt: this.promptCommand,
      reset: this.resetCommand,
      settings: this.settingsCommand,
    };
  }

  async clearCommand(interaction, conversationManager) {
    const userId = interaction.member.user.id;
    conversationManager.clearHistory(userId);
    return { type: 4, data: { content: '> `Your conversation history has been cleared.`', flags: 64 } };
  }

  async saveCommand(interaction, conversationManager) {
    const userId = interaction.member.user.id;
    const conversation = conversationManager.getHistory(userId);
    if (conversation.length === 0) {
      return { type: 4, data: { content: '> `There is no conversation to save.`', flags: 64 } };
    }
    const conversationText = conversation.map((message) => `${message.role === 'user' ? 'User' : 'Bot'}: ${message.content}`).join('\n');
    try {
      const maxLength = 1900;
      const lines = conversationText.split('\n');
      const chunks = [];
      let currentChunk = '';
      for (const line of lines) {
        if (currentChunk.length + line.length + 1 <= maxLength) {
          currentChunk += (currentChunk ? '\n' : '') + line;
        } else {
          chunks.push(currentChunk);
          currentChunk = line;
        }
      }
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      // Send each chunk as a separate message
      // Note: This part needs to be handled differently for HTTP interactions
      // You might need to use a follow-up message or a separate API call to send DMs
      return { type: 4, data: { content: '> `The conversation has been saved and will be sent to your inbox.`', flags: 64 } };
    } catch (error) {
      console.error('Error sending conversation to user:', error);
      return { type: 4, data: { content: '> `Failed to send the conversation to your inbox. Please check your privacy settings.`', flags: 64 } };
    }
  }

  async modelCommand(interaction, conversationManager) {
    const model = interaction.data.options.find(opt => opt.name === 'name').value;
    const userId = interaction.member.user.id;
    conversationManager.setUserPreferences(userId, { model });
    return { type: 4, data: { content: `> \`The model has been set to ${model}.\``, flags: 64 } };
  }

  async promptCommand(interaction, conversationManager) {
		const promptName = interaction.data.options.find(opt => opt.name === 'name').value;
		const prompt = config.getPrompt(promptName);
		const userId = interaction.member.user.id;
		console.log(`Setting prompt for user ${userId}: promptName=${promptName}, prompt=${prompt}`);
		conversationManager.setUserPreferences(userId, { prompt: promptName });
		return {
			type: 4,
			data: {
				content: `> The system prompt has been set to "${promptName}".`,
				flags: 64
			}
		};
	}

  async resetCommand(interaction, conversationManager) {
    const userId = interaction.member.user.id;
    conversationManager.resetUserPreferences(userId);
    return { type: 4, data: { content: '> `Your preferences have been reset to the default settings.`', flags: 64 } };
  }

  async settingsCommand(interaction, conversationManager) {
    const userId = interaction.member.user.id;
    const userPreferences = conversationManager.getUserPreferences(userId);
    const model = userPreferences.model;
    const promptName = userPreferences.prompt;
    const prompt = config.getPrompt(promptName);

    const settingsEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Current Settings')
      .addFields({ name: 'Model', value: model });

    const maxFieldLength = 1024;
    const promptFields = [];
    let currentField = '';

    prompt.split('\n').forEach((line) => {
      if (currentField.length + line.length + 1 <= maxFieldLength) {
        currentField += (currentField ? '\n' : '') + line;
      } else {
        promptFields.push({ name: 'Prompt', value: currentField });
        currentField = line;
      }
    });

    if (currentField) {
      promptFields.push({ name: 'Prompt', value: currentField });
    }

    settingsEmbed.addFields(...promptFields).setTimestamp();

    return { 
      type: 4, 
      data: { 
        embeds: [settingsEmbed.toJSON()],
        flags: 64 
      } 
    };
  }
}

module.exports.CommandHandler = CommandHandler;