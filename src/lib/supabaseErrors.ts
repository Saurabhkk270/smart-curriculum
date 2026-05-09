export const getSupabaseErrorMessage = (error: unknown, fallback: string) => {
  const message =
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : '';

  if (
    message.toLowerCase().includes('fetch failed') ||
    message.toLowerCase().includes('failed to fetch') ||
    message.toLowerCase().includes('networkerror')
  ) {
    return 'Cannot reach the attendance database. Check that the Supabase project URL/key are correct and the project is active.';
  }

  return message || fallback;
};
