import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear?: () => void;
}

export const SignaturePad = ({ onSave, onClear }: SignaturePadProps) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
    if (onClear) onClear();
  };

  const handleEnd = () => {
    setIsEmpty(sigCanvas.current?.isEmpty() ?? true);
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      onSave(sigCanvas.current.toDataURL('image/png'));
    }
  };

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 relative">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-48 sm:h-64 cursor-crosshair',
          }}
          onEnd={handleEnd}
          backgroundColor="rgb(249, 250, 251)"
        />
        {!isEmpty && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500 hover:text-red-600 transition-colors"
            title="Wissen"
          >
            <Eraser className="w-4 h-4" />
          </button>
        )}
        {isEmpty && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-400">
            Teken hier uw handtekening
          </div>
        )}
      </div>
    </div>
  );
};
