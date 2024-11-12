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
        private static string DEFAULT_PROMPT = "Give a brief, detailed description of this image. Make it all one paragraph and format it for image generation prompts.";
        
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
            API.RegisterAPICall(GetResponsePrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(SaveResponsePrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(GetPresetPrompt, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(UnloadModelAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            API.RegisterAPICall(UnloadModelWithKeepAliveAsync, false, OllamaVisionPermissions.PermUseOllamaVision);
            Logs.Info("OllamaVision API calls registered successfully.");
        }

        [API.APIDescription("Gets the current response prompt setting", "Returns the current prompt used for image analysis")]
        public static async Task<JObject> GetResponsePrompt(JObject data)
        {
            try 
            {
                return new JObject
                {
                    ["success"] = true,
                    ["prompt"] = DEFAULT_PROMPT
                };
            }
            catch (Exception ex)
            {
                Logs.Error($"Error in GetResponsePrompt: {ex.Message}");
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

        [API.APIDescription("Saves the response prompt setting", "Returns success status of saving the prompt")]
        public static async Task<JObject> SaveResponsePrompt(JObject data)
        {
            try
            {
                DEFAULT_PROMPT = data["prompt"]?.ToString() ?? DEFAULT_PROMPT;
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
                var response = await client.GetAsync("http://localhost:11434/api/tags");
                
                if (!response.IsSuccessStatusCode)
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = $"Failed to connect to Ollama. Status code: {response.StatusCode}"
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

        [API.APIDescription("Analyzes an image using Ollama vision models", "Returns the AI's analysis of the image")]
        public static async Task<JObject> AnalyzeImageAsync(JObject data)
        {
            try
            {
                var imageData = data["imageData"]?.ToString();
                var model = data["model"]?.ToString();

                if (string.IsNullOrEmpty(imageData) || string.IsNullOrEmpty(model))
                {
                    return new JObject
                    {
                        ["success"] = false,
                        ["error"] = "Missing required parameters (imageData or model)"
                    };
                }

                string base64Data;
                if (imageData.StartsWith("data:image"))
                {
                    base64Data = imageData.Split(',')[1];
                }
                else
                {
                    base64Data = imageData;
                }

                var requestBody = new JObject
                {
                    ["model"] = model,
                    ["prompt"] = DEFAULT_PROMPT,
                    ["images"] = new JArray { base64Data },
                    ["stream"] = false
                };

                return await SendOllamaRequest(requestBody);
            }
            catch (Exception ex)
            {
                Logs.Error($"Error analyzing image: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = ex.Message
                };
            }
        }

        private static async Task<JObject> SendOllamaRequest(JObject requestBody)
        {
            try
            {
                var response = await client.PostAsync(
                    "http://localhost:11434/api/generate",
                    new StringContent(requestBody.ToString(), System.Text.Encoding.UTF8, "application/json")
                );

                var content = await response.Content.ReadAsStringAsync();
                Logs.Debug($"Ollama response: {content}");

                if (!response.IsSuccessStatusCode)
                {
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
            catch (Exception ex)
            {
                Logs.Error($"Error in SendOllamaRequest: {ex.Message}");
                return new JObject
                {
                    ["success"] = false,
                    ["error"] = $"Request failed: {ex.Message}"
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

        [API.APIDescription("Unloads a model by setting keep_alive to 0", "Returns success status of unloading the model")]
        public static async Task<JObject> UnloadModelWithKeepAliveAsync(JObject data)
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

                // First check if the model is loaded using /api/show
                var showResponse = await client.PostAsync(
                    "http://localhost:11434/api/show",
                    new StringContent(JsonConvert.SerializeObject(new { name = model }), System.Text.Encoding.UTF8, "application/json")
                );

                if (!showResponse.IsSuccessStatusCode)
                {
                    // If show request fails, model might not be loaded anyway
                    return new JObject
                    {
                        ["success"] = true,
                        ["response"] = "Model not loaded or already unloaded"
                    };
                }

                // If model is loaded, send a minimal request to unload it
                var requestBody = new JObject
                {
                    ["model"] = model,
                    ["prompt"] = "exit",  // Minimal prompt
                    ["keep_alive"] = 0
                };

                var response = await client.PostAsync(
                    "http://localhost:11434/api/generate",
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