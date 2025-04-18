<a href="https://www.buymeacoffee.com/urabewe"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=urabewe&button_colour=5F7FFF&font_colour=ffffff&font_family=Bree&outline_colour=000000&coffee_colour=FFDD00" /></a>

# OllamaVision
> An AI-powered image analysis extension for SwarmUI that generates detailed image descriptions for your prompts. Options to use local LLM with Ollama and OobaBooga WebUI. Also supports OpenAI API, OpenRouter API.

![logo](https://github.com/user-attachments/assets/a39b87b2-e396-4cca-bae8-29041826d7e3)

## 🌟 Table of Contents
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#️-installation)
- [Usage Guide](#-usage-guide)
  - [Getting Started](#-getting-started)
  - [Setup & Configuration](#-setup--configuration)
  - [Image Analysis](#-image-analysis)
  - [Using the Results](#-using-the-results)
  - [Quick Tips](#-quick-tips)
- [LLM Toys Guide](#-llm-toys-guide)
  - [Batch Captioning](#-batch-captioning)
  - [Image Fusion](#-image-fusion)
  - [Object + Subject Fusion](#-object--subject-fusion)
  - [Story Time](#-story-time)
  - [Character Creator](#-character-creator)
- [Example Outputs](#-example-outputs)
  - [Color Palette Analysis](#-color-palette-analysis)
  - [Facial Features Analysis](#-facial-features-analysis)
- [Acknowledgments](#-acknowledgments)

## 🌟 Features
- Multiple backend options:
  - Local LLM with Ollama (including remote Ollama installations)
  - OpenAI API integration
  - OpenRouter API support
  - OobaBooga WebUI support with vision models
- Advanced model settings:
  - Ollama: temperature, top_p, top_k, max_tokens, repeat_penalty, seed
  - OpenAI: temperature, max_tokens, top_p, frequency_penalty, presence_penalty
  - OpenRouter: temperature, max_tokens, top_p, frequency_penalty, presence_penalty, repetition_penalty, top_k, min_p, top_a, seed
  - OobaBooga: Model settings are configured through OobaBooga's WebUI interface
- Multiple preset User Prompts (Artistic Style, Facial Features, Color Palette, etc.)
- Batch Captioning for Lora dataset preparation (generate captions for multiple images in a folder)
- Creative LLM Toys:
  - **Image Fusion**: Combine separate analyses of style, subject, and setting into cohesive prompts
  - **Object + Subject Fusion**: Transform objects with character designs and create unique combinations
  - **Story Time**: Transform images into detailed narratives with beginning, middle, and end
  - **Character Creator**: Generate detailed character profiles for stories, games, or roleplay
- System Prompt support for all backends to customize model behavior
- Prompt Prepending for adding instructions in the front of all requests
- Custom preset support with reordering capability
- Direct-to-prompt generation
- Zero impact on VRAM when not in use (when using unload model setting)
- Image paste/upload support
- Image Drag and drop support
- Remote server connection support (Ollama and OobaBooga)
- Image compression option to prevent memory issues
- Analysis history with thumbnails and parameter reuse
- Enhanced error handling with helpful troubleshooting suggestions

## 📋 Prerequisites

### First and foremost:
- ### Make sure you have [SwarmUI](https://swarmui.net/) installed and setup on your system. 

### For Ollama:
- [Ollama](https://ollama.com/) with a [vision model](https://ollama.com/search?c=vision) installed
- For remote connections:
  - Ollama server must be accessible on your network
  - Port 11434 must be open on the server
  - Server must be properly configured for remote access

### For OpenAI:
- Valid OpenAI API key with access to vision models. Sign up and create an API key here: [OpenAI](https://openai.com/)

### For OpenRouter:
- Valid OpenRouter API key. Sign up and create an API key here: [OpenRouter](https://openrouter.ai/)
- Optional: Custom site name for API requests

### For OobaBooga:
- [OobaBooga Text Generation WebUI](https://github.com/OobaBooga/text-generation-webui) must be installed and set up
- The OpenAI extension must be enabled in OobaBooga's WebUI
- Vision models must be installed and configured in OobaBooga
- Default port is 5000 (can be configured)
- For remote connections:
  - OobaBooga server must be accessible on your network
  - Port 5000 (or your configured port) must be open
  - Server must be properly configured for remote access

## 🛠️ Installation
1. Follow the [Prerequisites](https://github.com/Urabewe/OllamaVision/blob/main/README.md#-prerequisites) section for your chosen backend
2. Open SwarmUI
3. Click on **"Server"** at the top of the page
4. Click on **"Extensions"**
5. Find **"OllamaVision"** in the list of available extensions
6. Click the **"Install"** button
7. A message will appear and click on **"Restart Now"**
8. SwarmUI will restart and OllamaVision will be installed into the Utilities tab

## 💡 Usage Guide

### 🚀 Getting Started
1. Open SwarmUI and navigate to the **"Utilities"** tab
2. Click the **"OllamaVision"** tab
3. Click the settings button to configure your preferred backend:
   - Ollama (local or remote)
   - OpenAI
   - OpenRouter
   - OobaBooga WebUI
4. Click **"Connect"** to establish connection

### 🎯 Setup & Configuration
1. Select your preferred vision model from the dropdown list
2. Configure model settings (optional):
   - For Ollama, OpenAI, and OpenRouter: Adjust settings in OllamaVision interface
   - For OobaBooga: Configure model settings in OobaBooga's WebUI interface
3. Choose your User Prompt:
   - Use the default preset
   - Select from included presets
   - Create and manage custom presets

### 📸 Image Analysis
1. Load your image:
   - **Quick Paste**: Click paste button + `CTRL+V`
   - **File Upload**: Click upload button to select local file
   - **Drag and Drop**: Drag and Drop your image directly into the preview area.
2. Image preview will appear
3. Click **"Analyze Image"** to begin processing
   > ⚠️ Processing time varies based on your setup. If no error appears, analysis is in progress.

### 🎨 Using the Results
1. Once analysis completes, click **"Send to Prompt"**
2. The AI-generated description will appear in the Generate tab
3. Use the description as-is or customize it for your needs directly inside OllamaVision

### 🔑 Quick Tips
- If you're using local LLM ensure Ollama or OobaBooga is running BEFORE trying connect
- For OobaBooga:
  - Make sure the OpenAI extension is enabled in OobaBooga's WebUI
  - Model settings are managed through OobaBooga's interface
  - Default URL is http://localhost:5000
  - Models will be automatically listed when connecting
  - Selected models will load automatically when chosen from the dropdown
- Larger images may take longer to process use compression if running into memory errors
- Custom presets are saved between sessions
- You can edit descriptions before generating images directly in the Analysis Results text area
- For best results in LLM toys keep MAXTOKENS at -1 (set by default)

## 🎮 LLM Toys Guide

#### 📊 Batch Captioning
> **⚠️ Note: This feature is experimental**

Create captions for multiple images at once - perfect for training Lora models:

1. Click the **"Batch Caption"** button in the LLM Toys section
2. Select a folder containing your images (supported formats: jpg, jpeg, png, webp, bmp)
3. Choose your caption style:
   - **Lora Type**: Select between Style or Character Lora
   - **Caption Format**: Choose Danbooru Tags or Natural Language descriptions
   - For Style Loras, Natural Language typically works better
   - For Character Loras, Danbooru Tags can be more effective
4. Optionally add a trigger word that will be included in all captions
5. Click **"Start Captioning"**
6. The tool will process all images and create a corresponding .txt file with the same name as each image
7. Images that already have caption files will be skipped
8. View results in the table that shows success/error status for each image

This feature is designed to quickly prepare datasets for Lora training by leveraging vision models to automate the captioning process.

#### 🎨 Image Fusion
1. Load your images using paste, upload, or drag & drop
2. Analyze each image separately
3. Edit the descriptions to your liking
4. Click **"Combine Analyses"** to create a single prompt
5. Edit the prompt to your liking
6. Click **"Send to Prompt"** to generate an image
7. Perfect for creating rich, multi-layered image generation prompts

#### 🔄 Object + Subject Fusion
1. Click the "Fusion" button
2. Select "Object + Subject" mode
3. Load your object image (paste, upload, or drag & drop)
4. Analyze and edit result as needed
5. Load your subject image
6. Analyze and edit result as needed
7. Click "Combine" to generate fusion prompt
8. Edit final prompt if desired
9. Click "Send to Prompt" to generate

Perfect for:
- Creating custom designs on products (t-shirts, mugs, skateboards)
- Transforming furniture into character-themed pieces
- Designing custom figurines, sculptures, or plush toys

#### 🎭 Character Creator
Create detailed characters with customizable attributes:
- Name, Sex, Species, Setting, Alignment, Class/Role
- Editable input fields for custom characters
- Editable response field to edit character before saving
- Smart controls with field locking and randomization
- Detailed output including personality, physical description, abilities, and backstory
- Multiple saving options:
  - Save Character (Text): Simple text file of character description
  - Save Character Image: PNG with embedded SillyTavern card data
  - Export to SillyTavern: Direct export in JSON format
- Creates an AI image prompt to create a profile picture for your character
- An "Export Prompt" button that will extract the image prompt from the results and send it to the generation page for instant generation of your new character

**Creating SillyTavern-Ready Character Cards:**
1. Open Character Creator
2. Choose your desired options (Species, Alignment, Role, etc.)
3. Generate your character description
4. Send the prompt to the Generate tab
5. Generate your character's image
6. Return to Character Creator
7. Click "Save Character Image"
8. Load your generated image in the popup
9. Click Save
10. Your image will download with all character data embedded
11. Ready to import directly into SillyTavern!

NOTE: If your creations are getting cut off make sure MAXTOKENS is set to -1 (set by default)

#### 📚 Story Time
1. Load your image using paste, upload, or drag & drop
2. Click **"Tell me a story"**
3. Stories are displayed in a wide-format reading area for comfort
4. For best results ensure MAXTOKENS is set to -1 (set by default)


## 🎯 Example Outputs

Here's a showcase of OllamaVision's capabilities using different presets. Each example includes the source image, AI-generated description, and the final generated output.

### 🌈 Color Palette Analysis

<details>
<summary>View Example</summary>

#### Source Image
![Rainbow Umbrellas](https://github.com/user-attachments/assets/f70ea77f-6c72-42fb-8ba3-4c4b16e284f4)

#### AI-Generated Description
> This image features a vibrant array of rainbow-colored umbrellas suspended in the air, creating a visually stunning display against the backdrop of a clear blue sky. The color palette consists of:
> - Red
> - Orange
> - Yellow
> - Green
> - Blue
> - Purple
>
> Each umbrella is distinctly colored, with no discernible pattern. The umbrellas appear evenly spaced throughout the frame, creating a sense of harmony and balance within the composition.

#### Generated Result
![Generated Umbrellas](https://github.com/user-attachments/assets/0c8a872b-a584-4c5b-9102-d1aa15ae5747)
</details>

### 👤 Facial Features Analysis

<details>
<summary>View Example</summary>

#### Source Image
![Portrait](https://github.com/user-attachments/assets/c5949e86-a9ea-4e56-99fa-5de38fc64b84)

#### AI-Generated Description
> **Facial Characteristics:**
> - **Eyes:** Brown
> - **Eyebrows:** Thick and well-groomed
> - **Nose:** Straight and moderately sized
> - **Mouth:** Shaped like a smile with full teeth showing
> - **Chin:** Rounded in shape
> - **Skin tone:** Light brown
> - **Facial hair:** Well-groomed beard
> - **Hair color:** Brown
> - **Ears:** Small, located just below the jawline
> - **Distinguishing features:**
>   - Numerous freckles across face and neck
>   - 2 small moles under eyes

#### Generated Result
![Generated Portrait](https://github.com/user-attachments/assets/870048ff-8fb2-4b1b-9949-dfb190f495b1)
</details>

## 🙏 Acknowledgments
- [mcmonkey](https://github.com/mcmonkeyprojects) for making OllamaVision official and for giving us SwarmUI
- [SouthbayJay](https://civitai.com/user/SouthbayJay) for testing and feedback and all the late nights!
