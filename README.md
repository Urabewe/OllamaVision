Thank you [SouthbayJay](https://civitai.com/user/SouthbayJay) for helping with testing, feedback, advice, and all the back and forth. Honestly sped this release up exponentially thanks to you. 


# OllamaVision
An extension for SwarmUI that allows you to connect to Ollama to use vision models for image analysis to create image prompts.

![OllamaVision](https://github.com/user-attachments/assets/d606f7ad-5523-4b40-b6d3-f98a88a2574a)



This extension is for [SwarmUI](https://github.com/mcmonkeyprojects/SwarmUI) a Web-UI frontend for ComfyUI. If you haven't already, go there and install now. If you're here I would imagine you already have it running.

This extension connects to [Ollama](https://ollama.com/) as a backend for image analysis. You will need to install this and download a LLAVA based Vision model such as llama3.2-vision. Ollama's website has a full, extensive library of models to choose from. I have been using [benzie/llava-phi-3](https://ollama.com/benzie/llava-phi-3) with a lot of success. I have reports of [MoondreamV2](https://ollama.com/library/moondream) working well also which is even smaller at 1.8b. Though I would suggest trying a few models based on your specs. For the use of this extension a 3B or smaller model will do just fine.

This is a BETA release. Some features have not been incorporated yet, some aren't fully built, some may never come to be. For now, this should be more than stable enough to get you some very nice image descriptions. Since this is a BETA please, leave any comments about issues, concerns, possible improvements, etc. Anything will help me further this project along. OTB right now, you're good to go. With memory offload even lowvram users can enjoy image description and image generation without having to spare ease of use.


# OllamaVision - An AI based image analysis extension for SwarmUI

![OllamaVision](https://github.com/user-attachments/assets/7b5db41a-0e32-4186-951c-822661cfe1a1)




This extension will add a new tab in SwarmUI under the "Utilities" section called "OllamaVision". Inside of this tab is a utility that will allow you to use Ollama and LLAVA Vision models to analyze images, give a brief description of that image, then allow you to send that output/description straight to the "Generate" tab to use/edit as a prompt for image generation. With it's ability to change prompt response types we can get a varied amount of information from a single image. With presets for "Artistic Style", "Facial Features", "Color Palette" and more we can gleam a lot of info to create wonderful images.

The extension is based around ease of use. Just click connect, choose your model, run with default prompt or another preset, upload/paste your image, then press analyze. That's it. The extension itself does not load any models it only sends and recieves data from Ollama so there is no extra overhead. There is also an option to unload models from memory so there is 0 impact on image generation. This is meant to be a lightweight frontend for Ollama vision models. 

# Prerequisites:

[Ollama](https://ollama.com/) MUST be installed and setup before this extension will work. This extension uses Ollama for all of it's heavy work and will not function without it. Follow that link to their website and download and install Ollama. Once you install Ollama you will need to follow their instructions to install a Llava Vision model. [benzie/llava-phi-3](https://ollama.com/benzie/llava-phi-3), [MoondreamV2](https://ollama.com/library/moondream) are two good places to start since they are smaller. You can also check out a larger model such as [llama3.2-vision](https://ollama.com/library/llama3.2-vision). Installing a model is pretty simple. Ollama has a library of models to choose from. Once Ollama is installed you just find the one you like, open a command prompt, and enter 'ollama pull "model name"' where model name is the name of the model you found on Ollama.com. 

You will also, obviously, need [SwarmUI](https://github.com/mcmonkeyprojects/SwarmUI) installed and running. This is an extension that adds functionality to the SwarmUI interface itself. Without SwarmUI this extension will not install and will not work.  Head over to the SwarmUI git page and follow the instructions for install if you haven't already. Easy as downloading the installer .bat file, run that installer and everything will be done for you. There are a few options to select but other than that it's an automatic setup.

# Installation:

These install instructions will change, OllamaVision will hopefully be a supported extension inside of SwarmUI itself. You'll be able to install and update OllamaVision right inside of SwarmUI.

PLEASE READ THE PREREQUISTE SECTION ABOVE BEFORE INSTALLING!!!!!
1. Open a command prompt to your /SwarmUI/src/Extensions folder.
2. Enter `git clone https://github.com/Urabewe/OllamaVision.git` and press enter
3. This will clone this repo to the Extensions folder for installation.
4. Go to /SwarmUI/ main directory and run "windows-update.bat" (NOTE: This is UNTESTED on anything Linux, if anyone can help with this let me know, please.) this will install the extension into SwarmUI
5. Launch SwarmUI and the extension will be installed and should be ready to use.

# Use:
1. Simple! Once installed and you're in SwarmUI go to the "Utilities" tab.
2. You should now see another tab named "OllamaVision", click on that. Welcome to OllamaVision!
3. In the upper right hand corner you will see "Connect to Ollama" click that and the extension will connect to your Ollama install.
4. It will automatically pull the available models from Ollama, choose one in the drop down list right below the connect button.
5. You use the Default response type or click "Configure Response Type" to select an included preset or to create and use your own. Presets can be customized and reordered.
6. Now, either click the paste button and use CTRL+V to paste your image or click the upload button to use an image that is saved locally on a drive.
7. Once you have the image loaded a preview of your image will appear and a new button will come up with "Analyze Image" on it. Click that and OllamaVision will send your image and prompt/response type to the AI model or analysis. Be patient, it can sometimes take a while to get a response depending on your setup. If you didn't recieve an error message then Ollama is working on your image and well respond eventually.
8. Once you get a response you will see the "Send to Prompt" button appear. Click that to send the AI generated description to the prompt section of the Generate tab. Here you can generate an image using the straight AI output or you can edit it to your liking however you wish before generating.

That's really it. Connect, choose model, choose response or run with default, load your image, then click analyze. Simple, easy, powerful.

   

# EXAMPLES:
Here are some images with their source image, along with the description made, and the generated output from that prompt. These are examples of the facial features preset and the color palette preset since they are probably the most unique out of all of them.

### Original Image:

![Source Image](https://github.com/user-attachments/assets/f70ea77f-6c72-42fb-8ba3-4c4b16e284f4) 


### AI prompt using Color Palette:

This image features a vibrant array of rainbow-colored umbrellas suspended in the air, creating a visually stunning display against the backdrop of a clear blue sky. The color palette consists of the following hues: red, orange, yellow, green, blue, and purple. Each umbrella is distinctly colored, with no discernible pattern being used. There are numerous umbrellas in each color, but an exact count cannot be determined from this perspective. The umbrellas appear to be evenly spaced throughout the frame, creating a sense of harmony and balance within the composition.

### Generated Image:

![0125-This image features a vibrant array of r-OfficialStableDiffusionjuggernautXL_jug-2027845308](https://github.com/user-attachments/assets/0c8a872b-a584-4c5b-9102-d1aa15ae5747)


### Original Image:

![Yeah that's right, a stock photo. Wonders of screenshots!](https://github.com/user-attachments/assets/c5949e86-a9ea-4e56-99fa-5de38fc64b84)

### AI Prompt using Facial Features:

Eyes: Brown
Eyebrows: Thick and well-groomed
Nose: Straight and moderately sized
Mouth: Shaped like a smile with full teeth showing
Chin: Rounded in shape
Skin tone: Light brown
Facial hair: Well-groomed beard on face
Hair color: Brown
Ears: Small, located just below the jawline
Freckles: Numerous across face and neck
Moles: 2 small moles under eyes

### Generated Image:

![0114-Eyes BrownEyebrows Thick and well-gro-OfficialStableDiffusionjuggernautXL_jug-382224176](https://github.com/user-attachments/assets/870048ff-8fb2-4b1b-9949-dfb190f495b1)



# Things to consider:
Each AI is different, try different ones to find one that you like. I may try to tweak the output for images overtime for more accuracy and consistency. As it is, I've been getting pretty good results.
If you're using a 7B model and it's slow, try a 3B and look for GGUF versions.

The AI is not going to always describe things accurately. It will get things wrong and it will give you some crazy stuff sometimes. Most of the time though you get a nice description that you can use right away or, with a few small tweaks, make better. You can even change things in the description to alter the final image to your liking. Lots of possibilities.


# TODO:
Minor tweaks of AI. Implement a few more options like batch image process, setting for auto paste image from clipboard. Perhaps... maybe... a combine styles of two images option. We will see how that goes. Ideas will come, some will go. This is and will probably be a work in progress for some time. BUT! It will always remain functional and easy to use.


# How this came to be:

This was never meant to ever be anything more than a fun project. Honestly, I never expected it to work. I picked up cursor on a free trial and a post on discord. Decided to try and make an interface for a vision model since it was the new thing. I thought I was going to attempt a few things and after a few hours forget I ever even started. Then after a few tries and feeding the AI docs and other files I had an extension that installed but I couldn't see it. Excitement stirred. I spent a few more hours figuring out how to get the dang thing to even show up in the utilities tab. Then finally there it was. OllamaVision... at least in name. Clicking on it gave me a screen with like 2 buttons and a bunch of nothing when I clicked them. SEVERAL!!! Hours later, I was able to connect to Ollama, upload/paste and image but nothing I would do would make it get a response from Ollama. Lots of connection errors, errors with lots of words and numbers, me literally getting out of my seat MAD at a frikkin AI. After many MANY attempts, and a sense of this is never going to work, I stared at my screen waiting for the same error message I had seen so many times. Then.... there it was... my images description... I couldn't believe it. SUCCESS! Many more hours after that and LOTS and LOTS of helpful testing and feedback from [SouthbayJay](https://civitai.com/user/SouthbayJay) (check out his models over at CivitAI) over on the [SwarmUI](https://discord.gg/eR6V2hVg) discord, the beta release was done. So much fun, so many headaches. Rollercoasters, the whole way. 

