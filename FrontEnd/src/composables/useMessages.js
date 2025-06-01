import { ref } from 'vue';

// Composable for managing messages (success, error, info)
export function useMessages() {
  const successMessage = ref(null);
  const errorMessage = ref(null);
  const infoMessage = ref(null);

  // Show success message with auto-hide
  const showSuccess = (message, duration = 5000) => {
    successMessage.value = message;
    if (duration > 0) {
      setTimeout(() => {
        successMessage.value = null;
      }, duration);
    }
  };

  // Show error message with auto-hide
  const showError = (message, duration = 8000) => {
    errorMessage.value = message;
    if (duration > 0) {
      setTimeout(() => {
        errorMessage.value = null;
      }, duration);
    }
  };

  // Show info message with auto-hide
  const showInfo = (message, duration = 5000) => {
    infoMessage.value = message;
    if (duration > 0) {
      setTimeout(() => {
        infoMessage.value = null;
      }, duration);
    }
  };

  // Clear all messages
  const clearMessages = () => {
    successMessage.value = null;
    errorMessage.value = null;
    infoMessage.value = null;
  };

  // Clear specific message type
  const clearSuccess = () => { successMessage.value = null; };
  const clearError = () => { errorMessage.value = null; };
  const clearInfo = () => { infoMessage.value = null; };

  // Handle report creation success (commonly used)
  const handleReportSuccess = (report) => {
    console.log('Report created successfully:', report);
    showSuccess('Segnalazione inviata con successo! Il problema segnalato verrà preso in carico dal nostro team.');
  };

  return {
    // Reactive message states
    successMessage,
    errorMessage,
    infoMessage,
    
    // Message functions
    showSuccess,
    showError,
    showInfo,
    clearMessages,
    clearSuccess,
    clearError,
    clearInfo,
    
    // Common handlers
    handleReportSuccess
  };
} 