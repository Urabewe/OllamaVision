# OllamaVision
An extension for SwarmUI that allows you to connect to Ollama to use vision models for image analysis to create image prompts.

<img src="https://github.com/user-attachments/assets/a0cd466a-85d2-47e8-8184-0f2240270a2f" width="512")


This extension is for [SwarmUI](https://github.com/mcmonkeyprojects/SwarmUI) a Web-UI frontend for ComfyUI. If you haven't already, go there and install now. If you're here I would imagine you already have it running.

This extension connects to [Ollama](https://ollama.com/) as a backend for image analysis. You will need to install this and download a LLAVA based Vision model such as llama3.2-vision. Ollama's website has a full, extensive library of models to choose from. I have been using [benzie/llava-phi-3](https://ollama.com/benzie/llava-phi-3) with a lot of success. I have reports of [MoondreamV2](https://ollama.com/library/moondream) working well also which is even smaller at 1.8b. Though I would suggest trying a few models based on your specs. For the use of this extension a 3B or smaller model will do just fine.

This is a BETA release. Some features have not been incorporated yet, some aren't fully built, some may never come to be. For now, this should be more than stable enough to get you some very nice image descriptions. Since this is a BETA please, leave any comments about issues, concerns, possible improvements, etc. Anything will help me further this project along. OTB right now, you're good to go. With memory offload even lowvram users can enjoy image description and image generation without having to spare ease of use.


# OllamaVision - An AI based image analysis extension for SwarmUI

![OllamaVision](https://github.com/user-attachments/assets/67980d3d-a3c2-48cd-8643-97b5800e6e1a)



This extension will add a new tab in SwarmUI under the "Utilities" section called "OllamaVision". Inside of this tab is a utility that will allow you to use Ollama and LLAVA Vision models to analyze images, give a brief description of that image, then allow you to send that output/description straight to the "Generate" tab to use/edit as a prompt for image generation. With it's ability to change prompt response types we can get a varied amount of information from a single image. With presets for "Artistic Style", "Facial Features", "Color Palette" and more we can gleam a lot of info to create wonderful images.

The extension is based around ease of use. Just click connect, choose your model, run with default prompt or another preset, upload/paste your image, then press analyze. That's it. The extension itself does not load any models it only sends and recieves data from Ollama so there is no extra overhead. There is also an option to unload models from memory so there is 0 impact on image generation. This is meant to be a lightweight frontend for Ollama vision models. 


# Installation:

1. Open a command prompt to your /SwarmUI/src/Extensions folder.
2. Enter `git clone https://github.com/Urabewe/OllamaVision.git` and press enter
3. This will clone this repo to the Extensions folder for installation.
4. Go to /SwarmUI/ main directory and run "windows-update.bat" (NOTE: This is UNTESTED on anything Linux, if anyone can help with this let me know, please.) this will install the extension into SwarmUI
5. Launch SwarmUI and the extension will be installed and should be ready to use.

# Use:
1. Simple! Once installed and you're in SwarmUI go to the "Utilities" tab.
2. You should now see another tab named "OllamaVision", click on that. Welcome to OllamaVision!

   
3. Now, in the upper right corner we will see a button that says connect. Click that and it will automatically connect to Ollama and pull the list of available vision models you have installed.

![Red Connect status](https://github.com/user-attachments/assets/74619aa0-a906-43f3-be41-299270131066)

![Connected](https://github.com/user-attachments/assets/1f86a0a0-bd5d-474e-8c97-cd21141b3cfa)

  
4. Select the vision model you want to use in the dropdown list provided. If you don't see your vision model then it doesn't have llava or vision in the name. Either go into "Settings" and enable "Show All Ollama Models" or rename your model to include vision or llama to keep it separate from the rest. Moondream will require you to rename or enable all.
   
![Show All](https://github.com/user-attachments/assets/fc3b91a2-adb8-4e1c-be79-91dc3f3bc4a2)

![Show just visioni](https://github.com/user-attachments/assets/ad0bcd40-c9a3-43ae-8088-c2570c91402d)

![Show All](https://github.com/user-attachments/assets/f518df66-9d9c-4848-b15b-9a2c648adf67)


5. If you are using an image on your drive, click upload and choose the image.

![Upload Image](https://github.com/user-attachments/assets/ab046ca0-4c8f-41d5-b39f-5fd61052a0ee)



6. To paste an image/screenshot from your clipboard click on the "Paste" button

![Paste](https://github.com/user-attachments/assets/06c3d7d9-bb9c-42eb-a256-e5cfc2f870a4)


7. You can use the default prompt response type or change the response to another setting by choosing a built-in preset or making your own.

![Configure button](https://github.com/user-attachments/assets/8899c384-e121-464b-ae21-c1496b633254)

![Modal window](https://github.com/user-attachments/assets/375a8dff-5f07-4761-a4e5-895fdca2eb83)

In this window you can select a preset, make your own temporary use preset by just typing in the box, make and save a preset, manage/delete user presets. Should be pretty straight forward.



8. Now, simply press "Analyze Image"

![Analyze](https://github.com/user-attachments/assets/43afffb8-a075-4c6f-808a-80ed618e65e5)


9. You will see the status bar turn blue and "Image sent, waiting for response from Ollama..."

![Ollama is analyzing](https://github.com/user-attachments/assets/6ed8c4c6-ea4c-4b8f-a92c-542b2f2da7c8)

   
If you see this, be patient. Ollama is looking at your image and will respond soon. Depending on your hardware setup it could take quite a long time to get a response or you'll get one right away. This all depends on your setup and how quickly Ollama works on your computer.


10. You should eventually see your image description pop up and you can now press "Send output to prompt" which will send your description to the "Generate" tab.

![Send output to prompt](https://github.com/user-attachments/assets/b1b12087-2c24-437c-b838-80540144614c)


11. From here you can edit your prompt or run with it to see what the AI will give you.


# EXAMPLES:
Here are some images with their source image, along with the description made, and the generated output from that prompt. These are examples of the facial features preset and the color palette preset since they are probably the most unique out of all of them.

### Original Image:

![Source Image](https://github.com/user-attachments/assets/f70ea77f-6c72-42fb-8ba3-4c4b16e284f4) 


### AI prompt using Color Palette:

This image features a vibrant array of rainbow-colored umbrellas suspended in the air, creating a visually stunning display against the backdrop of a clear blue sky. The color palette consists of the following hues: red, orange, yellow, green, blue, and purple. Each umbrella is distinctly colored, with no discernible pattern being used. There are numerous umbrellas in each color, but an exact count cannot be determined from this perspective. The umbrellas appear to be evenly spaced throughout the frame, creating a sense of harmony and balance within the composition.





# Things to consider:
Each AI is different, try different ones to find one that you like. I may try to tweak the output for images overtime for more accuracy and consistency. As it is, I've been getting pretty good results.
If you're using a 7B model and it's slow, try a 3B and look for GGUF versions.

The AI is not going to always describe things accurately. It will get things wrong and it will give you some crazy stuff sometimes. Most of the time though you get a nice descritption that you can use right away or, with a few small tweaks, make better. You can even change things in the description to alter the final image to your liking. Lots of possibilities.


# TODO:
Minor tweaks of AI. Implement a few more options like batch image process, setting for auto paste image from clipboard. Perhaps... maybe... a combine styles of two images option. We will see how that goes. Ideas will come, some will go. This is and will probably be a work in progress for some time. BUT! It will always remain functional and easy to use.


# How this came to be:

This was never meant to ever be anything more than a fun project. Honestly, I never expected it to work. I picked up cursor on a free trial and a post on discord. Decided to try and make an interface for a vision model since it was the new thing. I thought I was going to attempt a few things and after a few hours forget I ever even started. Then after a few tries and feeding the AI docs and other files I had an extension that installed but I couldn't see it. Excitement stirred. I spent a few more hours figuring out how to get the dang thing to even show up in the utilities tab. Then finally there it was. OllamaVision... at least in name. Clicking on it gave me a screen with like 2 buttons and a bunch of nothing when I clicked them. SEVERAL!!! Hours later, I was able to connect to Ollama, upload/paste and image but nothing I would do would make it get a response from Ollama. Lots of connection errors, errors with lots of words and numbers, me literally getting out of my seat MAD at a frikkin AI. After many MANY attempts, and a sense of this is never going to work, I stared at my screen waiting for the same error message I had seen so many times. Then.... there it was... my images description... I couldn't believe it. SUCCESS! Many more hours after that and LOTS and LOTS of helpful testing and feedback from [SouthbayJay](https://civitai.com/user/SouthbayJay) (check out his models over at CivitAI) over on the [SwarmUI](https://discord.gg/eR6V2hVg) discord, the beta release was done. So much fun, so many headaches. Rollercoasters, the whole way. 

