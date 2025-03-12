
import { useState, useEffect } from 'react';
import { Camera, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { ButtonCustom } from '@/components/ui/button-custom';

interface QRCodeScannerProps {
  onScan: (userId: string) => void;
}

const QRCodeScanner = ({ onScan }: QRCodeScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const qrCodeId = 'qr-reader';

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode(qrCodeId);
        setScanning(true);
        setScanError(null);

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: 250,
          },
          (decodedText) => {
            // QR code scanned successfully
            html5QrCode?.stop();
            setScanSuccess(true);
            setScanning(false);
            
            // Try to extract a uuid pattern
            const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
            const match = decodedText.match(uuidPattern);
            
            if (match) {
              onScan(match[0]);
            } else {
              // If no UUID pattern, just pass the whole text
              onScan(decodedText);
            }
          },
          (errorMessage) => {
            // Will be called continuously while scanning
            console.log('QR scan in progress:', errorMessage);
          }
        );
      } catch (err) {
        console.error('Error starting scanner:', err);
        setScanError('Could not access camera. Please make sure you have granted camera permissions.');
        setScanning(false);
      }
    };

    // Start scanning when component mounts
    if (!scanning && !scanSuccess) {
      startScanner();
    }

    // Cleanup on unmount
    return () => {
      if (html5QrCode) {
        html5QrCode.stop().catch(error => {
          console.error('Error stopping QR scanner:', error);
        });
      }
    };
  }, [onScan, qrCodeId, scanning, scanSuccess]);

  const handleRetry = () => {
    setScanError(null);
    setScanSuccess(false);
    setScanning(false);
  };

  return (
    <div className="flex flex-col items-center w-full">
      {scanning && (
        <div className="text-center mb-4">
          <Camera className="animate-pulse mx-auto h-8 w-8 text-primary mb-2" />
          <p className="text-sm text-muted-foreground">
            Point your camera at a Moval user QR code
          </p>
        </div>
      )}

      <div 
        id={qrCodeId} 
        className={`w-full ${scanning ? 'min-h-[250px]' : 'min-h-[50px]'} mb-4 rounded-lg overflow-hidden`}
      ></div>

      {scanError && (
        <div className="flex flex-col items-center text-center mb-4 text-destructive">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p className="text-sm">{scanError}</p>
          <ButtonCustom
            variant="outline"
            className="mt-3"
            onClick={handleRetry}
          >
            Try Again
          </ButtonCustom>
        </div>
      )}

      {scanSuccess && (
        <div className="flex flex-col items-center text-center mb-4 text-primary">
          <CheckCircle2 className="h-8 w-8 mb-2" />
          <p className="text-sm">QR code scanned successfully!</p>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
