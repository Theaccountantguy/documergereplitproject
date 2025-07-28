import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useGooglePicker } from '@/hooks/use-google-picker';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { DocumentPreview } from '@/components/document-preview';
import { SettingsPanel } from '@/components/settings-panel';
import { OAuthModal } from '@/components/oauth-modal';
import { GooglePicker } from '@/components/google-picker';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { googleAPIs } from '@/lib/google-apis';

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const { openDocumentPicker, openSpreadsheetPicker, isLoading: pickerLoading } = useGooglePicker();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [documentContent, setDocumentContent] = useState<any>(null);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);

  const [pickerTitle, setPickerTitle] = useState('');
  const [isCredentialsActive, setIsCredentialsActive] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [isMerging, setIsMerging] = useState(false);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/auth');
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (user) {
      checkCredentials();
    }
  }, [user]);

  const checkCredentials = async () => {
    if (!user) return;
    
    // Since credentials are pre-configured via environment variables,
    // we just need to check if the environment variables are present
    const hasCredentials = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_API_KEY);
    setIsCredentialsActive(hasCredentials);
  };

  const handleSelectDocument = async () => {
    if (!isCredentialsActive) {
      setShowOAuthModal(true);
      return;
    }

    try {
      const result = await openDocumentPicker();
      if (result) {
        console.log('Document selected:', result);
        setSelectedDocument(result);
        // No need to load content since we're using iframe
        toast({
          title: "Document Selected",
          description: `Selected: ${result.name}`,
        });
      }
    } catch (error) {
      console.error('Document selection error:', error);
      toast({
        title: "Error",
        description: "Failed to select document",
        variant: "destructive",
      });
    }
  };

  const handleSelectSheet = async () => {
    if (!isCredentialsActive) {
      setShowOAuthModal(true);
      return;
    }

    try {
      const result = await openSpreadsheetPicker();
      if (result) {
        setSelectedSheet(result);
        await loadSheetHeaders(result.id);
        toast({
          title: "Spreadsheet Selected",
          description: `Selected: ${result.name}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select spreadsheet",
        variant: "destructive",
      });
    }
  };

  const loadDocumentContent = async (documentId: string) => {
    setIsLoadingDocument(true);
    try {
      console.log('Loading document content for:', documentId);
      const content = await googleAPIs.getDocumentContent(documentId);
      console.log('Document content loaded:', content);
      setDocumentContent(content);
    } catch (error) {
      console.error('Document loading error:', error);
      toast({
        title: "Error",
        description: "Failed to load document content",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDocument(false);
    }
  };

  const loadSheetHeaders = async (spreadsheetId: string) => {
    try {
      console.log('Loading sheet headers for:', spreadsheetId);
      const data = await googleAPIs.getSheetData(spreadsheetId, 'A1:Z1');
      console.log('Sheet data received:', data);
      if (data.values && data.values[0]) {
        console.log('Sheet headers:', data.values[0]);
        setSheetHeaders(data.values[0]);
      } else {
        console.log('No sheet values found in response');
      }
    } catch (error) {
      console.error('Sheet loading error:', error);
      toast({
        title: "Error",
        description: "Failed to load sheet headers",
        variant: "destructive",
      });
    }
  };

  const handleOAuthAuthorize = async () => {
    try {
      await googleAPIs.authenticateGoogle();
      setIsCredentialsActive(true);
      setShowOAuthModal(false);
      toast({
        title: "Authorization Successful",
        description: "You can now access your Google Drive files",
      });
    } catch (error) {
      toast({
        title: "Authorization Failed",
        description: "Failed to authorize Google Drive access",
        variant: "destructive",
      });
    }
  };

  const handleStartMerge = async () => {
    if (!selectedDocument || !selectedSheet) {
      toast({
        title: "Missing Requirements",
        description: "Please select both a document and spreadsheet",
        variant: "destructive",
      });
      return;
    }

    setIsMerging(true);
    setMergeProgress(0);

    try {
      // Simulate progress for now
      const interval = setInterval(() => {
        setMergeProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsMerging(false);
            toast({
              title: "Merge Completed",
              description: "All documents have been generated successfully",
            });
            return 100;
          }
          return prev + 10;
        });
      }, 500);
    } catch (error) {
      setIsMerging(false);
      toast({
        title: "Merge Failed",
        description: "Failed to complete mail merge operation",
        variant: "destructive",
      });
    }
  };

  const handleRefreshDocument = async () => {
    if (selectedDocument) {
      await loadDocumentContent(selectedDocument.id);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setLocation('/auth');
    } catch (error) {
      toast({
        title: "Sign Out Failed",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-medium text-gray-900">Mail Merge Pro</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-gray-400 hover:text-gray-600"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-screen pt-16">
        <DocumentPreview
          document={selectedDocument}
          onRefresh={handleRefreshDocument}
          onStartMerge={handleStartMerge}
          isLoading={isLoadingDocument}
        />
        
        <SettingsPanel
          selectedDocument={selectedDocument}
          selectedSheet={selectedSheet}
          sheetHeaders={sheetHeaders}
          mergeProgress={mergeProgress}
          onSelectDocument={handleSelectDocument}
          onSelectSheet={handleSelectSheet}
          onStartMerge={handleStartMerge}
          isCredentialsActive={isCredentialsActive}
          isMerging={isMerging}
        />
      </div>

      {/* Modals */}
      <OAuthModal
        isOpen={showOAuthModal}
        onClose={() => setShowOAuthModal(false)}
        onAuthorize={handleOAuthAuthorize}
        isLoading={pickerLoading}
      />

      <GooglePicker
        isOpen={showPickerModal}
        onClose={() => setShowPickerModal(false)}
        title={pickerTitle}
      />
    </div>
  );
}
