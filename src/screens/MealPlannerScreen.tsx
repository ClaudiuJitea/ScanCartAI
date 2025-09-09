import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius } from '../utils/constants';
import { useShoppingList } from '../hooks/useShoppingList';
import { openRouterService } from '../services/openRouterService';
import { SuccessModal } from '../components/common';

export const MealPlannerScreen: React.FC = () => {
  const [dishName, setDishName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [showFullCamera, setShowFullCamera] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [showDishRecognizedModal, setShowDishRecognizedModal] = useState(false);
  const [recognizedDishName, setRecognizedDishName] = useState('');
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { addList, addItemToList } = useShoppingList();

  const generateIngredientsList = async () => {
    if (!dishName.trim()) {
      Alert.alert('Error', 'Please enter a dish name');
      return;
    }

    setIsLoading(true);
    
    try {
      const prompt = `Generate a detailed shopping list for cooking "${dishName.trim()}". 
      Return ONLY a JSON array of ingredients with the following format:
      [{"name": "ingredient name", "quantity": number, "unit": "unit"}]
      
      Be specific with quantities and use standard units (g, kg, ml, L, pcs, etc.).
      Include all necessary ingredients but be practical for home cooking.`;

      const response = await openRouterService.generateText(prompt);
      
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not parse ingredients list');
      }

      const ingredients = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        throw new Error('No ingredients found');
      }

      // Create new shopping list as meal plan
      const newListId = await addList(dishName.trim(), true);
      
      // Add ingredients to the list
      for (const ingredient of ingredients) {
        await addItemToList(newListId, {
          name: ingredient.name,
          category: 'other',
          quantity: ingredient.quantity || 1,
          unit: ingredient.unit || 'pcs',
          isCompleted: false,
        });
      }

      setSuccessMessage(`Created shopping list "${dishName.trim()}" with ${ingredients.length} ingredients`);
      setDishName('');
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error generating meal plan:', error);
      Alert.alert('Error', 'Failed to generate ingredient list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraPress = async () => {
    if (!permission) {
      await requestPermission();
      return;
    }
    
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to take photos of dishes');
      return;
    }

    setShowFullCamera(true);
  };

  const takePictureFromCamera = async () => {
    if (!cameraRef.current || isAnalyzingImage) return;

    try {
      setIsAnalyzingImage(true);
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
        skipProcessing: false, // Keep processing for better quality
      });

      if (photo?.base64) {
        setShowFullCamera(false);
        await analyzeDishFromImage(photo.base64);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const pickFromLibrary = async () => {
    try {
      setShowFullCamera(false);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to photos to use this feature.');
        return;
      }

      setIsAnalyzingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Skip cropping
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        await analyzeDishFromImage(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashMode(current => (current === 'off' ? 'on' : 'off'));
  };

  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      // Use fetch to get the image and convert to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove the data URL prefix to get just the base64 data
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  const analyzeDishFromImage = async (imageBase64: string) => {
    try {
      // Analyze the image to identify the dish
      const dishName = await openRouterService.analyzeDishFromImage(imageBase64);
      
      if (dishName && dishName !== 'Unknown Dish') {
        // Set the recognized dish name in the input
        setDishName(dishName);
        setRecognizedDishName(dishName);
        setShowDishRecognizedModal(true);
      } else {
        Alert.alert(
          'Dish Recognition',
          'I couldn\'t clearly identify this dish. Please enter the dish name manually.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      let errorMessage = 'Failed to analyze image. Please enter the dish name manually.';
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = 'Please set your OpenRouter API key in settings first.';
        } else if (error.message.includes('OpenRouter API error')) {
          errorMessage = 'AI service error. Please check your API key and try again.';
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍽️ Meal Planner</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.mainSection}>
          <Text style={styles.title}>What dish would you like to prepare?</Text>
          <Text style={styles.subtitle}>
            Enter any dish name and we'll create a shopping list with all the ingredients you need
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Pizza, Tacos, Pasta..."
              value={dishName}
              onChangeText={setDishName}
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.cameraButton} onPress={handleCameraPress}>
              {isAnalyzingImage ? (
                <ActivityIndicator size="small" color={colors.textMuted} />
              ) : (
                <Ionicons name="camera" size={24} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.generateButton, (!dishName.trim() || isLoading) && styles.generateButtonDisabled]}
            onPress={generateIngredientsList}
            disabled={!dishName.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <Ionicons name="sparkles" size={20} color={colors.textPrimary} />
            )}
            <Text style={styles.generateButtonText}>
              {isLoading ? 'Generating...' : 'Generate Shopping List'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>


      {/* Full Camera Modal */}
      <Modal
        visible={showFullCamera}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowFullCamera(false)}
      >
        <View style={styles.fullCameraContainer}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          
          {permission?.granted && (
            <CameraView
              style={styles.fullCamera}
              facing={cameraType}
              ref={cameraRef}
              flash={flashMode}
            >
              <SafeAreaView style={styles.cameraOverlay}>
                {/* Top Controls */}
                <View style={styles.cameraTopControls}>
                  <TouchableOpacity 
                    style={styles.newCameraButton} 
                    onPress={() => setShowFullCamera(false)}
                  >
                    <Ionicons name="close" size={28} color="white" />
                  </TouchableOpacity>
                  
                  <View style={styles.cameraTopRightControls}>
                    <TouchableOpacity style={styles.newCameraButton} onPress={toggleFlash}>
                      <Ionicons 
                        name={flashMode === 'on' ? 'flash' : 'flash-off'} 
                        size={26} 
                        color="white"
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.newCameraButton} onPress={toggleCameraType}>
                      <Ionicons name="camera-reverse" size={26} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Center instruction */}
                <View style={styles.cameraScanArea}>
                  <View style={styles.cameraInstruction}>
                    <Text style={styles.cameraInstructionText}>Take Photo of Dish</Text>
                    <Text style={styles.cameraInstructionSubtext}>
                      Point camera at your dish for AI recognition
                    </Text>
                  </View>
                </View>

                {/* Bottom Controls */}
                <View style={styles.cameraBottomControls}>
                  <TouchableOpacity 
                    style={styles.cameraLibraryButton} 
                    onPress={pickFromLibrary}
                    disabled={isAnalyzingImage}
                  >
                    <Ionicons name="images" size={24} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cameraShutterButton, isAnalyzingImage && styles.cameraShutterButtonDisabled]}
                    onPress={takePictureFromCamera}
                    disabled={isAnalyzingImage}
                  >
                    {isAnalyzingImage ? (
                      <ActivityIndicator color={colors.textPrimary} size="small" />
                    ) : (
                      <View style={styles.cameraShutterButtonInner} />
                    )}
                  </TouchableOpacity>

                  <View style={styles.cameraSpaceholder} />
                </View>
              </SafeAreaView>
            </CameraView>
          )}
        </View>
      </Modal>

      {/* Dish Recognition Modal */}
      <Modal
        visible={showDishRecognizedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDishRecognizedModal(false)}
      >
        <View style={styles.dishModalOverlay}>
          <View style={styles.dishModal}>
            <View style={styles.dishModalHeader}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              <Text style={styles.dishModalTitle}>Dish Recognized!</Text>
            </View>
            
            <Text style={styles.dishModalMessage}>
              I think this is: "<Text style={styles.dishModalDishName}>{recognizedDishName}</Text>"
            </Text>
            
            <Text style={styles.dishModalSubMessage}>
              You can edit the name if needed, then generate the shopping list.
            </Text>
            
            <TouchableOpacity 
              style={styles.dishModalButton}
              onPress={() => setShowDishRecognizedModal(false)}
            >
              <Text style={styles.dishModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success!"
        message={successMessage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 70,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  mainSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 36,
    paddingHorizontal: spacing.md,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 24,
    marginBottom: spacing.xxl,
    maxWidth: 320,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
    width: '100%',
    maxWidth: 350,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  textInput: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 16,
    flex: 1,
    paddingRight: spacing.sm,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  cameraButton: {
    padding: spacing.xs,
  },
  generateButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    width: '100%',
    maxWidth: 400,
  },
  generateButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  // Full Camera Styles
  fullCameraContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullCamera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraTopControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md, // Minimal padding since SafeAreaView handles safe area
    paddingBottom: spacing.lg,
  },
  cameraTopRightControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cameraControlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.md,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCameraButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
  },
  cameraScanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  cameraInstruction: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cameraInstructionText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  cameraInstructionSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  cameraBottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg, // Reduced padding to move shutter button higher
    paddingBottom: spacing.xxl, // More bottom padding for better positioning
  },
  cameraLibraryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraSpaceholder: {
    width: 56,
    height: 56,
  },
  cameraShutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraShutterButtonDisabled: {
    opacity: 0.5,
  },
  cameraShutterButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
  // Dish Recognition Modal Styles
  dishModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    margin: spacing.lg,
    minWidth: 300,
    maxWidth: '90%',
    alignItems: 'center',
  },
  dishModalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dishModalTitle: {
    ...typography.h2,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  dishModalMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  dishModalDishName: {
    color: colors.primary,
    fontWeight: '600',
  },
  dishModalSubMessage: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  dishModalButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minWidth: 100,
    alignItems: 'center',
  },
  dishModalButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});