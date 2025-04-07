/**
 * Chat utility functions
 */

/**
 * Maps API message data to UI message format
 * @param {Object} apiMessage - Message data from API
 * @returns {Object} - Formatted message for UI consumption
 */
export const mapApiMessageToUiFormat = (apiMessage) => {
  if (!apiMessage) return null;
  
  return {
    id: apiMessage.id,
    isUser: apiMessage.sender === 'user',
    content: apiMessage.content || '',  // Ensure content is never undefined
    timestamp: new Date(apiMessage.createdAt || Date.now()),
    status: 'delivered',
    file: apiMessage.file ? {
      id: apiMessage.file.id,
      name: apiMessage.file.filename,
      path: apiMessage.file.path,
      url: apiMessage.file.path,
      type: apiMessage.file.mimetype,
      size: apiMessage.file.size || 0
    } : null
  };
};

/**
 * Maps a collection of API messages to UI message format
 * @param {Array} apiMessages - Collection of message data from API
 * @returns {Array} - Formatted messages for UI consumption
 */
export const mapApiMessagesToUiFormat = (apiMessages = []) => {
  return apiMessages.map(mapApiMessageToUiFormat).filter(Boolean);
};

/**
 * Generate a unique message ID for tracking purposes
 * @returns {String} - A unique ID
 */
export const generateMessageId = () => {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}; 