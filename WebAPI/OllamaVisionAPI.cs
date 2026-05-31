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
using System.Text;
using System.Net.Http.Headers;

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
        private static readonly HttpClient client = new HttpClient() { Timeout = TimeSpan.FromMinutes(5) };
        private const string DefaultOpenAIBaseUrl = "https://api.openai.com/v1";
        
        private static readonly Dictionary<string, string> PRESET_PROMPTS = new Dictionary<string, string>
        {
            ["Default"] = "Describe this image in a single, detailed paragraph optimized for image generation prompts. Focus on key visual elements, including subjects, setting, colors, and mood, with precise and descriptive wording suitable for AI-generated art.",
            ["Detailed Analysis"] = "Provide an in-depth analysis of this image, covering composition, lighting, colors, subjects, perspective, and overall mood. Structure the description as a comprehensive breakdown suitable for detailed image recreation in AI models.",
            ["Simple Description"] = "Summarize this image in two concise sentences, focusing on its most notable visual details and main subjects.",
            ["Artistic Style"] = "Describe this image using artistic terminology, focusing on visual style, medium, techniques, brushwork (if applicable), composition, and artistic influences. Provide details relevant to recreating the image in a specific artistic manner.",
            ["Technical Details"] = "Analyze this image from a technical perspective, including camera angle, focal length, depth of field, lighting setup, composition rules (e.g., rule of thirds, leading lines), and any photographic or cinematic techniques used.",
            ["Color Palette"] = "Describe the color palette of this image in detail, listing all dominant and secondary colors, their shades and tones, and any notable patterns or color harmonies present. Avoid mentioning anything unrelated to colors.",
            ["Facial Features"] = "Provide an extremely detailed description of the subject's facial features, including skin tone, hair color, eye color, eye shape, nose shape, facial structure, beauty marks, freckles, moles, blemishes, and any other defining traits. Do not include any details beyond facial features.",
            ["Danbooru Tags"] = "Analyze this image and provide tag descriptions in the style of Danbooru or a booru image board. Format the output as a comma-separated list of tags, using underscores between words in multi-word tags (e.g., 'blue_hair'). Focus on character traits, clothing, accessories, settings, and actions. Begin with rating tags like 'safe', 'questionable', or 'explicit' based on content. Include meta tags for art style, medium, and aesthetic. Example: 'safe, 1girl, blue_eyes, blonde_hair, dress, forest, night, standing, looking_at_viewer, tree, solo'",
            ["Lora Natural"] = "Describe this image in detail for training a Lora model. Focus on consistent visual elements like character features, clothing styles, artistic techniques, or environmental attributes that define this particular style or subject. Be comprehensive but concise, using clear descriptive language that would help distinguish this subject or style from others. Format as a single detailed paragraph with strong, specific descriptors.",
        };

        private static readonly Dictionary<string, string> FUSION_PROMPTS = new Dictionary<string, string>
        {
            ["Style Analysis"] = "Only respond about the style of the image do not respond about who what when or where: focus solely on technical and artistic characteristics such as the color palette (e.g., vibrant, muted, monochromatic, pastel, etc.), lighting (e.g., soft, dramatic, high contrast, natural, etc.), camera angle or perspective (e.g., wide shot, close-up, bird's-eye view, etc.), artistic or photographic techniques used (e.g., brushstroke style, texture, sharpness, depth of field, etc.), if the artist is using a specific style, if the artist is a known artist mention it, and the overall mood or aesthetic conveyed; do not include any details about the subject, setting, or other contextual information. Focus only on the visual and stylistic elements.",
            ["Subject Analysis"] = "Analyze the image and provide a detailed description of its subject, only respond about who or what is in the image: focus exclusively on who or what is depicted, including their physical characteristics, colors, textures, shapes, poses, expressions, or any notable features; ensuring the focus remains solely on the subject; do not include any information about the artistic style, setting, background, or other contextual elements.",
            ["Setting Analysis"] = "Analyze the image and provide a thorough description of its setting, do not respond about who or what is in the image or the overall style of the image: focus entirely on the environment and location, including natural elements like landscapes, terrain, vegetation, bodies of water, and skies, as well as man-made structures such as buildings, roads, and objects within the scene; describe the weather, time of day, lighting conditions, colors, and textures that define the surroundings; include spatial details like depth, scale, and perspective; do not include any information about the subject (who or what is depicted) or the artistic style, techniques, or visual effects used in the image.",
            ["Object Analysis"] = @"Analyze the image and provide a detailed description of the object: focus exclusively on the physical object itself, what the object is, what it is made of, the material, textures, and any distinctive features or characteristics; do not mention any setting, or any background elements; do not include any information about artistic style, techniques, or the environment around the object. Describe the object as if you wanted to tell someone what the object is but not it's shape or if it is a character. Include specific details about:\n\n 1. Materials and surface qualities\n 2. Textures and tactile qualities\n 3. Physical condition and wear (if visible)\n\n Keep the description focused solely on the object Do not interpret its purpose, meaning, or context. Do not mention anything in the background or surrounding environment."
        };

        private static readonly List<string> PRESET_ORDER = new List<string>
        {
            "Default",
            "Simple Description",
            "Detailed Analysis",
            "Artistic Style",
            "Technical Details",
            "Color Palette",
            "Facial Features",
            "Danbooru Tags",
            "Lora Natural"
        };

        private static readonly string STORY_PROMPT = @"Craft a fully developed story inspired entirely by the provided image. Use the scene, characters, and mood depicted in the image as the central focus of the narrative. The story must have a clear structure, including an intriguing beginning, a compelling middle, and a satisfying resolution. Set the scene vividly, introduce the main characters and the central conflict or goal, and develop the plot with engaging challenges, interactions, and events that drive the narrative forward. Resolve the story with closure that ties together the themes and character arcs. Use rich, descriptive language to bring the scene, characters, and events to life, balancing dialogue, action, and description to create a dynamic and immersive narrative. Incorporate variety and creativity in storytelling approaches, such as comedy, fantasy, adventure, or mystery, while keeping all content appropriate and family-friendly. Avoid any offensive, controversial, or sensitive material. Do not include commentary about the image itself; focus solely on crafting a story based on the image's elements. The story should have a word count of 2,000–3,000 words and feel polished, complete, and original, with emotional resonance and creativity.";

        public static void Register()
        {
            Logs.Info("Registering OllamaVision API calls...");
            API.RegisterAPICall(ConnectToOllamaAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(AnalyzeImageAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(EnhanceTextPromptAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(GetUserPrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(SaveUserPrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(GetPresetPrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(GetFusionPrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(UnloadModelAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(CombineAnalysesAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(GetStoryPrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(GenerateCharacterAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(ConnectToTextGenAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(LoadTextGenModelAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(BatchCaptionImagesAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(UnloadLMStudioModelAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(FetchOpenAIModelsAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
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
                string preset = data["preset"]?.ToString();
                Logs.Debug($"GetPresetPrompt called, preset={(string.IsNullOrEmpty(preset) ? "(list)" : preset)}");

                if (string.IsNullOrEmpty(preset))
                {
                    var presetList = new JArray();
                    foreach (string orderedPreset in PRESET_ORDER)
                    {
                        presetList.Add(orderedPreset);
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
                Logs.Debug($"Ollama model list received ({TruncateForLog(content, 200)})");

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
                    var maxTokens = Math.Max(-1, Math.Min(4096, data["maxTokens"]?.ToObject<int?>() ?? -1));
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

                    // Add TextGen WebUI handling
                    if (backendType == "textgen")
                    {
                        var textgenUrl = data["textgenUrl"]?.ToString() ?? "http://localhost:5000";
                        
                        // Ensure URL has http:// or https:// prefix
                        if (!textgenUrl.StartsWith("http://") && !textgenUrl.StartsWith("https://"))
                        {
                            textgenUrl = "http://" + textgenUrl;
                        }
                        
                        // Remove trailing slash if present
                        textgenUrl = textgenUrl.TrimEnd('/');

                        var messages = new JArray();
                        
                        // Add system prompt if provided
                        var systemPrompt = data["systemPrompt"]?.ToString()?.Trim();
                        if (!string.IsNullOrEmpty(systemPrompt))
                        {
                            messages.Add(new JObject
                            {
                                ["role"] = "system",
                                ["content"] = systemPrompt
                            });
                        }

                        // Add user message with image first, then prompt
                        messages.Add(new JObject
                        {
                            ["role"] = "user",
                            ["content"] = new JArray {
                                new JObject {
                                    ["type"] = "image_url",
                                    ["image_url"] = base64Data
                                },
                                new JObject {
                                    ["type"] = "text",
                                    ["text"] = prompt
                                }
                            }
                        });

                        var requestBody = new JObject
                        {
                            ["model"] = model,
                            ["messages"] = messages,
                            ["stream"] = false
                        };

                        var response = await client.PostAsync(
                            $"{textgenUrl}/v1/chat/completions",
                            new StringContent(requestBody.ToString(), System.Text.Encoding.UTF8, "application/json")
                        );

                        var content = await response.Content.ReadAsStringAsync();

                        if (!response.IsSuccessStatusCode)
                        {
                            Logs.Error($"OobaBooga image analysis failed. Status: {response.StatusCode}, Content: {TruncateForLog(content)}");
                            return new JObject
                            {
                                ["success"] = false,
                                ["error"] = FormatHttpErrorForClient("Failed to analyze image with OobaBooga WebUI", response.StatusCode)
                            };
                        }

                        var result = JObject.Parse(content);
                        var rawContent = result["choices"]?[0]?["message"]?["content"]?.ToString();
                        var (visible, thinking) = StripThinkingTokens(rawContent);
                        var jobj = new JObject { ["success"] = true, ["response"] = visible };
                        if (!string.IsNullOrEmpty(thinking)) jobj["thinkingContent"] = thinking;
                        return jobj;
                    }

                    // Handle different backends
                    if (backendType == "openai")
                    {
                        var apiKey = data["apiKey"]?.ToString();
                        var apiBaseUrl = NormalizeApiBaseUrl(data["apiBaseUrl"]?.ToString());
                        if (RequiresOpenAIApiKey(apiBaseUrl) && string.IsNullOrEmpty(apiKey))
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

                        return await SendApiRequest(apiRequestBody, "openai", apiKey, apiBaseUrl);
                    }
                    else if (backendType == "openrouter")
                    {
                        var apiKey = data["apiKey"]?.ToString();
                        var siteName = data["siteName"]?.ToString();
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

                        return await SendApiRequest(apiRequestBody, "openrouter", apiKey, null, siteName);
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
                            Logs.Error($"Ollama analysis failed. Status: {response.StatusCode}, Content: {TruncateForLog(content)}");
                            
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
                                ["error"] = FormatHttpErrorForClient("Failed to analyze image", response.StatusCode)
                            };
                        }

                        var result = JObject.Parse(content);
                        var rawResponse = result["response"]?.ToString();
                        var (visible, thinking) = StripThinkingTokens(rawResponse);
                        var jobj = new JObject { ["success"] = true, ["response"] = visible };
                        if (!string.IsNullOrEmpty(thinking)) jobj["thinkingContent"] = thinking;
                        return jobj;
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

        private static async Task<JObject> SendApiRequest(
            JObject requestBody,
            string backendType,
            string apiKey,
            string apiBaseUrl = null,
            string siteName = null)
        {
            try 
            {
                string endpoint;
                if (backendType == "openai")
                {
                    var baseUrl = NormalizeApiBaseUrl(apiBaseUrl);
                    if (RequiresOpenAIApiKey(baseUrl) && string.IsNullOrWhiteSpace(apiKey))
                    {
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = "OpenAI API key is required"
                        };
                    }

                    endpoint = $"{baseUrl}/chat/completions";
                }
                else
                {
                    endpoint = "https://openrouter.ai/api/v1/chat/completions";
                }

                var request = new HttpRequestMessage(HttpMethod.Post, endpoint);

                if (!string.IsNullOrWhiteSpace(apiKey))
                {
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                }

                if (backendType == "openrouter")
                {
                    request.Headers.Add("HTTP-Referer", "https://swarmui.local");
                    request.Headers.Add("X-Title", string.IsNullOrWhiteSpace(siteName) ? "SwarmUI" : siteName);
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
                    Logs.Error($"API request failed ({backendType}). Status: {response.StatusCode}, Content: {TruncateForLog(content)}");
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = FormatHttpErrorForClient($"{backendType} API request failed", response.StatusCode)
                    };
                }

                var result = JObject.Parse(content);
                var rawContent = result["choices"]?[0]?["message"]?["content"]?.ToString();
                var (visible, thinking) = StripThinkingTokens(rawContent);
                var jobj = new JObject { ["success"] = true, ["response"] = visible };
                if (!string.IsNullOrEmpty(thinking)) jobj["thinkingContent"] = thinking;
                return jobj;
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

        private static string NormalizeApiBaseUrl(string baseUrl)
        {
            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                return DefaultOpenAIBaseUrl;
            }

            var trimmed = baseUrl.Trim();

            if (!trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
                !trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                trimmed = $"http://{trimmed}";
            }

            return trimmed.TrimEnd('/');
        }

        private static string TruncateForLog(string text, int maxLen = 500)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return "";
            }
            string trimmed = text.Trim();
            if (trimmed.Length <= maxLen)
            {
                return trimmed;
            }
            return trimmed.Substring(0, maxLen) + "...";
        }

        private static string FormatHttpErrorForClient(string action, System.Net.HttpStatusCode status)
        {
            return $"{action} (HTTP {(int)status} {status}).";
        }

        /// <summary>
        /// Strips think blocks so visible response can be returned separately from thinking.
        /// </summary>
        private static (string visible, string thinking) StripThinkingTokens(string text)
        {
            if (string.IsNullOrEmpty(text)) return (text, null);
            const string thinkStart = "\u003cthink\u003e";
            const string thinkEnd = "\u003c/think\u003e";
            int start = text.IndexOf(thinkStart, StringComparison.OrdinalIgnoreCase);
            if (start < 0) return (text.Trim(), null);
            int end = text.IndexOf(thinkEnd, start + thinkStart.Length, StringComparison.OrdinalIgnoreCase);
            if (end < 0) return (text.Trim(), null);
            string visible = (text.Substring(0, start) + text.Substring(end + thinkEnd.Length)).Trim();
            string thinking = text.Substring(start + thinkStart.Length, end - start - thinkStart.Length).Trim();
            return (visible, thinking);
        }

        private static bool RequiresOpenAIApiKey(string baseUrl)
        {
            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                return true;
            }

            return baseUrl.IndexOf("openai.com", StringComparison.OrdinalIgnoreCase) >= 0;
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

                // Get custom Ollama URL if provided, otherwise default to localhost
                string ollamaUrl = data["ollamaUrl"]?.ToString() ?? "http://localhost:11434";
                
                // Ensure URL has no trailing slash
                ollamaUrl = ollamaUrl.TrimEnd('/');

                // Check if keep_alive was provided directly
                var keepAlive = data["keep_alive"]?.ToObject<int?>() ?? 0;

                // Create the request with options matching how Ollama expects them
                var requestBody = new JObject
                {
                    ["model"] = model,
                    ["prompt"] = " ", // Minimal prompt
                    ["stream"] = false,
                    ["keep_alive"] = "0"
                };

                var response = await client.PostAsync(
                    $"{ollamaUrl}/api/generate",
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
                    Logs.Error($"Failed to unload model. Status: {response.StatusCode}, Content: {TruncateForLog(content)}");
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = FormatHttpErrorForClient("Failed to unload model", response.StatusCode)
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

        [API.APIDescription("Requests LM Studio to unload the active model", "Returns the status of the unload request")]
        public static async Task<JObject> UnloadLMStudioModelAsync(JObject data)
        {
            try
            {
                var baseUrl = NormalizeApiBaseUrl(data["baseUrl"]?.ToString());
                var apiKey = data["apiKey"]?.ToString();
                var instanceId = data["instanceId"]?.ToString();

                if (string.IsNullOrWhiteSpace(instanceId))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "No LM Studio instance id provided."
                    };
                }

                var rootUrl = baseUrl;
                if (rootUrl.EndsWith("/v1", StringComparison.OrdinalIgnoreCase))
                {
                    rootUrl = rootUrl.Substring(0, rootUrl.Length - 3);
                }

                var unloadRequest = new HttpRequestMessage(HttpMethod.Post, $"{rootUrl}/api/v1/models/unload");
                unloadRequest.Content = new StringContent(
                    new JObject
                    {
                        ["instance_id"] = instanceId
                    }.ToString(),
                    Encoding.UTF8,
                    "application/json"
                );

                if (!string.IsNullOrWhiteSpace(apiKey))
                {
                    unloadRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                }

                var unloadResponse = await client.SendAsync(unloadRequest);
                var unloadContent = await unloadResponse.Content.ReadAsStringAsync();

                if (!unloadResponse.IsSuccessStatusCode)
                {
                    Logs.Error($"LM Studio unload failed. Status: {unloadResponse.StatusCode}, Content: {TruncateForLog(unloadContent)}");
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = FormatHttpErrorForClient("LM Studio unload failed", unloadResponse.StatusCode)
                    };
                }

                return new JObject
                {
                    ["success"] = true,
                    ["message"] = "LM Studio model unloaded successfully."
                };
            }
            catch (Exception ex)
            {
                Logs.Error($"Error unloading LM Studio model: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = "Failed to unload LM Studio model: " + ex.Message
                };
            }
        }

        [API.APIDescription("Fetches models from an OpenAI-compatible endpoint", "Returns the available model list")]
        public static async Task<JObject> FetchOpenAIModelsAsync(JObject data)
        {
            try
            {
                var baseUrl = NormalizeApiBaseUrl(data["baseUrl"]?.ToString());
                var apiKey = data["apiKey"]?.ToString();

                var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/models");

                if (!string.IsNullOrWhiteSpace(apiKey))
                {
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                }

                var response = await client.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Logs.Error($"FetchOpenAIModelsAsync failed: {response.StatusCode} - {TruncateForLog(content)}");
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = FormatHttpErrorForClient("Failed to fetch models", response.StatusCode)
                    };
                }

                var result = JObject.Parse(content);
                return new JObject
                {
                    ["success"] = true,
                    ["models"] = result["data"] ?? new JArray()
                };
            }
            catch (Exception ex)
            {
                Logs.Error($"Error in FetchOpenAIModelsAsync: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = "Failed to fetch models: " + ex.Message
                };
            }
        }


        [API.APIDescription("Combines multiple analyses into a single cohesive prompt", "Returns the combined analysis prompt")]
        public static async Task<JObject> CombineAnalysesAsync(JObject data)
        {
            try
            {
                var fusionType = data["fusionType"]?.ToString() ?? "style-subject-setting";
                var prompt = "";
                var model = data["model"]?.ToString();
                var backendType = data["backendType"]?.ToString() ?? "ollama";

                if (fusionType == "object-subject")
                {
                    var objectAnalysis = data["objectAnalysis"]?.ToString();
                    var subjectAnalysis = data["subjectAnalysis"]?.ToString();

                    if (string.IsNullOrEmpty(objectAnalysis) || string.IsNullOrEmpty(subjectAnalysis))
                    {
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = "Both object and subject analyses are required"
                        };
                    }

                    prompt = @"Image Prompt Generation Guidelines

You will be provided with two image descriptions:

Object Analysis – Describes what the object is. Avoid details about its shape, context, background, mood, or feelings. Only focus on what the object is.
Subject Analysis – Describes the subject's appearance, colors, clothing, and other defining traits. Avoid setting details, background elements, mood, or emotions.
Task:
Combine the two descriptions into a single, cohesive image generation prompt that:

Transforms the object into the subject's form or
Incorporates the subject's image onto the object
Guidelines:

If the object is wearable (e.g., a t-shirt), place the subject's image on it.
If the object is a figurine, plush toy, or sculpture, transform it into the subject.
If the object is something like a car, furniture, or large structure, vary between applying the subject's design onto the object like an image or decal or reshaping the object into the subject's form.
Keep the prompt in a general-purpose AI image generation style, around 150 tokens or 200 words.
Do not say things like transform the or change the combine the prompt like the user has never seen the original two images.
Example:
Object: A skateboard
Subject: A red-scaled dragon with golden eyes, large wings, and black tribal markings on its body.

Prompt Output:
A sleek skateboard featuring an intricate design of a red-scaled dragon with golden eyes, large wings, and bold black tribal markings. The dragon's powerful form stretches across the deck, with its wings wrapping around the edges, giving the board a dynamic, fierce aesthetic. High-quality airbrushed artwork with crisp details, glowing highlights on the scales, and a slightly metallic sheen on the golden eyes.

OR

A skateboard reshaped into the form of a red-scaled dragon. The deck takes on a sleek, curved body with detailed black tribal markings across its surface. The wheels seamlessly blend into clawed feet, and the head extends forward with piercing golden eyes. Wings curve along the sides, giving the skateboard an aerodynamic, mythical design.

Object Analysis: " + objectAnalysis + "\n\n" +
"Subject Analysis: " + subjectAnalysis;
                }
                else
                {
                    var styleAnalysis = data["styleAnalysis"]?.ToString();
                    var subjectAnalysis = data["subjectAnalysis"]?.ToString();
                    var settingAnalysis = data["settingAnalysis"]?.ToString();

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
                    prompt = @"You will be sent three image descriptions: Style Analysis, Subject Analysis, and Setting Analysis.

Your task is to combine these into a single cohesive prompt for image generation. Follow these rules:

Keep your response to 150 token or around 200 words.

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
                }

                // Handle different backends
                if (backendType == "textgen")
                {
                    var textgenUrl = data["textgenUrl"]?.ToString() ?? "http://localhost:5000";
                    
                    // Ensure URL has http:// or https:// prefix
                    if (!textgenUrl.StartsWith("http://") && !textgenUrl.StartsWith("https://"))
                    {
                        textgenUrl = "http://" + textgenUrl;
                    }
                    
                    // Remove trailing slash if present
                    textgenUrl = textgenUrl.TrimEnd('/');

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
                        ["max_tokens"] = data["maxTokens"]?.ToObject<int>() ?? -1,
                        ["temperature"] = data["temperature"]?.ToObject<float>() ?? 0.8f,
                        ["top_p"] = data["topP"]?.ToObject<float>() ?? 0.7f,
                        ["stream"] = false
                    };

                    var response = await client.PostAsync(
                        $"{textgenUrl}/v1/chat/completions",
                        new StringContent(requestBody.ToString(), System.Text.Encoding.UTF8, "application/json")
                    );

                    var content = await response.Content.ReadAsStringAsync();
                    if (!response.IsSuccessStatusCode)
                    {
                        Logs.Error($"OobaBooga combine request failed. Status: {response.StatusCode}, Content: {TruncateForLog(content)}");
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = FormatHttpErrorForClient("OobaBooga request failed", response.StatusCode)
                        };
                    }

                    var result = JObject.Parse(content);
                    var rawContent = result["choices"]?[0]?["message"]?["content"]?.ToString();
                    var (visible, thinking) = StripThinkingTokens(rawContent);
                    var jobj = new JObject { ["success"] = true, ["response"] = visible };
                    if (!string.IsNullOrEmpty(thinking)) jobj["thinkingContent"] = thinking;
                    return jobj;
                }
                else if (backendType == "openai")
                {
                    var apiKey = data["apiKey"]?.ToString();
                    var apiBaseUrl = NormalizeApiBaseUrl(data["apiBaseUrl"]?.ToString());
                    if (RequiresOpenAIApiKey(apiBaseUrl) && string.IsNullOrEmpty(apiKey))
                    {
                        return new JObject { ["success"] = false, ["error"] = "OpenAI API key is required" };
                    }

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
                        ["max_tokens"] = data["maxTokens"]?.ToObject<int>() ?? -1,
                        ["temperature"] = data["temperature"]?.ToObject<float>() ?? 0.8f,
                        ["top_p"] = data["topP"]?.ToObject<float>() ?? 0.7f,
                        ["frequency_penalty"] = data["frequencyPenalty"]?.ToObject<float>() ?? 0.0f,
                        ["presence_penalty"] = data["presencePenalty"]?.ToObject<float>() ?? 0.0f
                    };

                    return await SendApiRequest(requestBody, "openai", apiKey, apiBaseUrl);
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
                        ["max_tokens"] = data["maxTokens"]?.ToObject<int>() ?? -1,
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
                        Logs.Error($"OpenRouter combine request failed. Status: {response.StatusCode}, Content: {TruncateForLog(content)}");
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = FormatHttpErrorForClient("OpenRouter request failed", response.StatusCode)
                        };
                    }

                    var result = JObject.Parse(content);
                    var rawContent = result["choices"]?[0]?["message"]?["content"]?.ToString();
                    var (visible, thinking) = StripThinkingTokens(rawContent);
                    var jobj = new JObject { ["success"] = true, ["response"] = visible };
                    if (!string.IsNullOrEmpty(thinking)) jobj["thinkingContent"] = thinking;
                    return jobj;
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
                            ["num_predict"] = data["maxTokens"]?.ToObject<int>() ?? -1,
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
                        Logs.Error($"Failed to combine analyses. Status: {response.StatusCode}, Content: {TruncateForLog(content)}");
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = FormatHttpErrorForClient("Failed to combine analyses", response.StatusCode)
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

                    var (visible, thinking) = StripThinkingTokens(combinedResponse);
                    var jobj = new JObject { ["success"] = true, ["response"] = visible };
                    if (!string.IsNullOrEmpty(thinking)) jobj["thinkingContent"] = thinking;
                    return jobj;
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

        [API.APIDescription("Generates a character using LLM", "Returns the generated character details")]
        public static async Task<JObject> GenerateCharacterAsync(JObject data)
        {
            try
            {
                var model = data["model"]?.ToString();
                var backendType = data["backendType"]?.ToString() ?? "ollama";
                var prompt = data["prompt"]?.ToString();

                if (string.IsNullOrEmpty(model) || string.IsNullOrEmpty(prompt))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "Missing required parameters (model or prompt)"
                    };
                }

                // Handle different backends
                if (backendType == "textgen")
                {
                    var textgenUrl = data["textgenUrl"]?.ToString() ?? "http://localhost:5000";
                    
                    // Ensure URL has http:// or https:// prefix
                    if (!textgenUrl.StartsWith("http://") && !textgenUrl.StartsWith("https://"))
                    {
                        textgenUrl = "http://" + textgenUrl;
                    }
                    
                    // Remove trailing slash if present
                    textgenUrl = textgenUrl.TrimEnd('/');

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
                        ["max_tokens"] = data["maxTokens"]?.ToObject<int>() ?? -1,
                        ["temperature"] = data["temperature"]?.ToObject<float>() ?? 0.8f,
                        ["top_p"] = data["topP"]?.ToObject<float>() ?? 0.7f,
                        ["stream"] = false
                    };

                    var response = await client.PostAsync(
                        $"{textgenUrl}/v1/chat/completions",
                        new StringContent(requestBody.ToString(), System.Text.Encoding.UTF8, "application/json")
                    );

                    var content = await response.Content.ReadAsStringAsync();
                    if (!response.IsSuccessStatusCode)
                    {
                        Logs.Error($"OobaBooga character request failed. Status: {response.StatusCode}, Content: {TruncateForLog(content)}");
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = FormatHttpErrorForClient("OobaBooga request failed", response.StatusCode)
                        };
                    }

                    var result = JObject.Parse(content);
                    var rawContent = result["choices"]?[0]?["message"]?["content"]?.ToString();
                    var (visible, thinking) = StripThinkingTokens(rawContent);
                    var jobj = new JObject { ["success"] = true, ["response"] = visible };
                    if (!string.IsNullOrEmpty(thinking)) jobj["thinkingContent"] = thinking;
                    return jobj;
                }
                else if (backendType == "openai")
                {
                    var apiKey = data["apiKey"]?.ToString();
                    var apiBaseUrl = NormalizeApiBaseUrl(data["apiBaseUrl"]?.ToString());
                    if (RequiresOpenAIApiKey(apiBaseUrl) && string.IsNullOrEmpty(apiKey))
                    {
                        return new JObject { ["success"] = false, ["error"] = "OpenAI API key is required" };
                    }

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
                        ["max_tokens"] = data["maxTokens"]?.ToObject<int>() ?? -1,
                        ["temperature"] = data["temperature"]?.ToObject<float>() ?? 0.8f,
                        ["top_p"] = data["topP"]?.ToObject<float>() ?? 0.7f,
                        ["frequency_penalty"] = data["frequencyPenalty"]?.ToObject<float>() ?? 0.0f,
                        ["presence_penalty"] = data["presencePenalty"]?.ToObject<float>() ?? 0.0f
                    };

                    return await SendApiRequest(requestBody, "openai", apiKey, apiBaseUrl);
                }
                else if (backendType == "openrouter")
                {
                    var apiKey = data["apiKey"]?.ToString();
                    var siteName = data["siteName"]?.ToString();
                    if (string.IsNullOrEmpty(apiKey))
                    {
                        return new JObject { ["success"] = false, ["error"] = "OpenRouter API key is required" };
                    }

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
                        ["max_tokens"] = data["maxTokens"]?.ToObject<int>() ?? -1,
                        ["temperature"] = data["temperature"]?.ToObject<float>() ?? 0.8f,
                        ["top_p"] = data["topP"]?.ToObject<float>() ?? 0.7f,
                        ["top_k"] = data["topK"]?.ToObject<int>() ?? 40,
                        ["repetition_penalty"] = data["repeatPenalty"]?.ToObject<float>() ?? 1.1f,
                        ["frequency_penalty"] = data["frequencyPenalty"]?.ToObject<float>() ?? 0.0f,
                        ["presence_penalty"] = data["presencePenalty"]?.ToObject<float>() ?? 0.0f
                    };

                    return await SendApiRequest(requestBody, "openrouter", apiKey, null, siteName);
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
                            ["num_predict"] = data["maxTokens"]?.ToObject<int>() ?? -1,
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
                        Logs.Error($"Ollama character generation failed. Status: {response.StatusCode}, Content: {TruncateForLog(content)}");
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = FormatHttpErrorForClient("Failed to generate character", response.StatusCode)
                        };
                    }

                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JObject.Parse(responseContent);
                    var rawResponse = result["response"]?.ToString();
                    var (visible, thinking) = StripThinkingTokens(rawResponse);
                    var jobj = new JObject { ["success"] = true, ["response"] = visible };
                    if (!string.IsNullOrEmpty(thinking)) jobj["thinkingContent"] = thinking;
                    return jobj;
                }
            }
            catch (Exception ex)
            {
                Logs.Error($"Error in GenerateCharacterAsync: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = ex.Message
                };
            }
        }

        [API.APIDescription("Connects to TextGen WebUI and retrieves available models", "Returns list of available models")]
        public static async Task<JObject> ConnectToTextGenAsync(JObject data)
        {
            using (var client = new HttpClient())
            {
                try
                {
                    string textgenUrl = data["textgenUrl"]?.ToString() ?? "http://localhost:5000";

                    if (!textgenUrl.StartsWith("http://") && !textgenUrl.StartsWith("https://"))
                    {
                        textgenUrl = "http://" + textgenUrl;
                    }

                    textgenUrl = textgenUrl.TrimEnd('/');

                    // Add proper headers as per OobaBooga documentation
                    client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));

                    var response = await client.GetAsync($"{textgenUrl}/v1/internal/model/list");
                    response.EnsureSuccessStatusCode();

                    var content = await response.Content.ReadAsStringAsync();
                    var result = JObject.Parse(content);
                    var models = result["model_names"] as JArray;

                    if (models == null)
                    {
                        throw new Exception("Invalid response format from OobaBooga WebUI: missing model_names array");
                    }

                    return new JObject
                    {
                        ["success"] = true,
                        ["models"] = models
                    };
                }
                catch (Exception ex)
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = $"Failed to connect to OobaBooga WebUI: {ex.Message}"
                    };
                }
            }
        }

        [API.APIDescription("Loads a model in TextGen WebUI", "Returns success status of loading the model")]
        public static async Task<JObject> LoadTextGenModelAsync(JObject data)
        {
            using (var client = new HttpClient())
            {
                try
                {
                    string textgenUrl = data["textgenUrl"]?.ToString() ?? "http://localhost:5000";
                    string model = data["model"]?.ToString();

                    if (string.IsNullOrEmpty(model))
                    {
                        throw new ArgumentException("Model name is required");
                    }

                    if (!textgenUrl.StartsWith("http://") && !textgenUrl.StartsWith("https://"))
                    {
                        textgenUrl = "http://" + textgenUrl;
                    }

                    textgenUrl = textgenUrl.TrimEnd('/');

                    // Add proper headers as per OobaBooga documentation
                    client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));

                    var content = new StringContent(
                        JsonConvert.SerializeObject(new { model_name = model }),
                        Encoding.UTF8,
                        "application/json"
                    );

                    var response = await client.PostAsync($"{textgenUrl}/v1/internal/model/load", content);
                    response.EnsureSuccessStatusCode();

                    return new JObject
                    {
                        ["success"] = true,
                        ["message"] = $"Model {model} loaded successfully"
                    };
                }
                catch (Exception ex)
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = $"Failed to load model: {ex.Message}"
                    };
                }
            }
        }

        private static JObject ValidateAndStandardizeParams(JObject data)
        {
            try
            {
                // Extract and validate base parameters
                var model = data["model"]?.ToString();
                var backendType = data["backendType"]?.ToString()?.ToLower() ?? "ollama";
                var imageData = data["imageData"]?.ToString();
                var prompt = data["prompt"]?.ToString();
                var systemPrompt = data["systemPrompt"]?.ToString()?.Trim();

                // Validate required parameters
                if (string.IsNullOrEmpty(model))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "Missing required parameter: model"
                    };
                }

                if (string.IsNullOrEmpty(imageData))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "Missing required parameter: imageData"
                    };
                }

                // Clean base64 data for Ollama
                if (backendType == "ollama" && imageData.StartsWith("data:"))
                {
                    var base64Start = imageData.IndexOf(",") + 1;
                    imageData = imageData.Substring(base64Start);
                }

                // Standardize common parameters with defaults
                var standardParams = new JObject
                {
                    ["model"] = model,
                    ["backendType"] = backendType,
                    ["imageData"] = imageData,
                    ["prompt"] = prompt,
                    ["systemPrompt"] = systemPrompt,
                    ["temperature"] = Math.Max(0, Math.Min(2, data["temperature"]?.ToObject<float?>() ?? 0.8f)),
                    ["maxTokens"] = Math.Max(-1, Math.Min(4096, data["maxTokens"]?.ToObject<int?>() ?? -1)),
                    ["topP"] = Math.Max(0, Math.Min(1, data["topP"]?.ToObject<float?>() ?? 0.7f))
                };

                // Add backend-specific parameters
                switch (backendType)
                {
                    case "openai":
                    case "openrouter":
                        standardParams["frequencyPenalty"] = Math.Max(-2.0f, Math.Min(2.0f, data["frequencyPenalty"]?.ToObject<float?>() ?? 0.0f));
                        standardParams["presencePenalty"] = Math.Max(-2.0f, Math.Min(2.0f, data["presencePenalty"]?.ToObject<float?>() ?? 0.0f));
                        if (backendType == "openrouter")
                        {
                            standardParams["repeatPenalty"] = Math.Max(0.0f, Math.Min(2.0f, data["repeatPenalty"]?.ToObject<float?>() ?? 1.1f));
                            standardParams["topK"] = Math.Max(0, Math.Min(100, data["topK"]?.ToObject<int?>() ?? 40));
                            standardParams["minP"] = Math.Max(0.0f, Math.Min(1.0f, data["minP"]?.ToObject<float?>() ?? 0.0f));
                            standardParams["topA"] = Math.Max(0.0f, Math.Min(1.0f, data["topA"]?.ToObject<float?>() ?? 0.0f));
                            standardParams["seed"] = data["seed"]?.ToObject<int?>() ?? -1;
                        }
                        break;
                    case "ollama":
                        standardParams["seed"] = data["seed"]?.ToObject<int?>() ?? -1;
                        standardParams["topK"] = Math.Max(0, Math.Min(100, data["topK"]?.ToObject<int?>() ?? 40));
                        standardParams["repeatPenalty"] = Math.Max(0.0f, Math.Min(2.0f, data["repeatPenalty"]?.ToObject<float?>() ?? 1.1f));
                        standardParams["ollamaUrl"] = data["ollamaUrl"]?.ToString() ?? "http://localhost:11434";
                        break;
                }

                standardParams["success"] = true;
                return standardParams;
            }
            catch (Exception ex)
            {
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = $"Parameter validation failed: {ex.Message}"
                };
            }
        }

        [API.APIDescription("Captions multiple images in a directory for Lora training", "Returns success status and caption details")]
        public static async Task<JObject> BatchCaptionImagesAsync(JObject data)
        {
            try
            {
                // Extract and validate required parameters
                var folderPath = data["folderPath"]?.ToString();
                var captionStyle = data["captionStyle"]?.ToString() ?? "Danbooru Tags";
                var triggerWord = data["triggerWord"]?.ToString() ?? "";
                var model = data["model"]?.ToString();
                var backendType = data["backendType"]?.ToString() ?? "ollama";
                
                if (string.IsNullOrEmpty(folderPath))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "No folder path specified"
                    };
                }

                if (string.IsNullOrEmpty(model))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "No model specified"
                    };
                }

                // Make sure folder exists
                if (!Directory.Exists(folderPath))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "Folder not found. Verify the path exists and is accessible to the SwarmUI server."
                    };
                }

                // Get all images in folder
                var imageFiles = Directory.GetFiles(folderPath, "*.*")
                    .Where(file => {
                        var ext = Path.GetExtension(file).ToLower();
                        return ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".webp" || ext == ".bmp";
                    })
                    .ToList();

                if (imageFiles.Count == 0)
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "No image files found in the specified folder"
                    };
                }

                // Determine which prompt to use based on captionStyle
                string promptTemplate;
                
                if (captionStyle == "Danbooru Tags")
                {
                    promptTemplate = PRESET_PROMPTS["Danbooru Tags"];
                }
                else 
                {
                    promptTemplate = PRESET_PROMPTS["Lora Natural"];
                }

                // Set up the response with initial data
                var progressResponse = new JObject
                {
                    ["success"] = true,
                    ["total"] = imageFiles.Count,
                    ["inProgress"] = true,
                    ["processed"] = 0,
                    ["successful"] = 0,
                    ["failed"] = 0,
                    ["results"] = new JArray()
                };

                // Process each image - but now we'll use a different approach to allow for incremental updates
                var successCount = 0;
                var errorCount = 0;
                var processedCount = 0;

                // Create a list for all results that will be returned at the end
                var allResults = new JArray();

                // Here's where we process the images one by one
                foreach (var imageFile in imageFiles)
                {
                    try
                    {
                        // Extract file name and prepare caption file path
                        var fileName = Path.GetFileNameWithoutExtension(imageFile);
                        var captionFile = Path.Combine(folderPath, fileName + ".txt");
                        
                        var resultItem = new JObject
                        {
                            ["fileName"] = fileName
                        };

                        // Skip if caption file already exists
                        if (File.Exists(captionFile))
                        {
                            resultItem["status"] = "skipped";
                            resultItem["message"] = "Caption file already exists";
                            allResults.Add(resultItem);
                            continue;
                        }

                        // Read image file and convert to base64
                        var imageBytes = File.ReadAllBytes(imageFile);
                        var base64Image = Convert.ToBase64String(imageBytes);

                        // Prepare request to analyze image
                        var imageRequest = new JObject
                        {
                            ["prompt"] = promptTemplate,
                            ["imageData"] = base64Image,
                            ["model"] = model,
                            ["backendType"] = backendType
                        };

                        // Copy all relevant parameters from original request
                        foreach (var param in data.Properties())
                        {
                            if (param.Name != "folderPath" && param.Name != "captionStyle" && param.Name != "triggerWord" && 
                                param.Name != "imageData" && param.Name != "prompt" && 
                                !imageRequest.ContainsKey(param.Name))
                            {
                                imageRequest[param.Name] = param.Value;
                            }
                        }

                        // Make sure systemPrompt is included in each request
                        if (data["systemPrompt"] != null && !imageRequest.ContainsKey("systemPrompt"))
                        {
                            imageRequest["systemPrompt"] = data["systemPrompt"];
                        }

                        // Process the image
                        var analysisResult = await AnalyzeImageAsync(imageRequest);
                        
                        processedCount++;
                        
                        if (analysisResult["success"]?.ToObject<bool>() == true)
                        {
                            var caption = analysisResult["response"]?.ToString();
                            
                            if (!string.IsNullOrEmpty(caption))
                            {
                                // Add trigger word if provided
                                if (!string.IsNullOrEmpty(triggerWord))
                                {
                                    caption = triggerWord + ", " + caption;
                                }
                                
                                // Write caption to file
                                File.WriteAllText(captionFile, caption);
                                
                                resultItem["status"] = "success";
                                resultItem["caption"] = caption;
                                
                                successCount++;
                            }
                            else
                            {
                                resultItem["status"] = "error";
                                resultItem["message"] = "Empty caption generated";
                                errorCount++;
                            }
                        }
                        else
                        {
                            resultItem["status"] = "error";
                            resultItem["message"] = analysisResult["error"]?.ToString() ?? "Unknown error";
                            errorCount++;
                        }

                        // Add this result to our collection
                        allResults.Add(resultItem);
                        
                        // Create an incremental update response
                        var updateResponse = new JObject
                        {
                            ["success"] = true,
                            ["total"] = imageFiles.Count,
                            ["inProgress"] = true,
                            ["processed"] = processedCount,
                            ["successful"] = successCount,
                            ["failed"] = errorCount,
                            ["results"] = new JArray { resultItem }
                        };
                        
                        // Send update through SignalR or other real-time mechanism
                        // This is where you would need to add code to send the updateResponse
                        // using a real-time communication method
                        // For example: await hubContext.Clients.Client(connectionId).SendAsync("BatchCaptionUpdate", updateResponse);
                    }
                    catch (Exception ex)
                    {
                        var resultItem = new JObject
                        {
                            ["fileName"] = Path.GetFileNameWithoutExtension(imageFile),
                            ["status"] = "error",
                            ["message"] = ex.Message
                        };
                        
                        allResults.Add(resultItem);
                        errorCount++;
                        processedCount++;
                    }
                }

                // Return the final complete response
                return new JObject
                {
                    ["success"] = true,
                    ["total"] = imageFiles.Count,
                    ["inProgress"] = false,
                    ["processed"] = processedCount,
                    ["successful"] = successCount,
                    ["failed"] = errorCount,
                    ["results"] = allResults
                };
            }
            catch (Exception ex)
            {
                Logs.Error($"Error in BatchCaptionImagesAsync: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = ex.Message
                };
            }
        }

        [API.APIDescription("Processes text prompts using vision models for enhancement", "Returns the AI's enhanced version of the text prompt")]
        public static async Task<JObject> EnhanceTextPromptAsync(JObject data)
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

                // Extract and validate all model settings
                var model = data["model"]?.ToString();
                var backendType = data["backendType"]?.ToString() ?? "ollama";
                var ollamaUrl = data["ollamaUrl"]?.ToString() ?? "http://localhost:11434";

                // Parse common model settings
                var temperature = Math.Max(0, Math.Min(2, data["temperature"]?.ToObject<float?>() ?? 0.8f));
                var maxTokens = Math.Max(-1, Math.Min(4096, data["maxTokens"]?.ToObject<int?>() ?? -1));
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

                // Add TextGen WebUI handling
                if (backendType == "textgen")
                {
                    var textgenUrl = data["textgenUrl"]?.ToString() ?? "http://localhost:5000";
                    
                    // Ensure URL has http:// or https:// prefix
                    if (!textgenUrl.StartsWith("http://") && !textgenUrl.StartsWith("https://"))
                    {
                        textgenUrl = "http://" + textgenUrl;
                    }
                    
                    // Remove trailing slash if present
                    textgenUrl = textgenUrl.TrimEnd('/');

                    var messages = new JArray();
                    
                    // Add system prompt if provided
                    var textgenSystemPrompt = data["systemPrompt"]?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(textgenSystemPrompt))
                    {
                        messages.Add(new JObject
                        {
                            ["role"] = "system",
                            ["content"] = textgenSystemPrompt
                        });
                    }
                    
                    // Add user prompt
                    if (!string.IsNullOrEmpty(prompt))
                    {
                        messages.Add(new JObject
                        {
                            ["role"] = "user",
                            ["content"] = prompt
                        });
                    }

                    var requestData = new JObject
                    {
                        ["mode"] = "chat",
                        ["character"] = "Assistant",
                        ["instruction_template"] = "None",
                        ["your_name"] = "You",
                        ["context"] = "",
                        ["regenerate"] = false,
                        ["stream"] = false,
                        ["_continue"] = false,
                        ["stop_at_newline"] = false,
                        ["chat_prompt_size"] = 2048,
                        ["max_new_tokens"] = maxTokens > 0 ? maxTokens : 2048,
                        ["temperature"] = temperature,
                        ["top_p"] = topP,
                        ["top_k"] = data["topK"]?.ToObject<int?>() ?? 40,
                        ["repeat_penalty"] = data["repeatPenalty"]?.ToObject<float?>() ?? 1.1f,
                        ["presence_penalty"] = data["presencePenalty"]?.ToObject<float?>() ?? 0.0f,
                        ["frequency_penalty"] = data["frequencyPenalty"]?.ToObject<float?>() ?? 0.0f,
                        ["tfs"] = 1.0f,
                        ["top_a"] = data["topA"]?.ToObject<float?>() ?? 0.0f,
                        ["min_p"] = data["minP"]?.ToObject<float?>() ?? 0.0f,
                        ["typical_p"] = 1.0f,
                        ["epsilon_cutoff"] = 0.0f,
                        ["eta_cutoff"] = 0.0f,
                        ["guidance_scale"] = 1.0f,
                        ["penalty_alpha"] = 0.0f,
                        ["mirostat_mode"] = 0,
                        ["mirostat_tau"] = 5.0f,
                        ["mirostat_eta"] = 0.1f,
                        ["add_bos_token"] = true,
                        ["ban_eos_token"] = false,
                        ["skip_special_tokens"] = true,
                        ["stopping_strings"] = new JArray()
                    };

                    var jsonContent = JsonConvert.SerializeObject(requestData);
                    var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                    var response = await client.PostAsync($"{textgenUrl}/v1/chat/completions", content);
                    var responseContent = await response.Content.ReadAsStringAsync();

                    if (!response.IsSuccessStatusCode)
                    {
                        Logs.Error($"TextGen prompt enhance failed. Status: {response.StatusCode}, Content: {TruncateForLog(responseContent)}");
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = FormatHttpErrorForClient("TextGen WebUI API error", response.StatusCode)
                        };
                    }

                    var jsonResponse = JsonConvert.DeserializeObject<JObject>(responseContent);
                    var generatedText = jsonResponse["choices"]?[0]?["message"]?["content"]?.ToString();

                    if (string.IsNullOrEmpty(generatedText))
                    {
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = "No response generated from TextGen WebUI"
                        };
                    }

                    var (visibleText, thinkingText) = StripThinkingTokens(generatedText);
                    var resultObj = new JObject { ["success"] = true, ["response"] = visibleText };
                    if (!string.IsNullOrEmpty(thinkingText)) resultObj["thinkingContent"] = thinkingText;
                    return resultObj;
                }

                // OpenAI handling
                if (backendType == "openai")
                {
                    var apiKey = data["apiKey"]?.ToString();
                    var apiBaseUrl = NormalizeApiBaseUrl(data["apiBaseUrl"]?.ToString());
                    if (RequiresOpenAIApiKey(apiBaseUrl) && string.IsNullOrEmpty(apiKey))
                    {
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = "Missing OpenAI API key"
                        };
                    }

                    var messages = new JArray();
                    
                    // Add system prompt if provided
                    var openaiSystemPrompt = data["systemPrompt"]?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(openaiSystemPrompt))
                    {
                        messages.Add(new JObject
                        {
                            ["role"] = "system",
                            ["content"] = openaiSystemPrompt
                        });
                    }
                    
                    // Add user prompt
                    if (!string.IsNullOrEmpty(prompt))
                    {
                        messages.Add(new JObject
                        {
                            ["role"] = "user",
                            ["content"] = prompt
                        });
                    }

                    var requestData = new JObject
                    {
                        ["model"] = model,
                        ["messages"] = messages,
                        ["temperature"] = temperature,
                        ["max_tokens"] = maxTokens > 0 ? maxTokens : 2048,
                        ["top_p"] = topP,
                        ["frequency_penalty"] = data["frequencyPenalty"]?.ToObject<float?>() ?? 0.0f,
                        ["presence_penalty"] = data["presencePenalty"]?.ToObject<float?>() ?? 0.0f
                    };

                    var openAiResponse = await SendApiRequest(requestData, "openai", apiKey, apiBaseUrl);
                    if (openAiResponse?["success"]?.ToObject<bool>() == true)
                    {
                        return openAiResponse;
                    }

                    return openAiResponse ?? new JObject
                    {
                        ["success"] = false,
                        ["error"] = "Failed to communicate with the OpenAI-compatible API"
                    };
                }

                // OpenRouter handling
                if (backendType == "openrouter")
                {
                    var apiKey = data["apiKey"]?.ToString();
                    var siteName = data["siteName"]?.ToString();
                    
                    if (string.IsNullOrEmpty(apiKey))
                    {
                        return new JObject
                        {
                            ["success"] = false,
                            ["error"] = "Missing OpenRouter API key"
                        };
                    }

                    var messages = new JArray();
                    
                    // Add system prompt if provided
                    var openrouterSystemPrompt = data["systemPrompt"]?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(openrouterSystemPrompt))
                    {
                        messages.Add(new JObject
                        {
                            ["role"] = "system",
                            ["content"] = openrouterSystemPrompt
                        });
                    }
                    
                    // Add user prompt
                    if (!string.IsNullOrEmpty(prompt))
                    {
                        messages.Add(new JObject
                        {
                            ["role"] = "user",
                            ["content"] = prompt
                        });
                    }

                    var requestData = new JObject
                    {
                        ["model"] = model,
                        ["messages"] = messages,
                        ["temperature"] = temperature,
                        ["max_tokens"] = maxTokens > 0 ? maxTokens : 2048,
                        ["top_p"] = topP,
                        ["top_k"] = data["topK"]?.ToObject<int?>() ?? 40,
                        ["repeat_penalty"] = data["repeatPenalty"]?.ToObject<float?>() ?? 1.1f,
                        ["frequency_penalty"] = data["frequencyPenalty"]?.ToObject<float?>() ?? 0.0f,
                        ["presence_penalty"] = data["presencePenalty"]?.ToObject<float?>() ?? 0.0f,
                        ["min_p"] = data["minP"]?.ToObject<float?>() ?? 0.0f,
                        ["top_a"] = data["topA"]?.ToObject<float?>() ?? 0.0f,
                        ["seed"] = data["seed"]?.ToObject<int?>() ?? -1
                    };

                    return await SendApiRequest(requestData, "openrouter", apiKey, null, siteName);
                }

                // Ollama handling (default)
                // For Ollama, prepend system prompt to user prompt since Ollama doesn't have separate system messages
                var ollamaSystemPrompt = data["systemPrompt"]?.ToString()?.Trim();
                var ollamaPrompt = prompt;
                if (!string.IsNullOrEmpty(ollamaSystemPrompt))
                {
                    ollamaPrompt = $"{ollamaSystemPrompt}\n\nUser: {prompt}";
                }
                
                var ollamaRequestData = new JObject
                {
                    ["model"] = model,
                    ["prompt"] = ollamaPrompt,
                    ["stream"] = false,
                    ["options"] = new JObject
                    {
                        ["temperature"] = temperature,
                        ["num_predict"] = maxTokens > 0 ? maxTokens : 2048,
                        ["top_p"] = topP,
                        ["top_k"] = data["topK"]?.ToObject<int?>() ?? 40,
                        ["repeat_penalty"] = data["repeatPenalty"]?.ToObject<float?>() ?? 1.1f,
                        ["seed"] = data["seed"]?.ToObject<int?>() ?? -1
                    }
                };

                var ollamaJsonContent = JsonConvert.SerializeObject(ollamaRequestData);
                var ollamaContent = new StringContent(ollamaJsonContent, Encoding.UTF8, "application/json");

                var ollamaResponse = await client.PostAsync($"{ollamaUrl}/api/generate", ollamaContent);
                var ollamaResponseContent = await ollamaResponse.Content.ReadAsStringAsync();

                if (!ollamaResponse.IsSuccessStatusCode)
                {
                    Logs.Error($"Ollama prompt enhance failed. Status: {ollamaResponse.StatusCode}, Content: {TruncateForLog(ollamaResponseContent)}");
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = FormatHttpErrorForClient("Ollama API error", ollamaResponse.StatusCode)
                    };
                }

                var ollamaJsonResponse = JsonConvert.DeserializeObject<JObject>(ollamaResponseContent);
                var ollamaGeneratedText = ollamaJsonResponse["response"]?.ToString();

                if (string.IsNullOrEmpty(ollamaGeneratedText))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "No response generated from Ollama"
                    };
                }

                var (visible, thinking) = StripThinkingTokens(ollamaGeneratedText);
                var jobj = new JObject { ["success"] = true, ["response"] = visible };
                if (!string.IsNullOrEmpty(thinking)) jobj["thinkingContent"] = thinking;
                return jobj;
            }
            catch (Exception ex)
            {
                Logs.Error($"Error in EnhanceTextPromptAsync: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = ex.Message
                };
            }
        }
    }
} 