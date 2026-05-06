import { useEffect, useState } from 'react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { Fingerprint, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BiometricGateProps {
  children: React.ReactNode;
  onBypass?: () => void;
}

export const BiometricGate = ({ children, onBypass }: BiometricGateProps) => {
  const { 
    isAvailable, 
    isNative, 
    isVerifying, 
    verifyBiometric, 
    getBiometryTypeName,
    error 
  } = useBiometricAuth();
  
  const { isLocked, unlock } = useInactivityTimer(600000); // 10 minutes
  const [isVerified, setIsVerified] = useState(false);
  const [isBypassed, setIsBypassed] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    // Auto-trigger biometric on native platforms
    if (isNative && isAvailable && !isVerified && !isBypassed) {
      handleBiometricVerification();
    }
  }, [isNative, isAvailable, isBypassed]);

  // Safety timeout: If biometric check takes more than 5 seconds, allow manual bypass
  useEffect(() => {
    if (!isNative || !isAvailable) return;
    
    const timer = setTimeout(() => {
      if (!isVerified) {
        console.warn('Biometric check timed out, showing bypass option');
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isVerified, isNative, isAvailable]);

  const handleBiometricVerification = async () => {
    try {
      const success = await verifyBiometric('Unlock SVSU Attendance APP');
      if (success) {
        setIsVerified(true);
      } else {
        setAttemptCount(prev => prev + 1);
      }
    } catch (e) {
      console.error('Biometric verification error:', e);
      setAttemptCount(prev => prev + 1);
    }
  };

  // If not on native platform or biometric not available, show children directly
  if (!isNative || !isAvailable || isBypassed) {
    return <>{children}</>;
  }

  // If verified AND NOT locked, show children
  if (isVerified && !isLocked) {
    return <>{children}</>;
  }

  const handleUnlock = async () => {
    const success = await verifyBiometric('Unlock SVSU Attendance APP');
    if (success) {
      setIsVerified(true);
      unlock();
    } else {
      setAttemptCount(prev => prev + 1);
    }
  };

  // Show biometric gate
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Card className="w-full max-w-md shadow-2xl border border-border/50 bg-card">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center mb-4 shadow-lg animate-pulse">
            <Fingerprint className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Authentication Required
          </CardTitle>
          <CardDescription>
            Use {getBiometryTypeName()} to unlock the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && attemptCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Verification failed. Please try again.</span>
            </div>
          )}

          <Button 
            onClick={handleUnlock}
            disabled={isVerifying}
            className="w-full h-14 text-lg"
            size="lg"
          >
            {isVerifying ? (
              <>
                <ShieldCheck className="w-5 h-5 mr-2 animate-pulse" />
                Verifying...
              </>
            ) : (
              <>
                <Fingerprint className="w-5 h-5 mr-2" />
                Unlock with {getBiometryTypeName()}
              </>
            )}
          </Button>

          {attemptCount >= 3 && onBypass && (
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={onBypass}
            >
              Use password instead
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground mt-4">
            Your biometric data never leaves your device
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BiometricGate;
