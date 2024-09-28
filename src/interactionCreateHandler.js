const { helpCommand } = require('./helpCommand');

async function onInteractionCreate(interaction, conversationManager, commandHandler, errorHandler) {
  if (interaction.type !== 2) return; // Check if it's an APPLICATION_COMMAND

  const { name, options } = interaction.data;

  try {
    let response;
    switch (name) {
      case 'help':
        response = helpCommand();
        break;
      case 'clear':
        response = await commandHandler.clearCommand(interaction, conversationManager);
        break;
      case 'save':
        response = await commandHandler.saveCommand(interaction, conversationManager);
        break;
      case 'model':
        response = await commandHandler.modelCommand(interaction, conversationManager);
        break;
      case 'prompt':
        response = await commandHandler.promptCommand(interaction, conversationManager);
        break;
      case 'reset':
        response = await commandHandler.resetCommand(interaction, conversationManager);
        break;
      case 'settings':
        response = await commandHandler.settingsCommand(interaction, conversationManager);
        break;
      default:
        response = {
          type: 4,
          data: { content: 'Unknown command.', flags: 64 }
        };
    }
    return response;
  } catch (error) {
    console.error('Error in command execution:', error);
    await errorHandler.handleError(error, interaction);
    return {
      type: 4,
      data: { content: 'An error occurred while processing the command.', flags: 64 }
    };
  }
}

module.exports = { onInteractionCreate };