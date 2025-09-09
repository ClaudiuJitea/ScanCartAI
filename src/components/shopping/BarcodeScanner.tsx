import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Vibration,
  Image,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../utils/constants';
import { openFoodFactsService, ProcessedProduct } from '../../services/openFoodFactsService';
import { openRouterService } from '../../services/openRouterService';
import { Button } from '../common/Button';

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onProductScanned: (product: ProcessedProduct) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  visible,
  onClose,
  onProductScanned,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'torch'>('off');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');

  useEffect(() => {
    if (visible && !permission) {
      requestPermission();
      setScanned(false); // Reset scanned state when scanner becomes visible
    }
  }, [visible, permission, requestPermission]);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || isLoading) return;

    setScanned(true);
    setIsLoading(true);
    
    // Vibrate to indicate scan
    Vibration.vibrate(100);

    try {
      // Fetch product information from Open Food Facts
      const product = await openFoodFactsService.getProductByBarcode(data);
      
      if (product.isValid) {
        onProductScanned(product);
        onClose();
      } else {
        Alert.alert(
          'Product Not Found',
          `No product information found for barcode: ${data}.\n\nYou can still add this item manually to your list.`,
          [
            {
              text: 'Add Manually',
              onPress: () => {
                // Create a basic product for manual entry
                const manualProduct: ProcessedProduct = {
                  barcode: data,
                  name: `Product ${data}`,
                  category: 'other',
                  isValid: false,
                };
                onProductScanned(manualProduct);
                onClose();
              },
            },
            {
              text: 'Try Again',
              onPress: () => {
                setScanned(false);
                setIsLoading(false);
              },
            },
          ]
        );
        return;
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      Alert.alert(
        'Error',
        'Failed to fetch product information. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setIsLoading(false);
            },
          },
          {
            text: 'Cancel',
            onPress: onClose,
          },
        ]
      );
    }
    
    setIsLoading(false);
  };

  const toggleFlash = () => {
    setFlashMode(current => (current === 'off' ? 'torch' : 'off'));
  };

  const resetScanner = () => {
    setScanned(false);
    setIsLoading(false);
  };

  const pickImageAndScan = async () => {
    try {
      // Request permission to access photo library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to photos to scan barcode images.');
        return;
      }

      setIsLoading(true);

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: true, // We need base64 for AI processing
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const imageBase64 = result.assets[0].base64;

        if (imageBase64) {
          try {
            // Use AI to scan barcode from image
            const barcodeResult = await openRouterService.scanBarcodeFromImage(imageBase64);
            
            if (barcodeResult.barcode && barcodeResult.confidence > 0.6) {
              // AI successfully detected barcode!
              setIsLoading(false);
              await handleBarCodeScanned({ type: 'ai-detected', data: barcodeResult.barcode });
              return;
            } else {
              console.log('AI barcode detection failed or low confidence:', barcodeResult);
            }
          } catch (aiError) {
            console.log('AI barcode scanning failed:', aiError);
          }
        }

        // Fallback to manual entry if AI detection fails
        setSelectedImageUri(imageUri);
        setManualBarcode('');
        setShowImageModal(true);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setIsLoading(false);
      Alert.alert(
        'Error',
        'Failed to select image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleManualBarcodeSubmit = async () => {
    if (manualBarcode.trim()) {
      setShowImageModal(false);
      setSelectedImageUri(null);
      setManualBarcode('');
      await handleBarCodeScanned({ type: 'manual', data: manualBarcode.trim() });
    }
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImageUri(null);
    setManualBarcode('');
  };

  if (!visible) return null;

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan barcodes and add products to your list.
          </Text>
          <Button
            title="Request Permission"
            onPress={requestPermission}
            style={styles.permissionButton}
          />
          <Button
            title="Cancel"
            onPress={onClose}
            variant="secondary"
            style={styles.cancelButton}
          />
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
            <Ionicons
              name={flashMode === 'torch' ? 'flash' : 'flash-off'}
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Scanner */}
        <View style={styles.scannerContainer}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            style={styles.scanner}
            flash={flashMode}
          />
          
          {/* Scanner Overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanInstruction}>
                {isLoading ? 'Looking up product...' : 'Align barcode within the frame'}
              </Text>
            </View>
          </View>

          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Fetching product info...</Text>
            </View>
          )}
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <View style={styles.buttonContainer}>
            {scanned && !isLoading && (
              <Button
                title="Scan Another"
                onPress={resetScanner}
                style={styles.scanAgainButton}
              />
            )}
            <Button
              title="Pick Image"
              onPress={pickImageAndScan}
              disabled={isLoading}
              variant="secondary"
              style={styles.imagePickerButton}
              leftIcon={<Ionicons name="images-outline" size={20} color={colors.textSecondary} />}
            />
          </View>
          <Text style={styles.helpText}>
            Point your camera at a product barcode or pick an image for AI-powered automatic scanning
          </Text>
        </View>
      </View>

      {/* Image Modal for Manual Barcode Entry */}
      <Modal visible={showImageModal} animationType="slide">
        <View style={styles.imageModalContainer}>
          <View style={styles.imageModalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={closeImageModal}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.imageModalTitle}>Enter Barcode</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.imageModalContent}>
            {selectedImageUri && (
              <Image source={{ uri: selectedImageUri }} style={styles.selectedImage} resizeMode="contain" />
            )}
            
            <Text style={styles.instructionText}>
              Type the numbers you see below the barcode lines (usually 13 digits for products):
            </Text>

            <TextInput
              style={styles.barcodeInput}
              placeholder="Enter barcode number..."
              placeholderTextColor={colors.textMuted}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="numeric"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleManualBarcodeSubmit}
            />

            <View style={styles.imageModalButtons}>
              <Button
                title="Cancel"
                onPress={closeImageModal}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Add Product"
                onPress={handleManualBarcodeSubmit}
                disabled={!manualBarcode.trim()}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: 60, // Safe area top
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  flashButton: {
    padding: spacing.xs,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    backgroundColor: 'transparent',
    marginBottom: spacing.lg,
  },
  scanInstruction: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  bottomControls: {
    padding: spacing.lg,
    paddingBottom: 100, // Extra space for safe area
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  scanAgainButton: {
    minWidth: 120,
  },
  imagePickerButton: {
    minWidth: 120,
  },
  helpText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
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
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  permissionButton: {
    marginBottom: spacing.md,
    minWidth: 200,
  },
  cancelButton: {
    minWidth: 200,
  },
  // Image Modal Styles
  imageModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: 60, // Safe area top
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  imageModalTitle: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  imageModalContent: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 300,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  instructionText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  barcodeInput: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});