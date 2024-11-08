# OllamaVision
An extension for SwarmUI that allows you to connect to Ollama to use vision models for image analysis to create image prompts.

This extension is for [SwarmUI](https://github.com/mcmonkeyprojects/SwarmUI) a Web-UI frontend for ComfyUI. If you haven't already, go there and install now. If you're here I would imagine you already have it running.

This extension connects to [Ollama](https://ollama.com/) as a backend for image analysis. You will need to install this and download a LLAVA based Vision model such as llama3.2-vision. Ollama's website has a full, extensive library of models to choose from. I have been using [benzie/llava-phi-3](https://ollama.com/benzie/llava-phi-3) with a lot of success. Though I would suggest trying a few models based on your specs. For the use of this extension a 3B model will do just fine.

This is the BETA version, as of right now there is not a built in screenshot tool. You will have to use either Windows built-in snip tool "Windows+Shift+S" to grab a screenshot or another tool of your choice. You can then paste it into the extension directly. Any image you have saved in the clipboard can be pasted to the extension. I.E. "right click, copy image, paste into OllamaVision".  You can also choose any file you might have saved on your drive(s).  

# OllamaVision - An AI based image analysis extension for SwarmUI

![OllamaVision screenshot after image analysis](https://github.com/user-attachments/assets/b26b8409-8bcb-4b13-a6f7-50bb0f695f27)

This extension will add a new tab in SwarmUI under the "Utilities" section called "OllamaVision". Inside of this tab is a utility that will allow you to use Ollama and LLAVA Vision models to analyze images, give a brief description of that image, then allow you to send that output/description straight to the "Generate" tab to use/edit as a prompt for image generation. 

The extension is based around ease of use. Just click connect, choose your model, paste/upload your image, then press analyze. That's it. The extension itself does not load any models it only sends and recieves data from Ollama so there is no extra overhead. Extremely small at around 30kb, it's lightweight and functional. 

# To use the screenshot option:

Right now the screenshot function is not fully built. With that, you can use the built in tool in Windows. Press "Windows+Shift+S", select an area of the screen to capture or the whole screen, this will save to clipboard, then inside of the extension press "Paste with CTRL+V" button, then press CTRL+V to load your image. You can also right click on an image in your browser, copy image, then paste it in as well. Pretty much, any image in your clipboard, you can use inside of OllamaVision. This feature will be fully developed at a later date. The goal is for the extension to have it's very own screenshot function built-in and will auto paste the image into the extension while still giving you the ability to paste in yourself.

# Installation:

1. Open a command prompt to your /SwarmUI/src/Extensions folder.
2. Enter `git clone https://github.com/Urabewe/OllamaVision.git` and press enter
3. This will clone this repo to the Extensions folder for installation.
4. Go to /SwarmUI/ main directory and run "windows-update.bat" (note this is UNTESTED on anything Linux, if anyone can help with this let me know please) this will install the extension into SwarmUI
5. Launch SwarmUI and the extension will be installed and should be ready to use.

# Use:
1. Simple! Once installed and you're in SwarmUI go to the "Utilities" tab.
2. You should now see another tab named "OllamaVision" click on that. Welcome to OllamaVision!
3. Now, in the upper right corner we will see a button that says connect. Click that and it will automatically connect to Ollama and pull the list of available vision models you have installed.

![Connect Button](https://github.com/user-attachments/assets/4fe2ee77-7bdb-4484-8ed8-5c92df32a95b)
  
4. Select the vision model you want to use in the dropdown list provided.
   
![Model Dropdown](https://github.com/user-attachments/assets/e51d1d58-e0a8-4e67-ad86-5842b85c3c7a)

6. If you are using an image on your drive, click upload and choose the image.

![upload](https://github.com/user-attachments/assets/aa15e377-9541-491c-a7e3-a65c0296ebda)

7. If you are pasting an image/screenshot unfortunately until I get everything fleshed out you will have to press the "Press here to paste with CTRL+V from clipboard..." button when you first load up. Once you press it you can paste into the extension without pressing again unless you restart.

![paste](https://github.com/user-attachments/assets/b9bf7439-c613-48eb-a62a-03b040e28c64)

8. Now, simply press "Analyze Image"

![analyze](https://github.com/user-attachments/assets/e2a85465-9b11-40d5-a8c3-cdfd4b906349)

9. You will see the status bar turn blue and "Image sent, waiting for response from Ollama..."

![Ollama is analyzing](https://github.com/user-attachments/assets/70e259d7-28fa-4a58-bfa2-0e77b08a8d05)
   
If you see this, be patient. Ollama is looking at your image and will respond soon. Depending on your hardware setup it could take quite a long time to get a response or you'll get one right away. This all depends on your setup and how quickly Ollama works on your computer.

10. You should eventually see your image description pop up and you can now press "Send output to prompt" which will send your description to the "Generate" tab.

![Send output to prompt](https://github.com/user-attachments/assets/919abe49-709a-4eaa-a106-27206932c00f)

11. From here you can edit your prompt or run with it to see what the AI will give you.


# Things to consider:
Each AI is different, try different ones to find one that you like. I may try to tweak the output for images overtime for more accuracy and consistency. As it is, I've been getting pretty good results.
If you're using a 7B model and it's slow, try a 3B and look for GGUF versions.

The AI is not going to always describe things accurately. It will get things wrong and it will give you some crazy stuff sometimes. Most of the time though you get a nice descritption that you can use right away or, with a few small tweaks, make better. You can even change things in the description to alter the final image to your liking. Lots of possibilities.

# Example:

### Original Image:

![Rock in ocean](https://github.com/user-attachments/assets/46c53b49-8ded-4c02-8843-f2d13e12b0b1)

### AI prompt from OllamaVision:

A striking view of a large rock formation standing majestically in the ocean. The rock, with its light brown color and rough texture, towers over the surrounding water, creating a sense of grandeur. It is located on the right side of the frame, positioned at an angle that adds depth to the scene. The ocean beneath it is a darker shade of blue, hinting at its vastness. Small waves are visible around the rock formation, suggesting a gentle breeze might be present. The sky above mirrors this color with its pale blue hue and scattered clouds, completing the serene setting. This image captures not just objects but also their interplay - the rock against the ocean, the ocean against the sky, all under the vast expanse of the cloud-filled sky. It's a harmonious blend of earth and water under an open sky.

### AI Generated Image using AI OllamaVision prompt:

![Final image from prompt](https://github.com/user-attachments/assets/141df931-53e2-4aa3-b4ae-47978dbacad3)


# TODO:
Clean up the UI, add some graphics, get some better coloring. Remove redundant "connected" status icon.
Fully implement the screenshot tool allowing quick and easy region selection and instant pasting into extension.
House Cleaning and tweaking of the AI prompt outputs. Though pretty good already I should be able to make it better.



This was never meant to ever be anything more than a fun project. Honestly, I never expected it to work. Hope you all enjoy it!

