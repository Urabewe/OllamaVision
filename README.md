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

#Installation:

1. Open a command prompt to your /SwarmUI/src/Extensions folder.
2. enter `git clone `
