import { supabase } from './supabase';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export interface GooglePickerResult {
  id: string;
  name: string;
  mimeType: string;
  url: string;
}

export class GoogleAPIs {
  private static instance: GoogleAPIs;
  private accessToken: string | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): GoogleAPIs {
    if (!GoogleAPIs.instance) {
      GoogleAPIs.instance = new GoogleAPIs();
    }
    return GoogleAPIs.instance;
  }

  async initialize() {
    if (this.isInitialized) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Load Google APIs
    await this.loadGoogleAPIs();
    
    // Use environment variables for public credentials
    const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

    if (!API_KEY) {
      throw new Error('Google credentials not configured in environment');
    }

    // Get access token from Supabase session (OAuth provider token)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.provider_token) {
      this.accessToken = session.provider_token;
    }

    this.isInitialized = true;
  }

  private async loadGoogleAPIs(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.gapi && window.google && window.google.picker) {
        resolve();
        return;
      }

      // Load Google API script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        // Load picker module only (no auth2)
        window.gapi.load('picker', () => {
          resolve();
        });
      };
      script.onerror = () => reject(new Error('Failed to load Google APIs'));
      document.head.appendChild(script);
    });
  }

  async authenticateGoogle(): Promise<string> {
    await this.initialize();

    // Get the access token from Supabase OAuth session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      throw new Error('No Google access token available. Please sign in again.');
    }

    this.accessToken = session.provider_token;
    return this.accessToken;
  }

  async openPicker(mimeType: string): Promise<GooglePickerResult> {
    if (!this.accessToken) {
      this.accessToken = await this.authenticateGoogle();
    }

    return new Promise(async (resolve, reject) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        reject(new Error('User not authenticated'));
        return;
      }

      const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
      
      if (!API_KEY) {
        reject(new Error('Google API key not configured'));
        return;
      }

      // Ensure Google Picker is loaded
      if (!window.google || !window.google.picker) {
        await this.loadGoogleAPIs();
      }

      if (!window.google || !window.google.picker) {
        reject(new Error('Google Picker API failed to load'));
        return;
      }

          const picker = new window.google.picker.PickerBuilder()
            .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
            .setDeveloperKey(API_KEY)
            .setOAuthToken(this.accessToken)
            .addView(new window.google.picker.DocsView(mimeType)
              .setIncludeFolders(true))
            .setCallback((data: any) => {
              if (data.action === window.google.picker.Action.PICKED) {
                const doc = data.docs[0];
                resolve({
                  id: doc.id,
                  name: doc.name,
                  mimeType: doc.mimeType,
                  url: doc.url,
                });
              }
            })
            .build();

          picker.setVisible(true);
    });
  }

  async getDocumentContent(documentId: string): Promise<any> {
    if (!this.accessToken) {
      this.accessToken = await this.authenticateGoogle();
    }

    const response = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch document content');
    }

    return response.json();
  }

  async getSheetData(spreadsheetId: string, range: string = 'A1:Z1000'): Promise<any> {
    if (!this.accessToken) {
      this.accessToken = await this.authenticateGoogle();
    }

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch sheet data');
    }

    return response.json();
  }
}

export const googleAPIs = GoogleAPIs.getInstance();
