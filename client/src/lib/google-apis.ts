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
    
    // Get stored credentials
    const { data: credentials } = await supabase
      .from('google_credentials')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!credentials) {
      throw new Error('Google credentials not configured');
    }

    await window.gapi.load('auth2', async () => {
      await window.gapi.auth2.init({
        client_id: credentials.client_id,
      });
    });

    this.isInitialized = true;
  }

  private async loadGoogleAPIs(): Promise<void> {
    return new Promise((resolve) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('auth2:picker', resolve);
      };
      document.head.appendChild(script);
    });
  }

  async authenticateGoogle(): Promise<string> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const authInstance = window.gapi.auth2.getAuthInstance();
      
      authInstance.signIn({
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/spreadsheets'
      }).then(async (googleUser: any) => {
        const authResponse = googleUser.getAuthResponse();
        this.accessToken = authResponse.access_token;

        // Store tokens in Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('users')
            .update({
              google_access_token: authResponse.access_token,
              google_refresh_token: authResponse.refresh_token,
              google_token_expires_at: new Date(authResponse.expires_at).toISOString(),
            })
            .eq('id', user.id);
        }

        resolve(authResponse.access_token);
      }).catch(reject);
    });
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

      const { data: credentials } = await supabase
        .from('google_credentials')
        .select('api_key')
        .eq('user_id', user.id)
        .single();
        
      if (!credentials) {
        reject(new Error('API key not found'));
        return;
      }

          const picker = new window.google.picker.PickerBuilder()
            .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
            .setAppId(credentials.api_key)
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
