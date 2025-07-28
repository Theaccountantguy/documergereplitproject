import { useState } from 'react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export default function PickerTest() {
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testBasicPicker = async () => {
    try {
      setError('');
      setResult('Loading Google APIs...');

      // Load basic Google API
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      
      script.onload = () => {
        window.gapi.load('picker', () => {
          setResult('Google Picker API loaded successfully');
          
          // Test basic picker without authentication
          const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
          
          if (!API_KEY) {
            setError('API Key not configured');
            return;
          }

          try {
            const picker = new window.google.picker.PickerBuilder()
              .setDeveloperKey(API_KEY)
              .addView(window.google.picker.ViewId.DOCS)
              .setCallback((data: any) => {
                setResult(`Picker callback: ${JSON.stringify(data, null, 2)}`);
              })
              .build();

            picker.setVisible(true);
            setResult('Picker displayed successfully');
          } catch (pickerError: any) {
            setError(`Picker creation error: ${pickerError.message}`);
          }
        });
      };

      script.onerror = () => {
        setError('Failed to load Google APIs');
      };

      document.head.appendChild(script);
    } catch (mainError: any) {
      setError(`Main error: ${mainError.message}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Google Picker Test</h1>
      
      <Button onClick={testBasicPicker} className="mb-4">
        Test Basic Picker (No Auth)
      </Button>
      
      <div className="space-y-4">
        {result && (
          <div className="bg-green-100 p-4 rounded">
            <h3 className="font-semibold text-green-800">Result:</h3>
            <pre className="text-sm mt-2 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 p-4 rounded">
            <h3 className="font-semibold text-red-800">Error:</h3>
            <pre className="text-sm mt-2">{error}</pre>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-sm text-gray-600">
        <p><strong>API Key:</strong> {import.meta.env.VITE_GOOGLE_API_KEY ? 'Configured' : 'Missing'}</p>
        <p><strong>App ID:</strong> {import.meta.env.VITE_GOOGLE_APP_ID ? 'Configured' : 'Missing'}</p>
        <p><strong>Client ID:</strong> {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Configured' : 'Missing'}</p>
      </div>
    </div>
  );
}