// Wrapper for server actions to handle database connection errors gracefully

export async function withDatabaseErrorHandling<T>(
  action: () => Promise<T>,
  fallbackValue: T,
  errorMessage: string = "Database operation failed"
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return fallbackValue;
  }
}

// Specific wrapper for setup-related actions
export async function withSetupErrorHandling<T>(
  action: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  return withDatabaseErrorHandling(
    action,
    fallbackValue,
    "Setup operation failed - assuming first time setup"
  );
}
