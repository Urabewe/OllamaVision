<a href="https://www.buymeacoffee.com/urabewe"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=urabewe&button_colour=5F7FFF&font_colour=ffffff&font_family=Bree&outline_colour=000000&coffee_colour=FFDD00" /></a>

# OllamaVision
> An AI-powered image analysis extension for SwarmUI that generates detailed image descriptions for your prompts. Options to use local LLM with Ollama, OpenAI API, or OpenRouter API.

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
  - [Image Fusion](#-image-fusion)
  - [Object + Subject Fusion](#-object--subject-fusion)
  - [Story Time](#-story-time)
  - [Character Creator](#-character-creator)
- [Example Outputs](#-example-outputs)
  - [Color Palette Analysis](#-color-palette-analysis)
  - [Facial Features Analysis](#-facial-features-analysis)
- [Planned Features](#-planned-features)
- [Acknowledgments](#-acknowledgments)

## 🌟 Features
- Multiple backend options:
  - Local LLM with Ollama (including remote Ollama installations)
  - OpenAI API integration
  - OpenRouter API support
- Advanced model settings:
  - Ollama: temperature, top_p, top_k, max_tokens, repeat_penalty, seed
  - OpenAI: temperature, max_tokens, top_p, frequency_penalty, presence_penalty
  - OpenRouter: temperature, max_tokens, top_p, frequency_penalty, presence_penalty, repetition_penalty, top_k, min_p, top_a, seed
- Multiple preset User Prompts (Artistic Style, Facial Features, Color Palette, etc.)
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
- Remote Ollama server connection support
- Image compression option to prevent memory issues
- Analysis history with thumbnails and parameter reuse
- Enhanced error handling with helpful troubleshooting suggestions

## 📋 Prerequisites

### First and foremost:
- ### Make sure you have [SwarmUI](https://github.com/mcmonkeyprojects/SwarmUI) installed and setup on your system. 

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
4. Click **"Connect"** to establish connection

### 🎯 Setup & Configuration
1. Select your preferred vision model from the dropdown list
2. Configure model settings (optional):
   - Adjust temperature for creativity level
   - Fine-tune Top P and Top K for response diversity
   - Set maximum tokens for response length
   - Adjust repeat penalty to prevent repetition
   - Set custom seed for reproducible results
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
- If you're using local LLM ensure Ollama is running BEFORE trying connect
- Larger images may take longer to process use compression if running into memory errors
- Custom presets are saved between sessions
- You can edit descriptions before generating images directly in the Analysis Results text area
- For best results in LLM toys keep MAXTOKENS at -1 (set by default)

## 🎮 LLM Toys Guide

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
- Export characters to text files
- Creates an AI image prompt to create a profile picture for your character

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

## 🔮 Planned Features
- Batch image processing

## 🙏 Acknowledgments
- [mcmonkey](https://github.com/mcmonkeyprojects) for making OllamaVision official and for giving us SwarmUI
- [SouthbayJay](https://civitai.com/user/SouthbayJay) for testing and feedback and all the late nights!
