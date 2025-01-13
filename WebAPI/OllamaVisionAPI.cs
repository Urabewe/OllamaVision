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
            ["Style Analysis"] = "Only respond about the style of the image do not respond about who what when or where: focus solely on technical and artistic characteristics such as the color palette (e.g., vibrant, muted, monochromatic, pastel, etc.), lighting (e.g., soft, dramatic, high contrast, natural, etc.), camera angle or perspective (e.g., wide shot, close-up, bird's-eye view, etc.), artistic or photographic techniques used (e.g., brushstroke style, texture, sharpness, depth of field, etc.), if the artist is using a specific style, if the artist is a known artist mention it, and the overall mood or aesthetic conveyed; do not include any details about the subject, setting, or other contextual information. Focus only on the visual and stylistic elements.",
            ["Subject Analysis"] = "Analyze the image and provide a detailed description of its subject, only respond about who or what is in the image: focus exclusively on who or what is depicted, including their physical characteristics, colors, textures, shapes, poses, expressions, or any notable features; ensuring the focus remains solely on the subject; do not include any information about the artistic style, setting, background, or other contextual elements.",
            ["Setting Analysis"] = "Analyze the image and provide a thorough description of its setting, do not respond about who or what is in the image or the overall style of the image: focus entirely on the environment and location, including natural elements like landscapes, terrain, vegetation, bodies of water, and skies, as well as man-made structures such as buildings, roads, and objects within the scene; describe the weather, time of day, lighting conditions, colors, and textures that define the surroundings; include spatial details like depth, scale, and perspective; do not include any information about the subject (who or what is depicted) or the artistic style, techniques, or visual effects used in the image."
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

        private static readonly string STORY_PROMPT = @"Generate a fully developed story inspired solely by the provided image. Craft a vivid and engaging narrative that brings the scene, characters, and mood to life. Ensure the story has a clear structure: an intriguing beginning, a compelling middle, and a satisfying resolution. Use the main subject(s) and setting from the image as the central focus of the story. For known figures or characters, incorporate them into the narrative accordingly. Vary the genre and style with each response to ensure originality and diversity, alternating between genres like comedy, horror, sci-fi, fantasy, drama, adventure, and mystery. Tailor the narrative style to fit the chosen genre or add an unexpected twist for variety.\n\n### Guidelines:\n- Introduction: Set the scene with vivid descriptions, introduce the main character(s), and hint at the central conflict, mystery, or goal.\n- Main Story: Develop the plot through engaging events, challenges, or conflicts. Use dialogue and character interactions for depth.\n- Conclusion: Resolve the conflict or provide closure in a satisfying way.\n\n### Additional Notes:\n- Use vivid, descriptive language to create atmosphere and bring the setting, characters, and events to life.\n- Balance action, dialogue, and description for a dynamic narrative.\n- Aim for randomness and variety in genres and storytelling approaches, using techniques like shifting perspectives, unreliable narrators, or non-linear structures.\n- Avoid formulaic repetition; focus on originality and emotional resonance.\n\n### Output Specifications:\n- Word count: 2,000 to 3,000 words.\n- Ensure the story feels complete and polished with a clear beginning, middle, and end.\n- Base the narrative entirely on the visual elements of the image. Don't talk about the image, only return the story.\n Make the story as long as possible, but don't make it too long.";

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

                // Create a consistent prompt for all backends
                var prompt = @"You will be sent three image descriptions: Style Analysis, Subject Analysis, and Setting Analysis.

Your task is to combine these into a single cohesive prompt for image generation. Follow these rules:

Style Analysis:
Focus on technical details such as the color palette, lighting, camera angle, and art style.
Do not include anything about the subject or setting or any objects in the image.
Do not mention anything about the mood or feeling. Only technical details no interpretations.

Subject Analysis:
Describe the main focus of the image (who or what is depicted).
Include any color details from the subject description unless the style specifies a black-and-white or monochromatic image.
Do not include setting or style details.
Do not include anything about the background or environment.
Do not mention anything about the mood or feeling. Only technical details no interpretations.

Setting Analysis:
Describe the environment where the subject is located.
Include colors and visual elements from the setting unless the style specifies a black-and-white or monochromatic image.
Do not mention subject or style details.
Do not mention anything about the mood or feeling. Only technical details no interpretations.

Combine the three descriptions into a single paragraph in the style-subject-setting order. Ensure the final prompt is descriptive yet concise, eliminating redundancies and flowing naturally. Output only the combined prompt without commentary or explanation.

Style Analysis: " + styleAnalysis + "\n\n" +
"Subject Analysis: " + subjectAnalysis + "\n\n" +
"Setting Analysis: " + settingAnalysis;

                // Handle different backends
                if (backendType == "openai")
                {
                    var messages = new JArray();
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
                        ["content"] = prompt
                    });

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

                    var apiKey = data["apiKey"]?.ToString();
                    if (string.IsNullOrEmpty(apiKey))
                    {
                        return new JObject { ["success"] = false, ["error"] = "OpenAI API key is required" };
                    }

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
                    var messages = new JArray();
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
                        ["content"] = prompt
                    });

                    var requestBody = new JObject
                    {
                        ["model"] = model,
                        ["messages"] = messages,
                        ["max_tokens"] = data["maxTokens"]?.ToObject<int>() ?? 500,
                        ["temperature"] = data["temperature"]?.ToObject<float>() ?? 0.8f,
                        ["top_p"] = data["topP"]?.ToObject<float>() ?? 0.7f,
                        ["top_k"] = data["topK"]?.ToObject<int>() ?? 40,
                        ["repetition_penalty"] = data["repeatPenalty"]?.ToObject<float>() ?? 1.1f,
                        ["frequency_penalty"] = data["frequencyPenalty"]?.ToObject<float>() ?? 0.0f,
                        ["presence_penalty"] = data["presencePenalty"]?.ToObject<float>() ?? 0.0f
                    };

                    var apiKey = data["apiKey"]?.ToString();
                    var siteName = data["siteName"]?.ToString() ?? "SwarmUI";

                    if (string.IsNullOrEmpty(apiKey))
                    {
                        return new JObject { ["success"] = false, ["error"] = "OpenRouter API key is required" };
                    }

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
                    var requestBody = new JObject
                    {
                        ["model"] = model,
                        ["prompt"] = prompt,
                        ["stream"] = false,
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

                    // Add system prompt if provided
                    var systemPrompt = data["systemPrompt"]?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(systemPrompt))
                    {
                        requestBody["system"] = systemPrompt;
                    }

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

                    var responseContent = await response.Content.ReadAsStringAsync();
                    var responseLines = responseContent.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                    var combinedResponse = "";

                    // Process each line of the response
                    foreach (var line in responseLines)
                    {
                        try
                        {
                            var jsonResponse = JObject.Parse(line);
                            if (jsonResponse["response"] != null)
                            {
                                combinedResponse += jsonResponse["response"].ToString();
                            }
                        }
                        catch (JsonReaderException)
                        {
                            // If line isn't valid JSON, skip it
                            continue;
                        }
                    }

                    return new JObject
                    {
                        ["success"] = true,
                        ["response"] = combinedResponse
                    };
                }

                // ... rest of the method
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