import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GooglePickerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function GooglePicker({ isOpen, onClose, title }: GooglePickerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-3/4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-gray-600">
            Choose a {title.toLowerCase().includes('document') ? 'document' : 'spreadsheet'} to use as your mail merge template.
          </p>
        </DialogHeader>
        
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading Google Picker...</p>
            <p className="text-sm text-gray-500 mt-2">Google Picker API will be embedded here</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
