 
<a href="https://www.buymeacoffee.com/urabewe"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=urabewe&button_colour=5F7FFF&font_colour=ffffff&font_family=Bree&outline_colour=000000&coffee_colour=FFDD00" /></a>

# OllamaVision
> An AI-powered image analysis extension for SwarmUI that generates detailed image descriptions for your prompts. Options to use local LLM with Ollama or your OpenAI API key.

![logo](https://github.com/user-attachments/assets/a39b87b2-e396-4cca-bae8-29041826d7e3)

## 🌟 Features
- One-click connection to Ollama and OpenAI with your OpenAi key
- Multiple preset analysis modes (Artistic Style, Facial Features, Color Palette, etc.)
- Direct-to-prompt generation
- Zero impact on VRAM when not in use (when using unload model setting)
- Custom preset support
- Image paste/upload support


## 📋 Prerequisites for use with Ollama
- [Ollama](https://ollama.com/) with a [vision model](https://ollama.com/search?c=vision) installed. Go to their website with the link provided and follow install instructions there.


## 🛠️ Installation
1. Follow the [Prerequisites](https://github.com/Urabewe/OllamaVision/blob/main/README.md#-prerequisites) section if you plan on using Ollama.
2. Open SwarmUI
3. Click on **"Server"** at the top of the page.
4. Click on **"Extensions"**
5. Find **"OllamaVision"** in the list of available extensions
6. Click the **"Install"** button
7. A message will appear and click on **"Restart Now"**
8. SwarmUI will restart and OllamaVision will be installed into the Utilitites tab.


## 💡 Usage Guide

### 🚀 Getting Started
1. Open SwarmUI and navigate to the **"Utilities"** tab
2. Click the **"OllamaVision"** tab that appears
3. Click **"Connect to Ollama"** or **"Connect to OpenAI"** in the upper right corner to establish connection

### 🎯 Setup & Configuration
1. Select your preferred vision model from the dropdown list
2. Choose your response type:
   - Use the default preset
   - Select from included presets
   - Click **"Configure Response Type"** to:
     - Create and save custom presets
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
- If you're using local LLM ensure Ollama is running BEFORE trying connect
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
- Send image to OllamaVision button
- Style combination analysis

  
## 🙏 Acknowledgments
- [mcmonkey](https://github.com/mcmonkeyprojects) for making OllamaVision official and for giving us SwarmUI
- [SouthbayJay](https://civitai.com/user/SouthbayJay) for testing and feedback and all the late nights!
