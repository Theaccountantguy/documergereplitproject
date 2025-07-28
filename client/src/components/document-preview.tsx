import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play } from 'lucide-react';

interface DocumentPreviewProps {
  document: any;
  onRefresh: () => void;
  onStartMerge: () => void;
  isLoading?: boolean;
}

export function DocumentPreview({ document, onRefresh, onStartMerge, isLoading }: DocumentPreviewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const renderMergeField = (text: string) => {
    return text.replace(/\{\{(\w+)\}\}/g, '<span class="bg-yellow-100 px-2 py-1 rounded border-l-4 border-yellow-400 font-medium">{{$1}}</span>');
  };

  if (isLoading) {
    return (
      <div className="w-4/5 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading Google Document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="w-4/5 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Document Selected</h3>
          <p className="text-sm">Select a Google Document from the settings panel to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-4/5 bg-white border-r border-gray-200 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24">
            <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
          <span className="font-medium text-gray-900">{document.name}</span>
          <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">Connected</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={onStartMerge}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Play className="w-4 h-4 mr-1" />
            Start Merge
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full bg-white border border-gray-200">
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">{document.title || document.name}</h2>
            <div className="text-xs text-gray-500">
              Editable Google Document
            </div>
          </div>

          <div className="h-full">
            {document.id ? (
              <iframe
                src={`https://docs.google.com/document/d/${document.id}/edit?usp=sharing`}
                className="w-full h-full border-0"
                title={document.name}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            ) : (
              <div className="p-6 text-center text-gray-500 py-20">
                <p>No document selected or document cannot be displayed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
