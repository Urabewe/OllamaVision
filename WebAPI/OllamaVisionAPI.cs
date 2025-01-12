using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using SwarmUI.Utils;
using SwarmUI.WebAPI;
using System;
using System.Net.Http;
using SwarmUI.Accounts;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using System.IO;
using Microsoft.AspNetCore.Http;

namespace Urabewe.OllamaVision.WebAPI
{
    public static class OllamaVisionPermissions
    {
        public static readonly PermInfoGroup OllamaVisionPermGroup = new("OllamaVision", "Permissions related to OllamaVision functionality.");
        public static readonly PermInfo PermUseOllamaVision = Permissions.Register(new("use_ollamavision", "Use OllamaVision", "Allows using Ollama vision models.", PermissionDefault.POWERUSERS, OllamaVisionPermGroup));
    }

    [API.APIClass("API routes related to OllamaVision extension")]
    public class OllamaVisionAPI
    {
        private static readonly HttpClient client = new HttpClient();
        
        private static readonly Dictionary<string, string> PRESET_PROMPTS = new Dictionary<string, string>
        {
            ["Default"] = "Give a brief, detailed description of this image. Make it all one paragraph and format it for image generation prompts.",
            ["Detailed Analysis"] = "Provide a detailed analysis of this image, including colors, composition, subjects, lighting, and mood. Format it as a comprehensive description for image generation.",
            ["Simple Description"] = "Give a short two sentence response about the details of this image.",
            ["Artistic Style"] = "Describe this image in artistic terms, focusing on style, technique, composition, and visual elements that would be important for recreating it.",
            ["Technical Details"] = "Analyze this image focusing on technical aspects like camera angles, lighting setup, composition rules, and photographic techniques used.",
            ["Color Palette"] = "Give a detailed description of the color palette used in this image and nothing else. Give details about all colors used in the photo. Indicate if there is a pattern being used.",
            ["Facial Features"] = "Give a very descriptive, detailed response about the facial features of the subject in the image. Include hair color, facial hair, skin tone, eye color, eye shape, nose shape, chin, blemishes, beauty marks, freckles, moles. Only respond with facial features.",
        };

        private static readonly Dictionary<string, string> FUSION_PROMPTS = new Dictionary<string, string>
        {
            ["Style Analysis"] = "Analyze only the artistic style of this image.\n\n Ignore the subject and setting and any other objects in the image.\n\n Do not describe what's in the image only the photographic style, art style, filters used, lighting, and not the content of the image.\n\n Focus on techniques, artistic elements, lighting style, color theory, and composition techniques.\n\n Only consider how the image looks and not what is in the image.\n\n If the image is of a known artist mention them, example:If it is a Van Gogh painting mention that it is a Van Gogh painting.\n\n Provide what you see in the image and don't mention the mood, how it makes you feel, the overall concept.\n\n Don't add any emotions into your description just facts.\n\n Ignore any text, signatures, or watermarks. \n\n Give your results in a one paragraph description of the image.",
            ["Subject Analysis"] = "Do not describe the background, setting, or anything else except the subject or subjects in the image.\n\n If there is anything in the background ignore it, if the background is blank, ignore it, always ignore the background in the image.\n\n Only include a description of the subject, who they are, if they are a known person, and what they are wearing.\n\n Ignore everything but the subject or subjects.\n\n Analyze only the main subject or subjects in this image.\n\n The only thing that matters in this image is the subject or subjects.\n\n Also include their appearance, poses, expressions, clothing, and detailed characteristics.\n\n Format it as a detailed description for image generation.",
            ["Setting Analysis"] = "Analyze only the setting and background in this image.\n\n Do not focus on any people, characters, animals, or anything else that doesn't pertain to the setting in the image.\n\n Focus on the environment, atmosphere, time of day, weather, and contextual elements.\n\n Describe Ignore any subjects in the image.\n\n Format it as a detailed description for image generation."
        };

        private static readonly List<string> PRESET_ORDER = new List<string>
        {
            "Default",
            "Simple Description",
            "Detailed Analysis",
            "Artistic Style",
            "Technical Details",
            "Color Palette",
            "Facial Features"
        };

        private static readonly string STORY_PROMPT = @"Based solely on the image provided, craft a long to medium long length story that brings the scene, characters, and mood to life. The story should be engaging, imaginative, and vivid, with a clear structure: a compelling beginning, an intriguing middle, and a satisfying conclusion. It should be long enough to immerse the reader approximately 1,200 to 1,500 word, but concise enough to be read in one sitting (around 10 minutes). Avoid referring to the storytelling process or mentioning the image explicitly—let the narrative stand independently.\n\nInstructions:\n1. Focus only on the visual details in the image and interpret them creatively into a coherent story.\n2. Use descriptive language to create atmosphere and bring the scene and characters to life.\n3. Maintain a balance between action, dialogue, and description for a dynamic narrative.\n\nExample Structure:\n[Introduction]\nSet the stage with vivid descriptions of the scene, introduce the main character(s), and hint at the conflict or goal.\n\n[Main Story]\nDevelop the plot with engaging events, challenges, or conflicts that arise. Use dialogue and interactions to reveal character depth.\n\n[Conclusion]\nResolve the story conflict or bring closure to the narrative in a satisfying way.\n\n Don't give a description of the image in your results.\n\n Do not talk about the fact you are making a story.\n\n Only respond with the story you create.\n\n Now, write the story.";

        public static void Register()
        {
            Logs.Info("Registering OllamaVision API calls...");
            API.RegisterAPICall(ConnectToOllamaAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(AnalyzeImageAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(GetUserPrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(SaveUserPrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(GetPresetPrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(GetFusionPrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(UnloadModelAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(StreamAnalyzeImageAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(CombineAnalysesAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(GetStoryPrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            Logs.Info("OllamaVision API calls registered successfully.");
        }

        [API.APIDescription("Gets the current user prompt setting", "Returns the current prompt used for image analysis")]
        public static async Task<JObject> GetUserPrompt(JObject data)
        {
            try 
            {
                return new JObject
                {
                    ["success"] = true,
                    ["prompt"] = "Give a brief, detailed description of this image. Make it all one paragraph and format it for image generation prompts."
                };
            }
            catch (Exception ex)
            {
                Logs.Error($"Error in GetUserPrompt: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = ex.Message
                };
            }
        }

        [API.APIDescription("Gets a preset prompt", "Returns the selected preset prompt")]
        public static async Task<JObject> GetPresetPrompt(JObject data)
        {
            try
            {
                Logs.Debug("GetPresetPrompt called with data: " + data?.ToString());

                string preset = data["preset"]?.ToString();
                if (string.IsNullOrEmpty(preset))
                {
                    var presetList = new JArray();
                    foreach (var presetName in PRESET_ORDER)
                    {
                        presetList.Add(presetName);
                    }

                    return new JObject
                    {
                        ["success"] = true,
                        ["presets"] = presetList
                    };
                }

                if (!PRESET_PROMPTS.ContainsKey(preset))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "Invalid preset name"
                    };
                }

                return new JObject
                {
                    ["success"] = true,
                    ["prompt"] = PRESET_PROMPTS[preset]
                };
            }
            catch (Exception ex)
            {
                Logs.Error($"Error in GetPresetPrompt: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = ex.Message
                };
            }
        }

        [API.APIDescription("Saves the user prompt setting", "Returns success status of saving the prompt")]
        public static async Task<JObject> SaveUserPrompt(JObject data)
        {
            try
            {
                return new JObject
                {
                    ["success"] = true
                };
            }
            catch (Exception ex)
            {
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = ex.Message
                };
            }
        }

        [API.APIDescription("Connects to Ollama and retrieves available vision models", "Returns list of available vision models")]
        public static async Task<JObject> ConnectToOllamaAsync(JObject data)
        {
            try
            {
                bool showAllModels = data["showAllModels"]?.ToObject<bool>() ?? false;
                string ollamaUrl = data["ollamaUrl"]?.ToString() ?? "http://localhost:11434";
                
                var response = await client.GetAsync($"{ollamaUrl}/api/tags");
                
                if (!response.IsSuccessStatusCode)
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = $"Failed to connect to Ollama at {ollamaUrl}. Status code: {response.StatusCode}"
                    };
                }

                var content = await response.Content.ReadAsStringAsync();
                Logs.Debug($"Ollama response: {content}");

                var jsonResponse = JsonConvert.DeserializeObject<JObject>(content);
                var models = jsonResponse["models"]?
                    .Select(m => m["name"]?.ToString())
                    .Where(name => !string.IsNullOrEmpty(name))
                    .ToList();

                if (models == null || !models.Any())
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "No models found in Ollama."
                    };
                }

                return new JObject
                {
                    ["success"] = true,
                    ["response"] = "Connected to Ollama successfully",
                    ["models"] = JArray.FromObject(models)
                };
            }
            catch (Exception ex)
            {
                Logs.Error($"Error connecting to Ollama: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = ex.Message
                };
            }
        }

        [API.APIDescription("Analyzes an image using vision models", "Returns the AI's analysis of the image")]
        public static async Task<JObject> AnalyzeImageAsync(JObject data)
        {
            try
            {
                // Get the prompt from request data
                var prompt = data["prompt"]?.ToString();
                if (string.IsNullOrEmpty(prompt))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "Missing prompt"
                    };
                }

                // Extract and validate image data
                var imageData = data["imageData"]?.ToString();
                if (string.IsNullOrEmpty(imageData))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "Missing image data"
                    };
                }

                try
                {
                    // Process image data more safely
                    string base64Data;
                    if (imageData.StartsWith("data:image"))
                    {
                        var parts = imageData.Split(',');
                        if (parts.Length != 2)
                        {
                            return new JObject
                            {
                                ["success"] = false,
                                ["error"] = "Invalid image data format"
                            };
                        }
                        base64Data = parts[1];
                    }
                    else
                    {
                        base64Data = imageData;
                    }

                    // Validate base64 data
                    try
                    {
                        var _ = Convert.FromBase64String(base64Data);
                    }
                    catch
                    {
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = "Invalid base64 image data"
                        };
                    }

                    // Extract and validate all model settings
                    var model = data["model"]?.ToString();
                    var backendType = data["backendType"]?.ToString() ?? "ollama";
                    var ollamaUrl = data["ollamaUrl"]?.ToString() ?? "http://localhost:11434";

                    // Parse common model settings
                    var temperature = Math.Max(0, Math.Min(2, data["temperature"]?.ToObject<float?>() ?? 0.8f));
                    var maxTokens = Math.Max(-1, Math.Min(4096, data["maxTokens"]?.ToObject<int?>() ?? 500));
                    var topP = Math.Max(0, Math.Min(1, data["topP"]?.ToObject<float?>() ?? 0.7f));

                    // Validate required parameters
                    if (string.IsNullOrEmpty(model))
                    {
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = "Missing required parameters (model)"
                        };
                    }

                    // Handle different backends
                    if (backendType == "openai")
                    {
                        var apiKey = data["apiKey"]?.ToString();
                        if (string.IsNullOrEmpty(apiKey))
                        {
                            return new JObject { ["success"] = false, ["error"] = "OpenAI API key is required" };
                        }

                        // Parse OpenAI-specific parameters
                        var frequencyPenalty = Math.Max(-2.0f, Math.Min(2.0f, data["frequencyPenalty"]?.ToObject<float?>() ?? 0.0f));
                        var presencePenalty = Math.Max(-2.0f, Math.Min(2.0f, data["presencePenalty"]?.ToObject<float?>() ?? 0.0f));

                        var messages = new JArray();
                        
                        // Only add system message if systemPrompt is provided
                        var systemPrompt = data["systemPrompt"]?.ToString()?.Trim();
                        if (!string.IsNullOrEmpty(systemPrompt))
                        {
                            messages.Add(new JObject
                            {
                                ["role"] = "system",
                                ["content"] = systemPrompt
                            });
                        }

                        messages.Add(new JObject
                        {
                            ["role"] = "user",
                            ["content"] = new JArray {
                                new JObject { ["type"] = "text", ["text"] = prompt },
                                new JObject {
                                    ["type"] = "image_url",
                                    ["image_url"] = new JObject {
                                        ["url"] = $"data:image/jpeg;base64,{base64Data}"
                                    }
                                }
                            }
                        });

                        var apiRequestBody = new JObject
                        {
                            ["model"] = model,
                            ["messages"] = messages,
                            ["max_tokens"] = maxTokens,
                            ["temperature"] = temperature,
                            ["top_p"] = topP,
                            ["frequency_penalty"] = frequencyPenalty,
                            ["presence_penalty"] = presencePenalty
                        };

                        return await SendApiRequest(apiRequestBody, "openai", apiKey);
                    }
                    else if (backendType == "openrouter")
                    {
                        var apiKey = data["apiKey"]?.ToString();
                        if (string.IsNullOrEmpty(apiKey))
                        {
                            return new JObject { ["success"] = false, ["error"] = "OpenRouter API key is required" };
                        }

                        // Parse OpenRouter-specific parameters
                        var frequencyPenalty = Math.Max(-2.0f, Math.Min(2.0f, data["frequencyPenalty"]?.ToObject<float?>() ?? 0.0f));
                        var presencePenalty = Math.Max(-2.0f, Math.Min(2.0f, data["presencePenalty"]?.ToObject<float?>() ?? 0.0f));
                        var repeatPenalty = Math.Max(0.0f, Math.Min(2.0f, data["repeatPenalty"]?.ToObject<float?>() ?? 1.1f));
                        var topK = Math.Max(0, Math.Min(100, data["topK"]?.ToObject<int?>() ?? 40));
                        var minP = Math.Max(0.0f, Math.Min(1.0f, data["minP"]?.ToObject<float?>() ?? 0.0f));
                        var topA = Math.Max(0.0f, Math.Min(1.0f, data["topA"]?.ToObject<float?>() ?? 0.0f));
                        var seed = data["seed"]?.ToObject<int?>() ?? -1;

                        var messages = new JArray();
                        
                        // Only add system message if systemPrompt is provided
                        var systemPrompt = data["systemPrompt"]?.ToString()?.Trim();
                        if (!string.IsNullOrEmpty(systemPrompt))
                        {
                            messages.Add(new JObject
                            {
                                ["role"] = "system",
                                ["content"] = systemPrompt
                            });
                        }

                        messages.Add(new JObject
                        {
                            ["role"] = "user",
                            ["content"] = new JArray {
                                new JObject { ["type"] = "text", ["text"] = prompt },
                                new JObject {
                                    ["type"] = "image_url",
                                    ["image_url"] = new JObject {
                                        ["url"] = $"data:image/jpeg;base64,{base64Data}"
                                    }
                                }
                            }
                        });

                        var apiRequestBody = new JObject
                        {
                            ["model"] = model,
                            ["messages"] = messages,
                            ["max_tokens"] = maxTokens,
                            ["temperature"] = temperature,
                            ["top_p"] = topP,
                            ["frequency_penalty"] = frequencyPenalty,
                            ["presence_penalty"] = presencePenalty,
                            ["repetition_penalty"] = repeatPenalty,
                            ["top_k"] = topK,
                            ["min_p"] = minP,
                            ["top_a"] = topA,
                            ["seed"] = seed
                        };

                        return await SendApiRequest(apiRequestBody, "openrouter", apiKey);
                    }
                    else // Ollama
                    {
                        // Parse Ollama-specific parameters
                        var seed = data["seed"]?.ToObject<int?>() ?? -1;
                        var topK = Math.Max(0, Math.Min(100, data["topK"]?.ToObject<int?>() ?? 40));
                        var repeatPenalty = Math.Max(0.0f, Math.Min(2.0f, data["repeatPenalty"]?.ToObject<float?>() ?? 1.1f));

                        var requestBody = new JObject
                        {
                            ["model"] = model,
                            ["prompt"] = prompt,
                            ["images"] = new JArray { base64Data },
                            ["stream"] = false,
                            ["options"] = new JObject
                            {
                                ["temperature"] = temperature,
                                ["seed"] = seed,
                                ["top_p"] = topP,
                                ["top_k"] = topK,
                                ["num_predict"] = maxTokens,
                                ["repeat_penalty"] = repeatPenalty
                            }
                        };

                        // Only add system if systemPrompt is provided
                        var systemPrompt = data["systemPrompt"]?.ToString()?.Trim();
                        if (!string.IsNullOrEmpty(systemPrompt))
                        {
                            requestBody["system"] = systemPrompt;
                        }

                        var response = await client.PostAsync(
                            $"{ollamaUrl}/api/generate",
                            new StringContent(requestBody.ToString(), System.Text.Encoding.UTF8, "application/json")
                        );

                        var content = await response.Content.ReadAsStringAsync();
                        if (!response.IsSuccessStatusCode)
                        {
                            Logs.Error($"Ollama analysis failed. Status: {response.StatusCode}, Content: {content}");
                            
                            // Check for specific error messages
                            if (content.Contains("forcibly closed"))
                            {
                                return new JObject
                                {
                                    ["success"] = false,
                                    ["error"] = "The model crashed or ran out of memory. Try:\n" +
                                               "1. Reduce image size before uploading\n" +
                                               "2. Free up system memory\n" +
                                               "3. Try a different model\n" +
                                               "4. Restart Ollama service"
                                };
                            }
                            
                            return new JObject
                            {
                                ["success"] = false,
                                ["error"] = $"Failed to analyze image. Status: {response.StatusCode}, Content: {content}"
                            };
                        }

                        var result = JObject.Parse(content);
                        return new JObject
                        {
                            ["success"] = true,
                            ["response"] = result["response"]?.ToString()
                        };
                    }
                }
                catch (Exception ex)
                {
                    Logs.Error($"Error processing image data: {ex.Message}");
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "Error processing image: " + ex.Message
                    };
                }
            }
            catch (Exception ex)
            {
                Logs.Error($"Unexpected error in AnalyzeImageAsync: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = "Unexpected error: " + ex.Message
                };
            }
        }

        private static async Task<JObject> SendApiRequest(JObject requestBody, string backendType, string apiKey)
        {
            try 
            {
                var endpoint = backendType == "openai" 
                    ? "https://api.openai.com/v1/chat/completions"
                    : "https://openrouter.ai/api/v1/chat/completions";

                var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                request.Headers.Add("Authorization", $"Bearer {apiKey}");

                if (backendType == "openrouter")
                {
                    request.Headers.Add("HTTP-Referer", "https://swarmui.local");
                    request.Headers.Add("X-Title", "SwarmUI");
                }

                request.Content = new StringContent(
                    requestBody.ToString(),
                    System.Text.Encoding.UTF8,
                    "application/json"
                );

                var response = await client.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Logs.Error($"API request failed: {content}");
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = $"{backendType} API request failed: {content}"
                    };
                }

                var result = JObject.Parse(content);
                return new JObject
                {
                    ["success"] = true,
                    ["response"] = result["choices"]?[0]?["message"]?["content"]?.ToString()
                };
            }
            catch (Exception ex)
            {
                Logs.Error($"Error in SendApiRequest: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = $"API request error: {ex.Message}"
                };
            }
        }

        [API.APIDescription("Unloads a model from Ollama's memory", "Returns success status of unloading the model")]
        public static async Task<JObject> UnloadModelAsync(JObject data)
        {
            try
            {
                string model = data["model"]?.ToString();
                if (string.IsNullOrEmpty(model))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "No model specified"
                    };
                }

                var requestBody = new JObject
                {
                    ["model"] = model,
                    ["action"] = "unload"
                };

                var response = await client.PostAsync(
                    "http://localhost:11434/api/pull",
                    new StringContent(requestBody.ToString(), System.Text.Encoding.UTF8, "application/json")
                );
                
                if (response.IsSuccessStatusCode)
                {
                    Logs.Info($"Successfully unloaded model: {model}");
                    return new JObject
                    {
                        ["success"] = true,
                        ["response"] = "Model unloaded successfully"
                    };
                }
                else
                {
                    var content = await response.Content.ReadAsStringAsync();
                    Logs.Error($"Failed to unload model. Status: {response.StatusCode}, Content: {content}");
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = $"Failed to unload model: {content}"
                    };
                }
            }
            catch (Exception ex)
            {
                Logs.Error($"Error unloading model: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = ex.Message
                };
            }
        }

        [API.APIDescription("Streams analysis of an image using vision models", "Returns the AI's analysis of the image as a stream")]
        public static async Task<JObject> StreamAnalyzeImageAsync(JObject data)
        {
            try
            {
                // Extract parameters
                var model = data["model"]?.ToString();
                var backendType = data["backendType"]?.ToString() ?? "ollama";
                var imageData = data["imageData"]?.ToString();
                var prompt = data["prompt"]?.ToString();
                var ollamaUrl = data["ollamaUrl"]?.ToString() ?? "http://localhost:11434";

                // Validate required parameters
                if (string.IsNullOrEmpty(model) || string.IsNullOrEmpty(imageData) || string.IsNullOrEmpty(prompt))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "Missing required parameters"
                    };
                }

                // Process image data
                string base64Data;
                if (imageData.StartsWith("data:image"))
                {
                    var parts = imageData.Split(',');
                    if (parts.Length != 2)
                    {
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = "Invalid image data format"
                        };
                    }
                    base64Data = parts[1];
                }
                else
                {
                    base64Data = imageData;
                }

                // Extract model parameters
                var temperature = Math.Max(0, Math.Min(2, data["temperature"]?.ToObject<float?>() ?? 0.8f));
                var maxTokens = Math.Max(-1, Math.Min(4096, data["maxTokens"]?.ToObject<int?>() ?? 500));
                var topP = Math.Max(0, Math.Min(1, data["topP"]?.ToObject<float?>() ?? 0.7f));

                string response = "";

                if (backendType == "openai")
                {
                    response = await GetOpenAIResponse(
                        model, prompt, base64Data, data["apiKey"]?.ToString(),
                        temperature, maxTokens, topP,
                        data["frequencyPenalty"]?.ToObject<float?>() ?? 0.0f,
                        data["presencePenalty"]?.ToObject<float?>() ?? 0.0f,
                        data["systemPrompt"]?.ToString()
                    );
                }
                else if (backendType == "openrouter")
                {
                    response = await GetOpenRouterResponse(
                        model, prompt, base64Data, data["apiKey"]?.ToString(),
                        temperature, maxTokens, topP,
                        data["frequencyPenalty"]?.ToObject<float?>() ?? 0.0f,
                        data["presencePenalty"]?.ToObject<float?>() ?? 0.0f,
                        data["topK"]?.ToObject<int?>() ?? 40,
                        data["repeatPenalty"]?.ToObject<float?>() ?? 1.1f,
                        data["minP"]?.ToObject<float?>() ?? 0.0f,
                        data["topA"]?.ToObject<float?>() ?? 0.0f,
                        data["seed"]?.ToObject<int?>() ?? -1,
                        data["siteName"]?.ToString() ?? "SwarmUI",
                        data["systemPrompt"]?.ToString()
                    );
                }
                else // Ollama
                {
                    response = await GetOllamaResponse(
                        model, prompt, base64Data, ollamaUrl,
                        temperature, maxTokens, topP,
                        data["topK"]?.ToObject<int?>() ?? 40,
                        data["repeatPenalty"]?.ToObject<float?>() ?? 1.1f,
                        data["seed"]?.ToObject<int?>() ?? -1,
                        data["systemPrompt"]?.ToString()
                    );
                }

                return new JObject
                {
                    ["success"] = true,
                    ["response"] = response
                };
            }
            catch (Exception ex)
            {
                Logs.Error($"Error in StreamAnalyzeImageAsync: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = ex.Message
                };
            }
        }

        private static async Task<string> GetOpenAIResponse(string model, string prompt, string base64Data, string apiKey, 
            float temperature, int maxTokens, float topP, float frequencyPenalty, float presencePenalty, string systemPrompt)
        {
            var messages = new JArray();
            if (!string.IsNullOrEmpty(systemPrompt))
            {
                messages.Add(new JObject
                {
                    ["role"] = "system",
                    ["content"] = systemPrompt
                });
            }

            messages.Add(new JObject
            {
                ["role"] = "user",
                ["content"] = new JArray {
                    new JObject { ["type"] = "text", ["text"] = prompt },
                    new JObject {
                        ["type"] = "image_url",
                        ["image_url"] = new JObject {
                            ["url"] = $"data:image/jpeg;base64,{base64Data}"
                        }
                    }
                }
            });

            var requestData = new JObject
            {
                ["model"] = model,
                ["messages"] = messages,
                ["max_tokens"] = maxTokens,
                ["temperature"] = temperature,
                ["top_p"] = topP,
                ["frequency_penalty"] = frequencyPenalty,
                ["presence_penalty"] = presencePenalty
            };

            using var client = new HttpClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            var response = await client.PostAsync(
                "https://api.openai.com/v1/chat/completions",
                new StringContent(requestData.ToString(), System.Text.Encoding.UTF8, "application/json")
            );

            var content = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"OpenAI API request failed: {content}");
            }

            var result = JObject.Parse(content);
            return result["choices"]?[0]?["message"]?["content"]?.ToString() ?? 
                throw new Exception("No response content from OpenAI");
        }

        private static async Task<string> GetOpenRouterResponse(string model, string prompt, string base64Data, string apiKey,
            float temperature, int maxTokens, float topP, float frequencyPenalty, float presencePenalty,
            int topK, float repeatPenalty, float minP, float topA, int seed, string siteName, string systemPrompt)
        {
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new Exception("OpenRouter API key is required");
            }

            var messages = new JArray();
            if (!string.IsNullOrEmpty(systemPrompt))
            {
                messages.Add(new JObject
                {
                    ["role"] = "system",
                    ["content"] = systemPrompt
                });
            }

            messages.Add(new JObject
            {
                ["role"] = "user",
                ["content"] = new JArray {
                    new JObject { ["type"] = "text", ["text"] = prompt },
                    new JObject {
                        ["type"] = "image_url",
                        ["image_url"] = new JObject {
                            ["url"] = $"data:image/jpeg;base64,{base64Data}"
                        }
                    }
                }
            });

            var requestData = new JObject
            {
                ["model"] = model,
                ["messages"] = messages,
                ["max_tokens"] = maxTokens,
                ["temperature"] = temperature,
                ["top_p"] = topP,
                ["frequency_penalty"] = frequencyPenalty,
                ["presence_penalty"] = presencePenalty,
                ["top_k"] = topK,
                ["repetition_penalty"] = repeatPenalty,
                ["min_p"] = minP,
                ["top_a"] = topA
            };

            if (seed != -1)
            {
                requestData["seed"] = seed;
            }

            using var client = new HttpClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
            client.DefaultRequestHeaders.Add("HTTP-Referer", "https://swarmui.local");
            client.DefaultRequestHeaders.Add("X-Title", siteName);

            var response = await client.PostAsync(
                "https://openrouter.ai/api/v1/chat/completions",
                new StringContent(requestData.ToString(), System.Text.Encoding.UTF8, "application/json")
            );

            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                // Check if it's a model-specific error and try a fallback
                var errorObj = JObject.Parse(content);
                var errorMessage = errorObj["error"]?["message"]?.ToString();
                if (errorMessage?.Contains("SambaNova") == true)
                {
                    // Return empty string to allow fallback behavior
                    return string.Empty;
                }
                throw new Exception($"OpenRouter API request failed: {errorMessage ?? "Unknown error"}");
            }

            try
            {
                var result = JObject.Parse(content);
                return result["choices"]?[0]?["message"]?["content"]?.ToString() ?? string.Empty;
            }
            catch
            {
                return string.Empty;
            }
        }

        private static async Task<string> GetOllamaResponse(string model, string prompt, string base64Data, string ollamaUrl,
            float temperature, int maxTokens, float topP, int topK, float repeatPenalty, int seed, string systemPrompt)
        {
            var requestData = new JObject
            {
                ["model"] = model,
                ["prompt"] = prompt,
                ["images"] = new JArray { base64Data },
                ["stream"] = false,
                ["options"] = new JObject
                {
                    ["temperature"] = temperature,
                    ["top_p"] = topP,
                    ["top_k"] = topK,
                    ["num_predict"] = maxTokens,
                    ["repeat_penalty"] = repeatPenalty,
                    ["seed"] = seed
                }
            };

            if (!string.IsNullOrEmpty(systemPrompt))
            {
                requestData["system"] = systemPrompt;
            }

            var response = await client.PostAsync(
                $"{ollamaUrl}/api/generate",
                new StringContent(requestData.ToString(), System.Text.Encoding.UTF8, "application/json")
            );

            var content = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Ollama API request failed: {content}");
            }

            var result = JObject.Parse(content);
            return result["response"]?.ToString() ?? 
                throw new Exception("No response content from Ollama");
        }

        [API.APIDescription("Combines multiple analyses into a single cohesive prompt", "Returns the combined analysis prompt")]
        public static async Task<JObject> CombineAnalysesAsync(JObject data)
        {
            try
            {
                var styleAnalysis = data["styleAnalysis"]?.ToString();
                var subjectAnalysis = data["subjectAnalysis"]?.ToString();
                var settingAnalysis = data["settingAnalysis"]?.ToString();
                var model = data["model"]?.ToString();
                var backendType = data["backendType"]?.ToString() ?? "ollama";

                if (string.IsNullOrEmpty(styleAnalysis) || 
                    string.IsNullOrEmpty(subjectAnalysis) || 
                    string.IsNullOrEmpty(settingAnalysis))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "All three analyses are required"
                    };
                }

                // Create the prompt for combining the analyses
                var prompt = "You will be sent 3 image descriptions. You will combine them into one single prompt. Make sure you include enough details for each section for the style, subject, and setting. The prompt should be formatted for use in image generation. Respond with only the combined prompt, nothing else. Do not tell me you are giving me a prompt, just give me the prompt. Do not tell me about the mood or feeling. Only technical details no interpratations. If the Style Analysis contains details of a black and white image then strip all mention of color from the combined prompt except the black and white part." +
                            "Maintain the style-subject-setting structure, remove redundancies, combine the descriptions into one cohesive paragraph and ensure flow, and make it a single paragraph, keep the description descriptive but concise:\n\n" +
                            $"Style Analysis: {styleAnalysis}\n\n" +
                            $"Subject Analysis: {subjectAnalysis}\n\n" +
                            $"Setting Analysis: {settingAnalysis}";

                if (backendType == "openai")
                {
                    var apiKey = data["apiKey"]?.ToString();
                    if (string.IsNullOrEmpty(apiKey))
                    {
                        return new JObject { ["success"] = false, ["error"] = "OpenAI API key is required" };
                    }

                    var messages = new JArray
                    {
                        new JObject
                        {
                            ["role"] = "user",
                            ["content"] = prompt
                        }
                    };

                    var requestBody = new JObject
                    {
                        ["model"] = model,
                        ["messages"] = messages,
                        ["max_tokens"] = data["maxTokens"]?.ToObject<int>() ?? 500,
                        ["temperature"] = data["temperature"]?.ToObject<float>() ?? 0.8f,
                        ["top_p"] = data["topP"]?.ToObject<float>() ?? 0.7f,
                        ["frequency_penalty"] = data["frequencyPenalty"]?.ToObject<float>() ?? 0.0f,
                        ["presence_penalty"] = data["presencePenalty"]?.ToObject<float>() ?? 0.0f
                    };

                    var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
                    request.Headers.Add("Authorization", $"Bearer {apiKey}");
                    request.Content = new StringContent(requestBody.ToString(), System.Text.Encoding.UTF8, "application/json");

                    var response = await client.SendAsync(request);
                    var content = await response.Content.ReadAsStringAsync();

                    if (!response.IsSuccessStatusCode)
                    {
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = $"OpenAI request failed: {content}"
                        };
                    }

                    var result = JObject.Parse(content);
                    return new JObject
                    {
                        ["success"] = true,
                        ["response"] = result["choices"]?[0]?["message"]?["content"]?.ToString()
                    };
                }
                else if (backendType == "openrouter")
                {
                    var apiKey = data["apiKey"]?.ToString();
                    var siteName = data["siteName"]?.ToString() ?? "SwarmUI";

                    if (string.IsNullOrEmpty(apiKey))
                    {
                        return new JObject { ["success"] = false, ["error"] = "OpenRouter API key is required" };
                    }

                    var messages = new JArray
                    {
                        new JObject
                        {
                            ["role"] = "user",
                            ["content"] = prompt
                        }
                    };

                    var requestBody = new JObject
                    {
                        ["model"] = model,
                        ["messages"] = messages,
                        ["max_tokens"] = data["maxTokens"]?.ToObject<int>() ?? 500,
                        ["temperature"] = data["temperature"]?.ToObject<float>() ?? 0.8f,
                        ["top_p"] = data["topP"]?.ToObject<float>() ?? 0.7f,
                        ["top_k"] = data["topK"]?.ToObject<int>() ?? 40,
                        ["repetition_penalty"] = data["repeatPenalty"]?.ToObject<float>() ?? 1.1f
                    };

                    var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions");
                    request.Headers.Add("Authorization", $"Bearer {apiKey}");
                    request.Headers.Add("HTTP-Referer", "https://swarmui.local");
                    request.Headers.Add("X-Title", siteName);
                    request.Content = new StringContent(requestBody.ToString(), System.Text.Encoding.UTF8, "application/json");

                    var response = await client.SendAsync(request);
                    var content = await response.Content.ReadAsStringAsync();

                    if (!response.IsSuccessStatusCode)
                    {
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = $"OpenRouter request failed: {content}"
                        };
                    }

                    var result = JObject.Parse(content);
                    return new JObject
                    {
                        ["success"] = true,
                        ["response"] = result["choices"]?[0]?["message"]?["content"]?.ToString()
                    };
                }
                else // Ollama
                {
                    // Create request body for text-only operation
                    var requestBody = new JObject
                    {
                        ["model"] = model,
                        ["prompt"] = prompt,
                        ["options"] = new JObject
                        {
                            ["temperature"] = data["temperature"]?.ToObject<float>() ?? 0.8f,
                            ["top_p"] = data["topP"]?.ToObject<float>() ?? 0.7f,
                            ["top_k"] = data["topK"]?.ToObject<int>() ?? 40,
                            ["num_predict"] = data["maxTokens"]?.ToObject<int>() ?? 500,
                            ["repeat_penalty"] = data["repeatPenalty"]?.ToObject<float>() ?? 1.1f,
                            ["seed"] = data["seed"]?.ToObject<int>() ?? -1
                        }
                    };

                    var ollamaUrl = data["ollamaUrl"]?.ToString() ?? "http://localhost:11434";
                    var response = await client.PostAsync(
                        $"{ollamaUrl}/api/generate",
                        new StringContent(requestBody.ToString(), System.Text.Encoding.UTF8, "application/json")
                    );

                    if (!response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        Logs.Error($"Failed to combine analyses. Status: {response.StatusCode}, Content: {content}");
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = $"Failed to combine analyses: {content}"
                        };
                    }

                    var result = JObject.Parse(await response.Content.ReadAsStringAsync());
                    return new JObject
                    {
                        ["success"] = true,
                        ["response"] = result["response"]?.ToString()
                    };
                }
            }
            catch (Exception ex)
            {
                Logs.Error($"Error in CombineAnalysesAsync: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = ex.Message
                };
            }
        }

        [API.APIDescription("Gets a fusion prompt", "Returns the selected fusion prompt")]
        public static async Task<JObject> GetFusionPrompt(JObject data)
        {
            try
            {
                string preset = data["preset"]?.ToString();
                if (string.IsNullOrEmpty(preset))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "No preset specified"
                    };
                }

                if (!FUSION_PROMPTS.ContainsKey(preset))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "Invalid fusion preset name"
                    };
                }

                return new JObject
                {
                    ["success"] = true,
                    ["prompt"] = FUSION_PROMPTS[preset]
                };
            }
            catch (Exception ex)
            {
                Logs.Error($"Error in GetFusionPrompt: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = ex.Message
                };
            }
        }

        [API.APIDescription("Gets the story prompt", "Returns the prompt used for story generation")]
        public static async Task<JObject> GetStoryPrompt(JObject data)
        {
            try
            {
                return new JObject
                {
                    ["success"] = true,
                    ["prompt"] = STORY_PROMPT
                };
            }
            catch (Exception ex)
            {
                Logs.Error($"Error in GetStoryPrompt: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = ex.Message
                };
            }
        }
    }
} 