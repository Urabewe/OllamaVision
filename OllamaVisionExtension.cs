using Urabewe.OllamaVision.WebAPI;
using SwarmUI.Core;
using SwarmUI.Utils;

namespace Urabewe.OllamaVision
{
    public class OllamaVisionExtension : Extension
    {
        public override void OnPreInit()
        {
            Logs.Info("OllamaVision Extension Version 1.0 started.");
            ScriptFiles.Add("Assets/ollamavision.js");
        }

        public override void OnInit()
        {
            OllamaVisionAPI.Register();
        }
    }
} 