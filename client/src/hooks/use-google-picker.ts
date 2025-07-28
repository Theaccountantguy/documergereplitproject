import { useState } from 'react';
import { googleAPIs, type GooglePickerResult } from '@/lib/google-apis';

export function useGooglePicker() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDocumentPicker = async (): Promise<GooglePickerResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await googleAPIs.openPicker('application/vnd.google-apps.document');
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open document picker');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const openSpreadsheetPicker = async (): Promise<GooglePickerResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await googleAPIs.openPicker('application/vnd.google-apps.spreadsheet');
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open spreadsheet picker');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    openDocumentPicker,
    openSpreadsheetPicker,
  };
}
