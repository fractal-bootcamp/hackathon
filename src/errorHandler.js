require('dotenv').config();
const { WebhookClient } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { config } = require('./config');

class ErrorHandler {
  constructor() {
    this.errorNotificationThrottle = {
      window: 60 * 1000, // 1 minute
      maxNotifications: 5, // Maximum notifications allowed within the window
      recentNotifications: [], // Array to store recent notification timestamps
    };
  }

  async handleError(error, interaction) {
    console.error('Error processing the interaction:', error);
    if (interaction.commandName === 'testerror') {
      if (error.message === 'This is a test error triggered by the /testerror command.') {
        await interaction.editReply({
          content: 'Test error triggered successfully. Check the error notification channel for details.',
          ephemeral: true,
        });
      } else {
        await interaction.editReply({
          content: 'An unexpected error occurred while processing the /testerror command.',
          ephemeral: true,
        });
      }
    } else {
      await interaction.reply({
        content: 'Sorry, something went wrong! Our team has been notified and will look into the issue.',
        ephemeral: true,
      });
    }

    const errorDetails = this.getErrorDetails(error, interaction);
    console.error('Error details:', errorDetails);
    await this.sendErrorNotification(errorDetails);
    this.logErrorToFile(errorDetails);
  }

  async handleInteractionError(error, applicationId, interactionToken) {
    console.error('Error handling interaction:', error);
    const errorDetails = this.getErrorDetails(error, { applicationId, interactionToken });
    await this.sendErrorNotification(errorDetails);
    this.logErrorToFile(errorDetails);
    await this.sendFollowUpMessage(applicationId, interactionToken, {
      content: "An error occurred while processing your command."
    });
  }

  async handleModelResponseError(error, botMessage, originalMessage) {
    console.error(error.message);
    const userId = originalMessage.author.id;
    const errorMessages = config.messages.handleModelResponseError;

    let errorMessage;
    if (error.status && errorMessages[error.status]) {
      errorMessage = errorMessages[error.status].replace('{userId}', userId);
    } else {
      errorMessage = errorMessages.default.replace('{userId}', userId);
    }

    await botMessage.edit(errorMessage);

    const errorDetails = this.getErrorDetails(error, originalMessage);
    await this.sendErrorNotification(errorDetails);
    this.logErrorToFile(errorDetails);
  }

  handleUnhandledRejection(error) {
    console.error('Unhandled Rejection:', error);
    const errorDetails = this.getErrorDetails(error);
    this.sendErrorNotification(errorDetails);
    this.logErrorToFile(errorDetails);
  }

  handleUncaughtException(error) {
    console.error('Uncaught Exception:', error);
    const errorDetails = this.getErrorDetails(error);
    this.sendErrorNotification(errorDetails);
    this.logErrorToFile(errorDetails);
    process.exit(1);
  }

  getErrorDetails(error, context = {}) {
    return {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }),
      environment: process.env.NODE_ENV,
      ...context,
    };
  }

  logErrorToFile(errorDetails) {
    const logDirectory = path.join(__dirname, 'logs');
    const logFileName = `error-${new Date().toISOString().replace(/:/g, '-')}.log`;
    const logFilePath = path.join(logDirectory, logFileName);

    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory);
    }

    const logMessage = `${JSON.stringify(errorDetails, null, 2)}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Failed to log error to file:', err);
      }
    });
  }

  async sendErrorNotification(errorDetails) {
    const webhookUrl = process.env.ERROR_NOTIFICATION_WEBHOOK;
    if (!webhookUrl) {
      console.warn('ERROR_NOTIFICATION_WEBHOOK not set. Skipping error notification via Discord webhook.');
      return;
    }

    const currentTime = Date.now();
    const { window, maxNotifications, recentNotifications } = this.errorNotificationThrottle;

    this.errorNotificationThrottle.recentNotifications = recentNotifications.filter(
      (timestamp) => currentTime - timestamp <= window
    );

    if (recentNotifications.length >= maxNotifications) {
      console.warn('Error notification throttled due to high volume.');
      return;
    }

    const webhookClient = new WebhookClient({ url: webhookUrl });
    const errorMessage = `An error occurred:\n\`\`\`json\n${JSON.stringify(errorDetails, null, 2)}\n\`\`\``;
    try {
      await webhookClient.send({
        content: errorMessage,
        username: 'Error Notification',
      });
      console.log('Error notification sent via Discord webhook.');
      this.errorNotificationThrottle.recentNotifications.push(currentTime);
    } catch (err) {
      console.error('Failed to send error notification via Discord webhook:', err);
    }
  }

  async sendFollowUpMessage(applicationId, interactionToken, message) {
    try {
      const url = `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}`;
      await axios.post(url, message);
    } catch (error) {
      console.error('Error sending follow-up message:', error);
    }
  }
}

module.exports = { ErrorHandler };