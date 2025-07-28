import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Settings, Key, CheckCircle, AlertCircle } from 'lucide-react';

interface CredentialsSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CredentialsSetup({ isOpen, onClose, onSuccess }: CredentialsSetupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    client_id: '',
    client_secret: '',
    api_key: '',
    app_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Failed to save credentials');
      }

      toast({
        title: "Credentials Saved",
        description: "Your Google API credentials have been configured successfully",
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Configuration Failed",
        description: "Failed to save Google API credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof credentials) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-center">Configure Google API Credentials</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Key className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 text-sm mb-2">Setup Instructions</h4>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                  <li>Create a new project or select an existing one</li>
                  <li>Enable Google Drive API, Docs API, and Sheets API</li>
                  <li>Create credentials (OAuth 2.0 Client ID and API Key)</li>
                  <li>Copy the credentials below</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Google Client ID</Label>
                <Input
                  id="client_id"
                  type="text"
                  placeholder="123456789.apps.googleusercontent.com"
                  value={credentials.client_id}
                  onChange={handleInputChange('client_id')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_secret">Client Secret</Label>
                <Input
                  id="client_secret"
                  type="password"
                  placeholder="GOCSPX-..."
                  value={credentials.client_secret}
                  onChange={handleInputChange('client_secret')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="AIza..."
                  value={credentials.api_key}
                  onChange={handleInputChange('api_key')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="app_id">App ID</Label>
                <Input
                  id="app_id"
                  type="text"
                  placeholder="123456789"
                  value={credentials.app_id}
                  onChange={handleInputChange('app_id')}
                  required
                />
              </div>
            </div>

            {/* Required APIs Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">Required APIs</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Make sure these APIs are enabled in your Google Cloud Console:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 bg-white border border-yellow-300 rounded text-xs">
                      <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                      Google Drive API
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-white border border-yellow-300 rounded text-xs">
                      <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                      Google Docs API
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-white border border-yellow-300 rounded text-xs">
                      <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                      Google Sheets API
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-white border border-yellow-300 rounded text-xs">
                      <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                      Google Picker API
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button 
                type="button"
                variant="outline" 
                className="flex-1" 
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-blue-500 hover:bg-blue-600" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Key className="w-4 h-4 mr-2" />
                )}
                Save Credentials
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}