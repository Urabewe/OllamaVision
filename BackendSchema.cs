using System;
using System.IO;
using SwarmUI.Utils;
using System.Text.Json;
using Newtonsoft.Json.Linq;
using System.Net.Http;

namespace SwarmUI.Extensions.OllamaVision
{
    public static class BackendSchema
    {
        public static object GetVisionRequest(string imagePath, string prompt, string model)
        {
            if (string.IsNullOrEmpty(imagePath))
            {
                throw new ArgumentException("Image path cannot be null or empty.");
            }

            var imageBytes = File.ReadAllBytes(imagePath);
            var base64Image = Convert.ToBase64String(imageBytes);

            var content = new object[]
            {
                new { type = "text", text = prompt },
                new { type = "image", image = base64Image }
            };

            var messages = new object[]
            {
                new
                {
                    role = "user",
                    content = content
                }
            };

            return new
            {
                model = model,
                messages = messages,
                stream = false
            };
        }

        public static string DeserializeResponse(HttpResponseMessage response)
        {
            try
            {
                string responseContent = response.Content.ReadAsStringAsync().Result;
                Logs.Debug($"Response content: {responseContent}");
                
                var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var ollamaResponse = JsonSerializer.Deserialize<OllamaResponse>(responseContent, jsonOptions);
                
                if (ollamaResponse?.Message != null)
                {
                    return ollamaResponse.Message.Content;
                }
                
                Logs.Error("Message object is null in the Ollama response.");
                return null;
            }
            catch (Exception ex)
            {
                Logs.Error($"Error deserializing response: {ex.Message}");
                return null;
            }
        }

        private class OllamaResponse
        {
            public Message Message { get; set; }
        }

        private class Message
        {
            public string Content { get; set; }
        }
    }
} 