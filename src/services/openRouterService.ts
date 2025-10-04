import * as SecureStore from 'expo-secure-store';
import { CATEGORIES } from '../utils/constants';

export interface ListItem {
  text: string;
  category?: string;
  quantity?: string;
}

export interface ScanResult {
  items: ListItem[];
  confidence: number;
}

export interface BarcodeResult {
  barcode: string | null;
  confidence: number;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  duration?: string;
  tips?: string;
}

export interface Recipe {
  title: string;
  description: string;
  servings: number;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  steps: RecipeStep[];
  tips?: string[];
  nutritionNotes?: string;
}

class OpenRouterService {
  private readonly API_BASE_URL = 'https://openrouter.ai/api/v1';

  private async getApiKey(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('openrouter_api_key');
    } catch (error) {
      console.error('Error retrieving API key:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, data: any) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenRouter API key not found. Please set your API key in settings.');
    }

    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'list-app',
        'X-Title': 'Shopping List App',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async scanListFromImage(imageBase64: string): Promise<ScanResult> {
    const categories = CATEGORIES.map(cat => cat.name).join(', ');
    
    const prompt = `Analyze this image of a shopping list or handwritten list. Extract all the items and return them as a JSON array.

For each item, try to:
1. Extract the item name/text
2. Identify the quantity if mentioned (like "2 apples", "1 lb chicken", "3x milk")
3. Categorize it into one of these categories: ${categories}

Return ONLY a JSON object with this exact structure:
{
  "items": [
    {
      "text": "item name",
      "quantity": "quantity if specified or null",
      "category": "best matching category from the list above"
    }
  ],
  "confidence": 0.8
}

Rules:
- If quantity is not specified, use null
- Always try to match items to the provided categories
- Use "Other" category if no good match exists
- Be accurate with spelling and item names
- Confidence should be between 0 and 1 based on image clarity
- Return valid JSON only, no other text`;

    try {
      const response = await this.makeRequest('/chat/completions', {
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI service');
      }

      // Try to extract JSON from the response
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from AI service');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!result.items || !Array.isArray(result.items)) {
        throw new Error('Invalid response structure from AI service');
      }

      // Ensure all items have required fields
      const validatedItems: ListItem[] = result.items.map((item: any) => ({
        text: String(item.text || '').trim(),
        quantity: item.quantity ? String(item.quantity).trim() : undefined,
        category: item.category || 'other',
      })).filter((item: ListItem) => item.text.length > 0);

      return {
        items: validatedItems,
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.8,
      };
    } catch (error) {
      console.error('Error scanning image:', error);
      throw error;
    }
  }

  async scanBarcodeFromImage(imageBase64: string): Promise<BarcodeResult> {
    const prompt = `Analyze this image and extract the barcode number. Look for:

1. Black and white vertical lines (the barcode itself)
2. Numbers printed below or above the barcode lines
3. Common barcode formats: EAN-13 (13 digits), EAN-8 (8 digits), UPC-A (12 digits), etc.

Return ONLY a JSON object with this exact structure:
{
  "barcode": "extracted number or null if not found",
  "confidence": 0.9
}

Rules:
- Extract only the numeric digits from the barcode
- Do not include any letters or special characters
- If you see multiple numbers, choose the main barcode number (usually the longest)
- Confidence should be between 0 and 1 based on image clarity and certainty
- Return valid JSON only, no other text
- If no barcode is visible, set barcode to null`;

    try {
      const response = await this.makeRequest('/chat/completions', {
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 200,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI service');
      }

      // Try to extract JSON from the response
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from AI service');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      return {
        barcode: result.barcode && typeof result.barcode === 'string' ? result.barcode.trim() : null,
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
      };
    } catch (error) {
      console.error('Error scanning barcode from image:', error);
      throw error;
    }
  }

  async analyzeDishFromImage(imageBase64: string): Promise<string> {
    const prompt = `Analyze this image of food/dish and identify what dish it is. 
    
    Look for:
    1. The main ingredients visible
    2. Cooking style/preparation method
    3. Presentation and plating
    4. Any recognizable cultural or regional characteristics
    
    Return ONLY the name of the dish in a simple, clear format (e.g., "Spaghetti Carbonara", "Chicken Curry", "Caesar Salad", "Beef Stir Fry").
    
    If you cannot clearly identify a specific dish:
    - Try to describe it as a general dish type (e.g., "Pasta with Cream Sauce", "Grilled Chicken with Vegetables")
    - If it's completely unclear, return "Unknown Dish"
    
    Do not include any explanation or additional text, just the dish name.`;

    try {
      const response = await this.makeRequest('/chat/completions', {
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 50,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI service');
      }

      // Clean up the response - just return the dish name
      return content.trim().replace(/['"]/g, '');
    } catch (error) {
      console.error('Error analyzing dish from image:', error);
      throw error;
    }
  }

  async generateRecipe(dishName: string): Promise<Recipe> {
    const prompt = `Generate a detailed recipe for "${dishName}". 
    
    Return ONLY a JSON object with this exact structure:
    {
      "title": "Recipe name",
      "description": "Brief description of the dish",
      "servings": 4,
      "prepTime": "15 mins",
      "cookTime": "30 mins",
      "totalTime": "45 mins",
      "difficulty": "Easy",
      "ingredients": [
        "ingredient with quantity and unit",
        "another ingredient"
      ],
      "steps": [
        {
          "stepNumber": 1,
          "instruction": "Detailed instruction for this step",
          "duration": "5 mins",
          "tips": "Optional tip for this step"
        }
      ],
      "tips": [
        "General cooking tip",
        "Storage or serving suggestion"
      ],
      "nutritionNotes": "Brief nutrition information"
    }
    
    Requirements:
    - Be specific with quantities and measurements
    - Include cooking times and temperatures where relevant
    - Make instructions clear and easy to follow
    - Add helpful tips for better results
    - Difficulty should be realistic (Easy/Medium/Hard)
    - Include 4-8 practical cooking steps
    - Return valid JSON only, no other text`;

    try {
      const response = await this.makeRequest('/chat/completions', {
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI service');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse recipe response');
      }

      const recipe = JSON.parse(jsonMatch[0]);
      
      // Validate recipe structure
      if (!recipe.title || !recipe.ingredients || !recipe.steps) {
        throw new Error('Invalid recipe format received');
      }

      // Ensure steps have step numbers
      recipe.steps = recipe.steps.map((step: any, index: number) => ({
        ...step,
        stepNumber: step.stepNumber || index + 1
      }));

      return recipe as Recipe;
    } catch (error) {
      console.error('Error generating recipe:', error);
      throw error;
    }
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const response = await this.makeRequest('/chat/completions', {
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI service');
      }

      return content;
    } catch (error) {
      console.error('Error generating text:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        return false;
      }

      // Make a simple test request
      await this.makeRequest('/chat/completions', {
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message. Please respond with "OK".'
          }
        ],
        max_tokens: 10,
      });
      
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const openRouterService = new OpenRouterService();