import { Platform } from 'react-native';

function isAbortError(error) {
  return (
    error?.name === 'AbortError' ||
    error?.code === 'ABORT_ERR' ||
    /AbortError|aborted a request/i.test(String(error?.message || error))
  );
}

export function suppressBenignAbortErrors() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }

  if (window.__smitGymSuppressesBenignAbortErrors) {
    return;
  }

  window.__smitGymSuppressesBenignAbortErrors = true;

  window.addEventListener('unhandledrejection', (event) => {
    if (isAbortError(event.reason)) {
      event.preventDefault();
    }
  });
}
