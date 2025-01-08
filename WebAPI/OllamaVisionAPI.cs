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
            ["New Preset Name"] = "Your new preset prompt text here"
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

        public static void Register()
        {
            Logs.Info("Registering OllamaVision API calls...");
            API.RegisterAPICall(ConnectToOllamaAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(AnalyzeImageAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(GetUserPrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(SaveUserPrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(GetPresetPrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(UnloadModelAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
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
    }
} 