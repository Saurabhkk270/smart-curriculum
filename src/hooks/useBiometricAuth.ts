import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

interface BiometricState {
  isAvailable: boolean;
  biometryType: BiometryType;
  isNative: boolean;
  error: string | null;
}

export const useBiometricAuth = () => {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    biometryType: BiometryType.NONE,
    isNative: false,
    error: null
  });
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative) {
      setState(prev => ({ ...prev, isNative: false, isAvailable: false }));
      return;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      setState({
        isAvailable: result.isAvailable,
        biometryType: result.biometryType,
        isNative: true,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isNative: true,
        isAvailable: false,
        error: 'Failed to check biometric availability'
      }));
    }
  };

  const verifyBiometric = useCallback(async (reason?: string): Promise<boolean> => {
    if (!state.isAvailable || !state.isNative) {
      return false;
    }

    setIsVerifying(true);
    try {
      await NativeBiometric.verifyIdentity({
        reason: reason || 'Verify your identity to access the app',
        title: 'Biometric Authentication',
        subtitle: 'Use your fingerprint or face to continue',
        description: 'Smart Curriculum requires biometric verification'
      });
      setIsVerifying(false);
      return true;
    } catch (error) {
      setIsVerifying(false);
      setState(prev => ({ ...prev, error: 'Biometric verification failed' }));
      return false;
    }
  }, [state.isAvailable, state.isNative]);

  const saveCredentials = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (!state.isNative) return false;

    try {
      await NativeBiometric.setCredentials({
        username,
        password,
        server: 'smart-curriculum-app'
      });
      return true;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      return false;
    }
  }, [state.isNative]);

  const getCredentials = useCallback(async (): Promise<{ username: string; password: string } | null> => {
    if (!state.isNative) return null;

    try {
      const credentials = await NativeBiometric.getCredentials({
        server: 'smart-curriculum-app'
      });
      return credentials;
    } catch (error) {
      console.error('Failed to get credentials:', error);
      return null;
    }
  }, [state.isNative]);

  const deleteCredentials = useCallback(async (): Promise<boolean> => {
    if (!state.isNative) return false;

    try {
      await NativeBiometric.deleteCredentials({
        server: 'smart-curriculum-app'
      });
      return true;
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      return false;
    }
  }, [state.isNative]);

  const getBiometryTypeName = (): string => {
    switch (state.biometryType) {
      case BiometryType.FACE_ID:
        return 'Face ID';
      case BiometryType.TOUCH_ID:
        return 'Touch ID';
      case BiometryType.FINGERPRINT:
        return 'Fingerprint';
      case BiometryType.FACE_AUTHENTICATION:
        return 'Face Authentication';
      case BiometryType.IRIS_AUTHENTICATION:
        return 'Iris Authentication';
      case BiometryType.MULTIPLE:
        return 'Biometric';
      default:
        return 'Biometric';
    }
  };

  return {
    ...state,
    isVerifying,
    verifyBiometric,
    saveCredentials,
    getCredentials,
    deleteCredentials,
    getBiometryTypeName,
    checkBiometricAvailability
  };
};
