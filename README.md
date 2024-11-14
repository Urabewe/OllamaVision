# OllamaVision
> An AI-powered image analysis extension for SwarmUI that generates detailed image descriptions for your prompts.

## Table of Contents
- [🌟 Features](#-features)
- [📋 Prerequisites](#-prerequisites)
- [🛠️ Installation](#️-installation)
- [💡 Usage Guide](#-usage-guide)
  - [🚀 Getting Started](#-getting-started)
  - [🎯 Setup & Configuration](#-setup--configuration)
  - [📸 Image Analysis](#-image-analysis)
  - [🎨 Using the Results](#-using-the-results)
  - [🔑 Quick Tips](#-quick-tips)
- [🎯 Example Outputs](#-example-outputs)
  - [🌈 Color Palette Analysis](#-color-palette-analysis)
  - [👤 Facial Features Analysis](#-facial-features-analysis)
- [🔮 Planned Features](#-planned-features)
- [🙏 Acknowledgments](#-acknowledgments)

![logo](https://github.com/user-attachments/assets/a39b87b2-e396-4cca-bae8-29041826d7e3)

## 🌟 Features
- One-click connection to Ollama
- Multiple preset analysis modes (Artistic Style, Facial Features, Color Palette, etc.)
- Send to prompt after generation
- Zero impact on VRAM when not in use
- Create and save custom response types
- Image paste/upload support


## 📋 Prerequisites
- [SwarmUI](https://github.com/mcmonkeyprojects/SwarmUI)
- [Ollama](https://ollama.com/) with a vision model installed


## 🛠️ Installation
1. Install [Ollama](https://ollama.com/)
2. Install a vision model (recommended: [benzie/llava-phi-3](https://ollama.com/benzie/llava-phi-3) or [MoondreamV2](https://ollama.com/library/moondream))
3. Install the extension in SwarmUI. Open SwarmUI, go to the Extensions tab, look for OllamaVision, and install.
4. Connect and start analyzing!


## 💡 Usage Guide

### 🚀 Getting Started
1. Open SwarmUI and navigate to the **"Utilities"** tab
2. Click the **"OllamaVision"** tab that appears
3. Click **"Connect to Ollama"** in the upper right corner to establish connection

### 🎯 Setup & Configuration
1. Select your preferred vision model from the dropdown list
2. Choose your response type:
   - Use the default preset
   - Select from included presets
   - Click **"Configure Response Type"** to:
     - Create and savecustom presets
     - Reorder your presets
   

### 📸 Image Analysis
1. Load your image:
   - **Quick Paste**: Click paste button + `CTRL+V`
   - **File Upload**: Click upload button to select local file
2. Image preview will appear
3. Click **"Analyze Image"** to begin processing
   > ⚠️ Processing time varies based on your setup. If no error appears, analysis is in progress.


### 🎨 Using the Results
1. Once analysis completes, click **"Send to Prompt"**
2. The AI-generated description will appear in the Generate tab
3. Use the description as-is or customize it for your needs


### 🔑 Quick Tips
- Ensure Ollama is running before connecting
- Larger images may take longer to process
- Custom presets are saved between sessions
- You can edit descriptions before generating images

That's it! Connect → Choose Model → Select Response Type → Load Image → Analyze. Simple yet powerful.


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
- Auto clipboard paste
- Style combination analysis
- OpenAI Support with API Key (SOON!)

## 🙏 Acknowledgments
- [mcmonkey](https://github.com/mcmonkeyprojects) for making OllamaVision official and for giving us SwarmUI
- [SouthbayJay](https://civitai.com/user/SouthbayJay) for testing and feedback and all the late nights!
