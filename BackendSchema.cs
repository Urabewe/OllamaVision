using System;
using System.IO;
using SwarmUI.Utils;
using Newtonsoft.Json.Linq;
using System.Net.Http;

namespace SwarmUI.Extensions.OllamaVision
{
    public static class BackendSchema
    {
        private class ContentItem
        {
            public string type { get; set; }
            public string text { get; set; }
            public string image { get; set; }
        }

        private class Message
        {
            public string role { get; set; }
            public ContentItem[] content { get; set; }
        }

        public static object GetVisionRequest(string imagePath, string prompt, string model)
        {
            if (string.IsNullOrEmpty(imagePath))
            {
                throw new ArgumentException("Image path cannot be null or empty.", nameof(imagePath));
            }

            try
            {
                // Read and convert image in one step
                var content = new ContentItem[]
                {
                    new ContentItem { type = "text", text = prompt },
                    new ContentItem 
                    { 
                        type = "image", 
                        image = Convert.ToBase64String(File.ReadAllBytes(imagePath)) 
                    }
                };

                return new
                {
                    model,  // C# shorthand for model = model
                    messages = new Message[]
                    {
                        new Message
                        {
                            role = "user",
                            content = content
                        }
                    },
                    stream = false
                };
            }
            catch (Exception ex)
            {
                Logs.Error($"Error creating vision request: {ex.Message}");
                throw;
            }
        }

        public static string DeserializeResponse(HttpResponseMessage response)
        {
            try
            {
                var responseContent = response.Content.ReadAsStringAsync().Result;
                Logs.Debug($"Raw response: {responseContent}");
                return JObject.Parse(responseContent)["message"]?["content"]?.ToString();
            }
            catch (Exception ex)
            {
                Logs.Error($"Error deserializing response: {ex.Message}");
                return null;
            }
        }
    }
} 