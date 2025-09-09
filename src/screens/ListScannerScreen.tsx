import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../utils/constants';
import { openRouterService, ScanResult, BarcodeResult } from '../services/openRouterService';
import { openFoodFactsService, ProcessedProduct } from '../services/openFoodFactsService';
import { useShoppingList } from '../hooks/useShoppingList';
import { NameInputModal, SuccessModal, ErrorModal } from '../components/common';

export const ListScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const { activeList, addItem } = useShoppingList();
  const cameraRef = useRef<CameraView>(null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [isProcessing, setIsProcessing] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [scanMode, setScanMode] = useState<'list' | 'barcode'>('list');
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingScanResult, setPendingScanResult] = useState<ScanResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{listName: string, itemCount: number} | null>(null);
  const [showProductAddedModal, setShowProductAddedModal] = useState(false);
  const [productAddedMessage, setProductAddedMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      if (photo?.base64) {
        await processImage(photo.base64);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImage = async () => {
    if (isProcessing) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to photos to use this feature.');
        return;
      }

      setIsProcessing(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        await processImage(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processImage = async (base64: string) => {
    try {
      if (scanMode === 'list') {
        const scanResult: ScanResult = await openRouterService.scanListFromImage(base64);
        
        if (scanResult.items.length === 0) {
          setErrorMessage('Could not detect any list items in the image. Please try again with a clearer photo.');
          setShowErrorModal(true);
          return;
        }

        // Show modal to get list name from user
        setPendingScanResult(scanResult);
        setShowNameModal(true);
      } else {
        // Barcode scanning mode
        const barcodeResult: BarcodeResult = await openRouterService.scanBarcodeFromImage(base64);
        
        if (!barcodeResult.barcode) {
          setErrorMessage('Could not detect a barcode in the image. Please try again with a clearer photo of the barcode.');
          setShowErrorModal(true);
          return;
        }

        // Process the barcode to get product info
        await processBarcodeProduct(barcodeResult.barcode);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      let errorMessage = 'Failed to process the image. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = 'Please set your OpenRouter API key in settings first.';
        } else if (error.message.includes('OpenRouter API error')) {
          errorMessage = 'AI service error. Please check your API key and try again.';
        }
      }
      
      setErrorMessage(errorMessage);
      setShowErrorModal(true);
    }
  };

  const processBarcodeProduct = async (barcode: string) => {
    try {
      const processedProduct: ProcessedProduct = await openFoodFactsService.getProductByBarcode(barcode);
      const unit = openFoodFactsService.getDefaultUnit(processedProduct);
      
      const { addItemToCurrentList } = useShoppingList.getState();
      await addItemToCurrentList({
        name: processedProduct.name,
        category: processedProduct.category as any,
        quantity: 1,
        unit: unit,
        barcode: processedProduct.barcode,
        isCompleted: false,
      });

      setProductAddedMessage(`Added "${processedProduct.name}" to your current shopping list.`);
      setShowProductAddedModal(true);
    } catch (error) {
      console.error('Error processing barcode:', error);
      setErrorMessage('Failed to process barcode. Please try again.');
      setShowErrorModal(true);
    }
  };

  const createNewListFromScan = async (listName: string, scanResult: ScanResult) => {
    const { addList, setCurrentList } = useShoppingList.getState();
    
    try {
      await addList(listName);
      
      // Get the newly created list (it will be the last one added)
      const { lists } = useShoppingList.getState();
      const newList = lists[lists.length - 1];
      
      if (newList) {
        // Set it as the current list
        await setCurrentList(newList.id);
        
        // Add all detected items to the new list
        for (const item of scanResult.items) {
          await addItem(
            item.text,
            item.quantity || '1',
            item.category || 'other'
          );
        }
        
        setSuccessData({
          listName,
          itemCount: scanResult.items.length
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error creating list from scan:', error);
      Alert.alert('Error', 'Failed to create list from scanned image.');
    }
  };

  const handleNameConfirm = (listName: string) => {
    setShowNameModal(false);
    if (pendingScanResult) {
      createNewListFromScan(listName, pendingScanResult);
      setPendingScanResult(null);
    }
  };

  const handleNameCancel = () => {
    setShowNameModal(false);
    setPendingScanResult(null);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessData(null);
  };

  const handleViewList = () => {
    setShowSuccessModal(false);
    setSuccessData(null);
    navigation.navigate('ShoppingList' as never);
  };

  const toggleCameraType = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashMode(current => (current === 'off' ? 'on' : 'off'));
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan your shopping lists.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={cameraType}
          ref={cameraRef}
          flash={flashMode}
        >
          {/* Camera Overlay */}
          <View style={styles.overlay}>
            {/* Top Controls */}
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
                <Ionicons 
                  name={flashMode === 'on' ? 'flash' : 'flash-off'} 
                  size={24} 
                  color={colors.textPrimary} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.controlButton} onPress={toggleCameraType}>
                <Ionicons name="camera-reverse" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Scan Area with mode indicator */}
            <View style={styles.scanArea}>
              <View style={styles.modeIndicator}>
                <Text style={styles.modeText}>
                  {scanMode === 'list' ? 'Scan Shopping List' : 'Scan Barcode'}
                </Text>
                <Text style={styles.modeDescription}>
                  {scanMode === 'list' 
                    ? 'Point camera at a written shopping list' 
                    : 'Align barcode within the frame'
                  }
                </Text>
              </View>
              
              {scanMode === 'barcode' && (
                <View style={styles.barcodeFrame}>
                  <View style={styles.barcodeFrameCorner} />
                  <View style={[styles.barcodeFrameCorner, styles.topRight]} />
                  <View style={[styles.barcodeFrameCorner, styles.bottomLeft]} />
                  <View style={[styles.barcodeFrameCorner, styles.bottomRight]} />
                </View>
              )}
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <TouchableOpacity 
                style={styles.imagePickerButton} 
                onPress={pickImage}
                disabled={isProcessing}
              >
                <Ionicons name="images" size={24} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.barcodeToggleButton, scanMode === 'barcode' && styles.barcodeToggleButtonActive]} 
                onPress={() => setScanMode(scanMode === 'list' ? 'barcode' : 'list')}
              >
                <Ionicons 
                  name="barcode" 
                  size={28} 
                  color={scanMode === 'barcode' ? colors.primary : colors.textPrimary} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>

      {/* Name Input Modal */}
      <NameInputModal
        visible={showNameModal}
        onClose={handleNameCancel}
        onConfirm={handleNameConfirm}
        title="Name Your List"
        description={`Give your scanned list a memorable name. We found ${pendingScanResult?.items.length || 0} items to add.`}
        placeholder="Enter list name"
        defaultValue={`My List - ${new Date().toLocaleDateString()}`}
        confirmText="Create"
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        onAction={handleViewList}
        title="List Created"
        message={`Created "${successData?.listName}" with ${successData?.itemCount || 0} items!`}
        actionText="VIEW LIST"
      />

      {/* Product Added Modal */}
      <SuccessModal
        visible={showProductAddedModal}
        onClose={() => setShowProductAddedModal(false)}
        title="Product Added!"
        message={productAddedMessage}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cameraContainer: {
    flex: 1,
    margin: spacing.lg,
    marginBottom: 160, // Extra space to avoid tab bar overlap
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    zIndex: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modeIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modeText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  modeDescription: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  barcodeFrame: {
    width: 250,
    height: 100,
    position: 'relative',
  },
  barcodeFrameCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.primary,
    borderWidth: 3,
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    top: 'auto',
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    position: 'relative',
  },
  imagePickerButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    position: 'absolute',
    left: spacing.xl,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
  barcodeToggleButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    position: 'absolute',
    right: spacing.xl,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeToggleButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  permissionButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});