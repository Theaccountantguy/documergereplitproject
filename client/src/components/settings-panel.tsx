import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, Settings, List, FileText, Table, CheckCircle, Download } from 'lucide-react';

interface SettingsPanelProps {
  selectedDocument: any;
  selectedSheet: any;
  sheetHeaders: string[];
  mergeProgress: number;
  onSelectDocument: () => void;
  onSelectSheet: () => void;
  onStartMerge: () => void;
  isCredentialsActive: boolean;
  isMerging: boolean;
}

export function SettingsPanel({
  selectedDocument,
  selectedSheet,
  sheetHeaders,
  mergeProgress,
  onSelectDocument,
  onSelectSheet,
  onStartMerge,
  isCredentialsActive,
  isMerging,
}: SettingsPanelProps) {
  const [setupExpanded, setSetupExpanded] = useState(true);
  const [propertiesExpanded, setPropertiesExpanded] = useState(true);
  const [generatePDF, setGeneratePDF] = useState(true);
  const [downloadZip, setDownloadZip] = useState(false);

  return (
    <div className="w-1/5 bg-gray-50 p-4 overflow-auto">
      <div className="space-y-4">
        
        {/* Setup Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <Collapsible open={setupExpanded} onOpenChange={setSetupExpanded}>
            <CollapsibleTrigger className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">Setup</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transform transition-transform ${setupExpanded ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="border-t border-gray-100 p-4 space-y-3">
              
              {/* Google Docs Setup */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Google Document</label>
                <button 
                  className="w-full p-3 border border-gray-200 rounded-md text-left hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  onClick={onSelectDocument}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {selectedDocument ? selectedDocument.name : 'Click to select document'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedDocument ? 'Click to change document' : 'No document selected'}
                      </div>
                    </div>
                    {selectedDocument && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                  </div>
                </button>
              </div>

              {/* Google Sheets Setup */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Google Sheet</label>
                <button 
                  className="w-full p-3 border border-gray-200 rounded-md text-left hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  onClick={onSelectSheet}
                >
                  <div className="flex items-center space-x-3">
                    <Table className="w-4 h-4 text-green-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {selectedSheet ? selectedSheet.name : 'Click to select spreadsheet'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedSheet ? 'Click to change spreadsheet' : 'No spreadsheet selected'}
                      </div>
                    </div>
                    {selectedSheet && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                  </div>
                </button>
              </div>

              {/* Credentials Status */}
              <div className="bg-gray-50 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">API Configuration</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    isCredentialsActive 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {isCredentialsActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-xs text-gray-600">
                    <CheckCircle className={`w-3 h-3 mr-2 ${isCredentialsActive ? 'text-green-500' : 'text-gray-400'}`} />
                    Client ID configured
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <CheckCircle className={`w-3 h-3 mr-2 ${isCredentialsActive ? 'text-green-500' : 'text-gray-400'}`} />
                    API Key active
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <CheckCircle className={`w-3 h-3 mr-2 ${isCredentialsActive ? 'text-green-500' : 'text-gray-400'}`} />
                    OAuth tokens valid
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Properties Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <Collapsible open={propertiesExpanded} onOpenChange={setPropertiesExpanded}>
            <CollapsibleTrigger className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-2">
                <List className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">Properties</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transform transition-transform ${propertiesExpanded ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="border-t border-gray-100 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Merge Fields</span>
                  <span className="text-xs text-gray-500">{sheetHeaders.length} fields</span>
                </div>
                
                {/* Sheet Headers List */}
                <div className="space-y-2">
                  {sheetHeaders.length > 0 ? (
                    sheetHeaders.map((header, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{header}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No merge fields available. Select a Google Sheet to view fields.
                    </div>
                  )}
                </div>

                {/* Data Preview */}
                {selectedSheet && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Data Preview</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Sheet data ready for merge
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Merge Operations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Merge Operations</h3>
          
          {/* Progress Bar */}
          {isMerging && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Processing...</span>
                <span>{mergeProgress}%</span>
              </div>
              <Progress value={mergeProgress} className="w-full" />
            </div>
          )}

          {/* Merge Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="generatePDF" 
                checked={generatePDF}
                onCheckedChange={setGeneratePDF}
              />
              <label htmlFor="generatePDF" className="text-sm text-gray-700">Generate PDF files</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="downloadZip" 
                checked={downloadZip}
                onCheckedChange={setDownloadZip}
              />
              <label htmlFor="downloadZip" className="text-sm text-gray-700">Download as ZIP</label>
            </div>

            <div className="pt-2">
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600" 
                onClick={onStartMerge}
                disabled={!selectedDocument || !selectedSheet || isMerging}
              >
                <Download className="w-4 h-4 mr-2" />
                Start Batch Merge
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
