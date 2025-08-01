import { supabase } from './supabase';

declare global {
  interface Window {
    gapi: any;
    google: any;
    googleIdentityLoaded?: boolean;
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
    const APP_ID = import.meta.env.VITE_GOOGLE_APP_ID;

    if (!API_KEY || !APP_ID) {
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
      if (window.gapi && window.google && window.google.picker && window.googleIdentityLoaded) {
        resolve();
        return;
      }

      // Load Google Identity Services
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.onload = () => {
        window.googleIdentityLoaded = true;
        
        // Load Google API script
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = () => {
          // Load picker module
          window.gapi.load('picker', () => {
            resolve();
          });
        };
        gapiScript.onerror = () => reject(new Error('Failed to load Google APIs'));
        document.head.appendChild(gapiScript);
      };
      gisScript.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(gisScript);
    });
  }

  async authenticateGoogle(): Promise<string> {
    await this.initialize();

    // Get the access token from Supabase OAuth session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.provider_token) {
      this.accessToken = session.provider_token;
      console.log('Using Supabase OAuth token for Google APIs');
      return this.accessToken;
    }

    // Fallback: Use Google Identity Services for direct authentication
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts) {
        reject(new Error('Google Identity Services not loaded'));
        return;
      }

      const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!CLIENT_ID) {
        reject(new Error('Google Client ID not configured'));
        return;
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/spreadsheets.readonly',
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          this.accessToken = response.access_token;
          console.log('Successfully authenticated with Google APIs - scope includes docs/sheets access');
          resolve(this.accessToken!);
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    });
  }

  async openPicker(mimeType: string): Promise<GooglePickerResult> {
    if (!this.accessToken) {
      this.accessToken = await this.authenticateGoogle();
    }

    return new Promise(async (resolve, reject) => {
      try {
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

        // Use a simple DocsView without complex configuration
        const view = new window.google.picker.DocsView()
          .setIncludeFolders(true);
        
        // Set specific mime type if provided
        if (mimeType) {
          view.setMimeTypes(mimeType);
        }

        const picker = new window.google.picker.PickerBuilder()
          .setDeveloperKey(API_KEY)
          .setOAuthToken(this.accessToken)
          .addView(view)
          .setCallback((data: any) => {
            try {
              if (data.action === window.google.picker.Action.PICKED && data.docs && data.docs[0]) {
                const doc = data.docs[0];
                resolve({
                  id: doc.id,
                  name: doc.name,
                  mimeType: doc.mimeType,
                  url: doc.url,
                });
              } else if (data.action === window.google.picker.Action.CANCEL) {
                reject(new Error('User cancelled picker'));
              }
            } catch (callbackError) {
              reject(callbackError);
            }
          })
          .build();

        picker.setVisible(true);
      } catch (mainError) {
        reject(mainError);
      }
    });
  }

  async getDocumentContent(documentId: string): Promise<any> {
    if (!this.accessToken) {
      this.accessToken = await this.authenticateGoogle();
    }

    console.log('Fetching document:', documentId);
    console.log('Using access token:', this.accessToken?.substring(0, 20) + '...');

    const response = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Document API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Document API error:', errorText);
      throw new Error(`Failed to fetch document content: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Document data received:', data);
    
    // Process Google Docs content structure
    const processedData = this.processDocumentContent(data);
    return processedData;
  }

  async getSheetData(spreadsheetId: string, range: string = 'A1:Z1'): Promise<any> {
    if (!this.accessToken) {
      this.accessToken = await this.authenticateGoogle();
    }

    console.log('Fetching sheet headers:', spreadsheetId, 'range:', range);

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${import.meta.env.VITE_GOOGLE_API_KEY}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    console.log('Sheets API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sheets API error:', errorText);
      throw new Error(`Failed to fetch sheet headers: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Sheet headers received:', data);
    return data;
  }

  private processDocumentContent(data: any): any {
    if (!data || !data.body || !data.body.content) {
      return { ...data, content: '' };
    }

    let textContent = '';
    
    const extractText = (elements: any[]): string => {
      let text = '';
      
      for (const element of elements) {
        if (element.paragraph && element.paragraph.elements) {
          for (const paraElement of element.paragraph.elements) {
            if (paraElement.textRun && paraElement.textRun.content) {
              text += paraElement.textRun.content;
            }
          }
        } else if (element.table && element.table.tableRows) {
          // Handle table content
          for (const row of element.table.tableRows) {
            if (row.tableCells) {
              for (const cell of row.tableCells) {
                if (cell.content) {
                  text += extractText(cell.content) + ' ';
                }
              }
              text += '\n';
            }
          }
        }
      }
      
      return text;
    };

    textContent = extractText(data.body.content);
    
    // Convert to HTML-like format for display
    const htmlContent = textContent
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => `<p>${line.trim()}</p>`)
      .join('');

    return {
      ...data,
      content: htmlContent,
      rawText: textContent.trim()
    };
  }

  // Test if current token has sufficient permissions
  async testAPIAccess(): Promise<boolean> {
    if (!this.accessToken) return false;
    
    try {
      // Test basic Drive access
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      
      return response.ok;
    } catch (error) {
      console.error('API access test failed:', error);
      return false;
    }
  }

  // Force re-authentication with fresh tokens
  async forceReauth(): Promise<string> {
    this.accessToken = null;
    return this.authenticateGoogle();
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Perform mail merge and return downloadable PDFs
  async performMailMerge(
    documentId: string, 
    spreadsheetId: string, 
    onProgress: (progress: number) => void
  ): Promise<{ success: boolean; downloadUrls: Array<{ name: string; url: string }> }> {
    if (!this.accessToken) {
      this.accessToken = await this.authenticateGoogle();
    }

    console.log('Starting mail merge process...');
    onProgress(5);

    // Get spreadsheet data
    const sheetData = await this.getSheetData(spreadsheetId, 'A:Z');
    if (!sheetData.values || sheetData.values.length < 2) {
      throw new Error('Insufficient data in spreadsheet');
    }

    const headers = sheetData.values[0];
    const rows = sheetData.values.slice(1);
    onProgress(15);

    // Get document content
    const docResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}?key=${import.meta.env.VITE_GOOGLE_API_KEY}`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    );

    if (!docResponse.ok) {
      throw new Error('Failed to fetch document content');
    }

    const docData = await docResponse.json();
    onProgress(25);

    const downloadUrls: Array<{ name: string; url: string }> = [];
    const totalRows = rows.length;

    // Process each row
    for (let i = 0; i < totalRows; i++) {
      const row = rows[i];
      
      // Create data object from headers and row values
      const rowData: Record<string, string> = {};
      headers.forEach((header: string, index: number) => {
        rowData[header] = row[index] || '';
      });

      // Copy the original document
      const copyResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${documentId}/copy?key=${import.meta.env.VITE_GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `Merged Document ${i + 1} - ${rowData[headers[0]] || 'Document'}`,
          }),
        }
      );

      if (!copyResponse.ok) {
        console.error(`Failed to copy document for row ${i + 1}`);
        continue;
      }

      const copiedDoc = await copyResponse.json();

      // Get document content and replace merge fields
      let content = this.extractDocumentText(docData);
      Object.entries(rowData).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value);
      });

      // Update the copied document with merged content
      await fetch(
        `https://docs.googleapis.com/v1/documents/${copiedDoc.id}:batchUpdate?key=${import.meta.env.VITE_GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                deleteContentRange: {
                  range: {
                    startIndex: 1,
                    endIndex: -1,
                  },
                },
              },
              {
                insertText: {
                  location: { index: 1 },
                  text: content,
                },
              },
            ],
          }),
        }
      );

      // Generate PDF export URL with auth token
      const pdfUrl = `https://docs.google.com/document/d/${copiedDoc.id}/export?format=pdf&access_token=${this.accessToken}`;
      downloadUrls.push({
        name: `merged_document_${i + 1}.pdf`,
        url: pdfUrl,
      });

      // Update progress
      const progress = 25 + ((i + 1) / totalRows) * 70;
      onProgress(Math.round(progress));
    }

    onProgress(100);
    console.log('Mail merge completed:', downloadUrls.length, 'documents generated');

    return {
      success: true,
      downloadUrls,
    };
  }

  private extractDocumentText(docData: any): string {
    let text = '';
    
    if (docData.body && docData.body.content) {
      for (const element of docData.body.content) {
        if (element.paragraph && element.paragraph.elements) {
          for (const textElement of element.paragraph.elements) {
            if (textElement.textRun && textElement.textRun.content) {
              text += textElement.textRun.content;
            }
          }
        }
      }
    }
    
    return text;
  }
}

export const googleAPIs = GoogleAPIs.getInstance();
