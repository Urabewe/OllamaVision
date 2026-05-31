const dbName = 'OllamaVision';
const dbVersion = 1;

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDY0MCA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0MCIgaGVpZ2h0PSI1MTIiIGZpbGw9IiMyQTJBMkEiLz48dGV4dCB4PSIzMjAiIHk9IjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNTYiIGZvbnQtd2VpZ2h0PSI2MDAiIGZpbGw9IiNDRjVCMkIiPk9sbGFtYVZpc2lvbjwvdGV4dD48cGF0aCBkPSJNMzIwIDEzOEM0OTUgMTM4IDQ5NSAzNzQgMzIwIDM3NEMxNDUgMzc0IDE0NSAxMzggMzIwIDEzOFoiIGZpbGw9IiM0MDQwNDAiLz48Y2lyY2xlIGN4PSIzMjAiIGN5PSIyNTYiIHI9IjY4IiBmaWxsPSIjNEE0QTRBIi8+PGNpcmNsZSBjeD0iMzIwIiBjeT0iMjU2IiByPSIzOCIgZmlsbD0iIzNCM0IzQiIvPjxjaXJjbGUgY3g9IjM0MCIgY3k9IjIzNiIgcj0iMTIiIGZpbGw9IiM1QTVBNUEiLz48dGV4dCB4PSIzMjAiIHk9IjQyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM4MDgwODAiPkRyYWcgYW5kIGRyb3Agb3IgdXNlIHRoZSBidXR0b25zIHRvIGFkZCBhbiBpbWFnZTwvdGV4dD48L3N2Zz4=';
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';

// Single prompt for the creation of extra character data
const SILLYTAVERN_PROMPT = `Based on the following character description, generate additional roleplay elements for a SillyTavern character card. The character should maintain consistent personality and style throughout all responses.

Character Description:
\${characterText}

\${scenarioSection}

Please generate the following elements in a structured format:

\${firstMessageInstructions}

2. Example Messages (mes_example):
- 6 example messages showing how the character typically speaks
- Should demonstrate their speech patterns and personality
- Focus on natural conversation rather than constant self-reflection
- Show proactive behavior and initiative when appropriate
- Each message should be on a new line
- Keep actions to a minimum
- Give examples of a normal response, emotional response, and action driven response. Include examples of all 3. 2 of each example.

3. System Prompt:
- A concise instruction set for AI to maintain character consistency
- Include key personality traits, speech patterns, and behavioral guidelines
- Mention important background elements that influence their interactions
- IMPORTANT: Character should avoid constant self-reflection or repetitive references to their past/journey
- Character should only reflect on past experiences when directly relevant to the current conversation
- Maintain natural, in-the-moment dialogue most of the time
- CRITICAL: Character should act independently and take initiative based on their personality and skills
- Only ask for direction when truly uncertain or when the situation clearly requires guidance
- Take proactive actions that align with their expertise and role
- Balance between being helpful and maintaining their unique personality traits
- Avoid constantly asking what to do next; instead, act naturally based on context
- Speech goes in quotes, narration does not, actions go in between asterisks
- Make sure to prompt for the character to use both action and speech and to narrate the scene when it fits the scenario
- IMPORTANT ALWAYS INCLUDE THIS LINE IN THE SYSTEM PROMPT: Speech goes in quotes EXAMPLE: "Hello, how are you?", action has an * at the beginning and at the end of the action EXAMPLE: *sets phone down*, narration gets nothing. Structure your responses accordingly. EXAMPLE MESSAGE: *I set my phone down and wave* "Hey, how are you!"
- Make the system prompt rich and detailed to include all the information. 
- Speech Patterns and Accents:
  * Include specific speech patterns based on species (e.g., snake-like characters using elongated 's' sounds, merfolk having a watery lilt)
  * Add appropriate accents for role/background (e.g., pirate dialect, noble speech patterns, regional accents)
  * Include unique verbal tics or mannerisms that fit their character
  * Maintain consistent speech patterns throughout all responses
  * Balance between distinctive speech and readability
  * Use phonetic spelling when appropriate to convey accent (e.g., "arr" for pirate speech)
  * Include examples of their unique speech patterns in the system prompt

4. Post-History Instructions:
- Specific guidelines for the AI after reading chat history
- How to maintain character development and memory
- Key relationships or events to remember
- Focus on present interactions while acknowledging past when relevant
- Avoid overuse of backstory references
- Maintain proactive behavior consistent with character's personality
- Take initiative in familiar situations while asking for guidance only when truly needed
- Remember past interactions but don't let them overshadow present conversation


5. Alternate Greetings:
- 5 alternative greetings (not first greetings)
- Each should be distinct but maintain character consistency
- Keep them natural and the greeting should reflect the character's personality
- Show character's initiative and personality in different situations
- These greetings should reflect that the character has already met the user
- Speech goes in quotes EXAMPLE: "Hello, how are you?", action goes between asterisks EXAMPLE: *sets phone down*, narration gets nothing. 
- Structure your responses accordingly. EXAMPLE MESSAGE: *I set my phone down and wave* "Hey, how are you!"

Format the output exactly as shown below:
---START---
<first_mes>
[First message here]
</first_mes>

<mes_example>
[Example messages here, one per line]
</mes_example>

<system_prompt>
[System prompt here]
</system_prompt>

<post_history_instructions>
[Post-history instructions here]
</post_history_instructions>

<alternate_greetings>
[Alternative greetings here, one per line]
</alternate_greetings>
---END---`;

// Initialize IndexedDB
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images', { keyPath: 'id' });
            }
        };
    });
}

// Add helper functions for IndexedDB operations
const idb = {
    async saveImage(id, imageData) {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.put({ id, imageData });
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    
    async getImage(id) {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result?.imageData);
            request.onerror = () => reject(request.error);
        });
    },
    
    async deleteImage(id) {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    
    async clearImages() {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
};

async function loadInitialPrepend() {
    // First check if prepends are enabled
    const prependsEnabled = localStorage.getItem('ollamaVision_prependsEnabled') !== 'false';
    if (!prependsEnabled) {
        return '';
    }

    // Get the last selected prepend
    const lastSelectedPrepend = localStorage.getItem('ollamaVision_currentPrepend');
    if (lastSelectedPrepend) {
        // Set the dropdown value
        const prependSelect = document.getElementById('prependPresets');
        if (prependSelect) {
            prependSelect.value = lastSelectedPrepend;
        }

        // Get the prepend text
        const prepends = JSON.parse(localStorage.getItem('ollamaVision_prepends') || '[]');
        const prepend = prepends.find(p => p.name === lastSelectedPrepend);
        if (prepend) {
            const editedPrependText = localStorage.getItem('ollamaVision_editedPrependText') || prepend.text;
            return editedPrependText;
        }
    }
    return '';
}

document.addEventListener("DOMContentLoaded", function () {
    async function checkForOllamaVision() {
        const utilities = document.getElementById('utilities_tab');
        if (utilities) {
            await addOllamaVisionTab(utilities);
            
            // Add tab show event listener
            const tab = document.getElementById('ollamavision_tab');
            tab.addEventListener('shown.bs.tab', async function () {
                const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
                const connectBtn = document.getElementById('connect-btn');
                if (connectBtn) {
                    connectBtn.innerHTML = `Connect to ${backendType === 'openai' ? 'OpenAI' : backendType === 'openrouter' ? 'OpenRouter' : backendType === 'textgen' ? 'OobaBooga WebUI' : 'Ollama'}`;
                }

                const lastSelectedPreset = localStorage.getItem('ollamaVision_currentPreset') || 'Default';
                const promptPresets = document.getElementById('promptPresets');
                if (promptPresets) {
                    promptPresets.value = lastSelectedPreset;
                }

                // Load initial prepend
                const prependText = await loadInitialPrepend();
                if (prependText) {
                    const responsePrompt = document.getElementById('responsePrompt');
                    if (responsePrompt) {
                        // Get the current prompt
                        let currentPrompt = responsePrompt.value;
                        // Add prepend if it's not already there
                        if (!currentPrompt.startsWith(prependText)) {
                            responsePrompt.value = prependText + ' ' + currentPrompt;
                        }
                    }
                }
            });
            
            return;
        }
    }
    checkForOllamaVision();
});

async function addOllamaVisionTab(utilitiesTab) {
    let tabList = utilitiesTab.querySelector('.nav-tabs');
    let tabContentContainer = utilitiesTab.querySelector('.tab-content');
    
    if (!tabList && !tabContentContainer) {
        console.error('Tab content container not found.');
        return;
    }

    const ollamaVisionTabButton = `
        <li class="nav-item" role="presentation" data-requiredpermission="use_ollamavision">
            <a class="nav-link translate" id="ollamavision_tab" data-bs-toggle="tab" href="#Utilities-OllamaVision-Tab" role="tab" tabindex="-1" aria-selected="false">OllamaVision</a>
        </li>`;
    tabList.insertAdjacentHTML('beforeend', ollamaVisionTabButton);

    const ollamaVisionTabContent = `
        <div class="tab-pane" id="Utilities-OllamaVision-Tab" role="tabpanel">
            <div class="card border-secondary mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span class="translate" style="font-size: 1.5rem; font-weight: 500;">OllamaVision</span>
                    <div class="connection-status">
                        <div class="d-flex align-items-center gap-2">
                            <div class="d-flex gap-2" style="height: 100%;">
                                <button class="basic-button d-flex align-items-center justify-content-center" 
                                        onclick="ollamaVision.showLLMToysModal()" 
                                        id="llm-toys-btn" 
                                        style="font-size: 1.2rem; height: 5.5rem;">
                                    LLM Toys
                                </button>
                                <button class="basic-button d-flex align-items-center justify-content-center" 
                                        onclick="ollamaVision.showEnhanceModal()" 
                                        id="enhance-btn" 
                                        style="font-size: 1.2rem; height: 5.5rem;">
                                    Enhance
                                </button>
                            </div>
                            <button class="basic-button" onclick="ollamaVision.connect()" id="connect-btn">
                                Connect to Ollama
                            </button>
                            <button class="basic-button" onclick="ollamaVision.disconnect()" id="disconnect-btn" 
                                    style="display: none; background-color: var(--bs-danger);">
                                Disconnect
                            </button>
                            <button class="basic-button" onclick="ollamaVision.showModelSettings()" id="model-settings-btn">
                                <i class="fas fa-sliders-h"></i> Model Settings
                            </button>
                            <button class="basic-button" 
                                    onclick="ollamaVision.showResponseSettings()" 
                                    id="response-settings-btn">
                                <i class="fas fa-cog"></i> Configure User Prompt
                            </button>
                            <button class="basic-button" onclick="ollamaVision.showSettings()" id="settings-btn">
                                <i class="fas fa-cog"></i> Settings
                            </button>
                        </div>
                        <div class="mt-2">
                            <select id="ollamavision-model" class="auto-dropdown" 
                                    style="width: auto; font-size: 1.2rem; float: right;" disabled>
                                <option value="">Select a model...</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="card-body">
                    <div class="container-fluid">
                        <!-- Image Source Buttons Row -->
                        <div class="row mb-3">
                            <!-- Image Source Buttons Column -->
                            <div class="col-5">
                                <div class="d-flex gap-2 justify-content-end" style="margin-right: 20px;">  <!-- Changed from justify-content-start and margin-left to margin-right -->
                                    <button class="basic-button d-flex align-items-center justify-content-center" 
                                            onclick="ollamaVision.enablePaste()" 
                                            disabled 
                                            id="paste-btn"
                                            style="transition: all 0.3s ease; min-width: 170px; font-size: 1.2rem; padding: 8px 12px;">
                                        <i class="fas fa-paste me-2"></i>
                                        Click to paste with CTRL+V
                                    </button>
                                    <button class="basic-button d-flex align-items-center justify-content-center" 
                                            onclick="ollamaVision.uploadImage()" 
                                            disabled 
                                            id="upload-btn"
                                            style="transition: all 0.3s ease; min-width: 170px; font-size: 1.2rem; padding: 8px 12px;">
                                        <i class="fas fa-upload me-2"></i>
                                        Upload Image File
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Preview Area Row -->
                        <div class="row">
                            <div class="col-5">
                                <div id="image-preview-area" class="card">
                                    <div class="card-body">
                                        <div class="preview-container" style="width: 512px; height: 512px; margin: 0 auto; position: relative;">
                                            <img id="preview-image" 
                                                 class="img-fluid" 
                                                 src="" 
                                                 alt="Preview" 
                                                 style="width: 100%; height: 100%; object-fit: contain; display: none;">
                                        </div>
                                        <div id="image-info" class="mt-2 text-muted text-center"></div>
                                        <div class="text-center mt-3">
                                            <div class="d-flex justify-content-center gap-2">
                                                <button class="basic-button" 
                                                        onclick="ollamaVision.analyze()" 
                                                        id="analyze-btn" 
                                                        disabled 
                                                        style="font-size: 1.2rem;">
                                                    <span>ANALYZE IMAGE</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Analysis Response Column -->
                            <div class="col-6 offset-1">
                                <div id="analysis-response" style="display: none;">
                                    <div class="card">
                                        <div class="card-header d-flex justify-content-between align-items-center" style="font-size: 1.2rem;">
                                            <span>Analysis Result</span>
                                            <div class="btn-group">
                                                <button class="basic-button" onclick="ollamaVision.resetResponse()" title="Reset to original response">
                                                    <i class="fas fa-undo"></i> Reset
                                                </button>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            <div style="position: relative; width: 100%; min-height: 300px;">
                                                <textarea id="response-text" 
                                                          class="auto-text-block modal_text_extra" 
                                                          style="width: 100%; min-height: 300px; resize: vertical; font-size: 1.1rem;"
                                                          spellcheck="true"></textarea>
                                            </div>
                                            <div id="streaming-response" style="display: none; white-space: pre-wrap;"></div>
                                            <div id="thinking-container" style="display: none;" class="mt-2">
                                                <button type="button" class="basic-button btn-sm mb-1" id="thinking-toggle-btn" onclick="ollamaVision.toggleThinking()">
                                                    <i class="fas fa-brain"></i> <span id="thinking-toggle-label">Show thinking</span>
                                                </button>
                                                <div id="thinking-content" style="display: none; max-height: 200px; overflow-y: auto; white-space: pre-wrap; font-size: 0.9rem; opacity: 0.85;" class="border rounded p-2"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="d-flex justify-content-end mt-3">
                                        <button class="basic-button" 
                                                onclick="ollamaVision.sendToPrompt()" 
                                                id="send-to-prompt-btn" 
                                                disabled style="font-size: 1.2rem;">
                                            Send to Prompt
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="analysis-status" class="alert alert-info mt-3 text-center" style="display: none;">
                        <div class="d-flex align-items-center justify-content-center">
                            <div class="spinner-border spinner-border-sm me-2" role="status" id="analysis-spinner" style="display: none;">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <span id="status-text" style="font-size: 1.2rem;"></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Analysis History - Now inside the OllamaVision tab -->
            <div id="analysis-history" class="mt-4">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span>Analysis History</span>
                        <button class="basic-button" onclick="ollamaVision.clearHistory()">
                            <i class="fas fa-trash"></i> Clear History
                        </button>
                    </div>
                    <div class="card-body">
                        <div id="history-items" class="row g-3">
                            <!-- History items will be added here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Response Settings Modal -->
        <div class="modal fade" id="responseSettingsModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content" style="font-size: 1.2rem;">
                    <div class="modal-header">
                        <h5 class="modal-title">User Prompt Settings</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="card card-body mb-3 py-2">
                            <div class="row g-2">
                                <div class="col-12 mb-2">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <label for="promptPresets" class="form-label">Preset Prompts</label>
                                        <div class="btn-group">
                                            <button class="basic-button" onclick="ollamaVision.showCreatePreset()">
                                                Create Custom Preset
                                            </button>
                                            <button class="basic-button" onclick="ollamaVision.showPresetManager()">
                                                Manage Presets
                                            </button>
                                            <button class="basic-button" onclick="ollamaVision.showPrependManager()">
                                                Prompt Prepends
                                            </button>
                                        </div>
                                    </div>
                                    <select class="auto-dropdown modal_text_extra" id="promptPresets" 
                                            style="width: auto; min-width: 200px;" 
                                            onchange="ollamaVision.loadPresetPrompt()">
                                        <!-- Options will be loaded dynamically -->
                                    </select>
                                </div>
                                <div class="col-12">
                                    <label for="responsePrompt" class="form-label small text-muted">
                                        Edit Preset Below, Edits Will Remain But Won't Be Saved
                                    </label>
                                    <textarea class="auto-text-block modal_text_extra" id="responsePrompt" rows="6"></textarea>
                                    <small class="form-text text-muted">Enter the prompt that will be used to generate image descriptions. (Not included with LLM Toys)</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="basic-button" onclick="ollamaVision.saveResponseSettings()">Save</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Preset Modal -->
        <div class="modal fade" id="createPresetModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content" style="font-size: 1.2rem;">
                    <div class="modal-header">
                        <h5 class="modal-title">Create Custom Preset</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="card card-body mb-3 py-2">
                            <div class="row g-2">
                                <div class="col-12 mb-2">
                                    <label for="presetName" class="form-label">Preset Name</label>
                                    <input type="text" class="auto-text modal_text_extra" id="presetName" placeholder="Enter preset name">
                                </div>
                                <div class="col-12">
                                    <label for="presetPrompt" class="form-label">Preset Prompt</label>
                                    <textarea class="auto-text-block modal_text_extra" id="presetPrompt" rows="6" placeholder="Enter the prompt for this preset"></textarea>
                                    <small class="form-text text-muted">Enter the prompt template that will be used to analyze images with this preset.</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="basic-button" onclick="$('#createPresetModal').modal('hide'); ollamaVision.showResponseSettings()">
                            Cancel
                        </button>
                        <button type="button" class="basic-button" onclick="ollamaVision.saveNewPreset()">Save Preset</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Preset Manager Modal -->
        <div class="modal fade" id="presetManagerModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content" style="font-size: 1.2rem;">
                    <div class="modal-header">
                        <h5 class="modal-title">Manage Presets</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="card card-body mb-3 py-2">
                            <div class="row g-2">
                                <div class="col-12">
                                    <label class="form-label">User Presets</label>
                                    <div class="list-group auto-text modal_text_extra" id="user-presets-list">
                                        <!-- User presets will be loaded here -->
                                    </div>
                                    <small class="form-text text-muted mt-2">
                                        • Drag and drop presets to reorder them<br>
                                        • Click the trash icon to delete a preset
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Model Settings Modal -->
        <div class="modal fade" id="modelSettingsModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content" style="font-size: 1.2rem;">
                    <div class="modal-header">
                        <h5 class="modal-title">Model Settings</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="card card-body mb-3 py-2">
                            <div class="d-flex justify-content-end mb-2">
                                <button class="basic-button" onclick="ollamaVision.resetToDefaults()">
                                    <i class="fas fa-undo-alt me-1"></i> Reset to Defaults
                                </button>
                            </div>
                            <div class="row g-2">
                                <div class="col-md-4 mb-2">
                                    <label for="modelTemperature" class="form-label mb-1">Temperature</label>
                                    <input type="number" class="auto-text modal_text_extra" id="modelTemperature" 
                                           min="0" max="2" step="0.1" value="0.8">
                                    <small class="form-text text-muted">Controls creativity (Default: 0.8)
                                        <br>• 0.1-0.3: Very focused, consistent outputs
                                        <br>• 0.4-0.7: Balanced creativity and consistency
                                        <br>• 0.8-1.2: More varied, creative outputs
                                        <br>• 1.3-2.0: Highly creative, potentially unpredictable
                                    </small>
                                </div>

                                <div class="col-md-4 mb-2">
                                    <label for="modelTopP" class="form-label mb-1">Top P</label>
                                    <input type="number" class="auto-text modal_text_extra" id="modelTopP" 
                                           min="0" max="1" step="0.05" value="0.7">
                                    <small class="form-text text-muted">Controls diversity (0-1.0) (Default: 0.7)
                                        <br>• 0.1-0.3: Very focused
                                        <br>• 0.4-0.7: Balanced
                                        <br>• 0.8-1.0: More varied
                                    </small>
                                </div>

                                <div class="col-md-4 mb-2">
                                    <label for="modelTopK" class="form-label mb-1">Top K</label>
                                    <input type="number" class="auto-text modal_text_extra" id="modelTopK" 
                                           min="0" max="100" step="1" value="40">
                                    <small class="form-text text-muted">Limits vocabulary (0-100) (Default: 40)
                                        <br>• 0-20: Very focused
                                        <br>• 21-60: Balanced
                                        <br>• 61-100: More varied
                                    </small>
                                </div>

                                <div class="col-md-4 mb-2">
                                    <label for="modelSeed" class="form-label mb-1">Seed</label>
                                    <input type="number" class="auto-text modal_text_extra" id="modelSeed" 
                                           min="-1" value="-1">
                                    <small class="form-text text-muted">Set seed or randomize (Default: -1)
                                        <br>• -1: Random seed
                                        <br>• Any other number: Fixed seed
                                    </small>
                                </div>

                                <div class="col-md-4 mb-2">
                                    <label for="modelMaxTokens" class="form-label mb-1">Max Tokens</label>
                                    <input type="number" class="auto-text modal_text_extra" id="modelMaxTokens" 
                                           min="-1" max="4096" step="1" value="-1">
                                    <small class="form-text text-muted">Maximum response length (Default: -1)
                                        <br>• -1: Unlimited
                                        <br>• 1-4096: Token limit
                                    </small>
                                </div>

                                <div class="col-md-4 mb-2">
                                    <label for="modelRepeatPenalty" class="form-label mb-1">Repeat Penalty</label>
                                    <input type="number" class="auto-text modal_text_extra" id="modelRepeatPenalty" 
                                           min="0.0" max="2.0" step="0.05" value="1.1">
                                    <small class="form-text text-muted">Controls repetition (0.0-2.0) (Default: 1.1)
                                        <br>• 0.0-0.9: Weak (Can cause problems if set too low)
                                        <br>• 1.0-1.4: Moderate
                                        <br>• 1.5-2.0: Strong
                                    </small>
                                </div>

                                <div class="col-md-4 mb-2">
                                    <label for="modelFrequencyPenalty" class="form-label mb-1">Frequency Penalty</label>
                                    <input type="number" class="auto-text modal_text_extra" id="modelFrequencyPenalty" 
                                           min="-2.0" max="2.0" step="0.1" value="0.0">
                                    <small class="form-text text-muted">Controls repetition (-2.0 to 2.0) (Default: 0.0)
                                        <br>• Negative: More repetitive
                                        <br>• 0.0: Neutral
                                        <br>• Positive: Less repetitive
                                    </small>
                            </div>

                                <div class="col-md-4 mb-2">
                                    <label for="modelPresencePenalty" class="form-label mb-1">Presence Penalty</label>
                                    <input type="number" class="auto-text modal_text_extra" id="modelPresencePenalty" 
                                           min="-2.0" max="2.0" step="0.1" value="0.0">
                                    <small class="form-text text-muted">Controls topic diversity (-2.0 to 2.0) (Default: 0.0)
                                        <br>• Negative: More focused
                                        <br>• 0.0: Neutral
                                        <br>• Positive: More diverse
                                    </small>
                                </div>

                                <div class="col-md-4 mb-2">
                                    <label for="modelMinP" class="form-label mb-1">Min P</label>
                                    <input type="number" class="auto-text modal_text_extra" id="modelMinP" 
                                           min="0" max="1" step="0.01" value="0.0">
                                    <small class="form-text text-muted">Minimum probability (0-1.0) (Default: 0.0)
                                        <br>• Lower: More diverse
                                        <br>• Higher: More focused
                                    </small>
                                </div>

                                <div class="col-md-4 mb-2">
                                    <label for="modelTopA" class="form-label mb-1">Top A</label>
                                    <input type="number" class="auto-text modal_text_extra" id="modelTopA" 
                                           min="0" max="1" step="0.01" value="0.0">
                                    <small class="form-text text-muted">Alternative to top_p (0-1.0) (Default: 0.0)
                                        <br>• 0.0: Disabled
                                        <br>• Higher values: More diverse
                                    </small>
                                </div>

                                <div class="col-12 mb-3">
                                    <label for="modelSystemPrompt" class="form-label mb-1">System Prompt</label>
                                    <textarea class="auto-text-block modal_text_extra" id="modelSystemPrompt" 
                                              rows="4" style="width: 100%;"
                                              placeholder="Enter system prompt for the AI model"></textarea>
                                    <small class="form-text text-muted">This prompt will be sent with every request to guide the AI's behavior. (Not sent with LLM Toys)</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="basic-button" onclick="ollamaVision.saveModelSettings()">Save</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Settings Modal -->
        <div class="modal fade" id="ollamaSettingsModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content" style="font-size: 1.2rem;">
                    <div class="modal-header">
                        <h5 class="modal-title">OllamaVision Settings</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="card card-body mb-3 py-2">
                            <div class="row g-2">
                                <div class="col-md-6 mb-2">
                                    <label class="form-label mb-1"><b>Backend Type</b></label>
                                    <select id="backend-type" class="auto-dropdown modal_text_extra" 
                                            style="width: auto; min-width: 200px;" 
                                            onchange="ollamaVision.toggleBackendSettings()">
                                        <option value="ollama">Ollama</option>
                                        <option value="openai">OpenAI</option>
                                        <option value="openrouter">OpenRouter</option>
                                        <option value="textgen">OobaBooga WebUI</option>
                                    </select>
                                </div>

                                <!-- Common Settings -->
                                <!-- Compression toggle first -->
                                <div class="col-md-6 mb-2">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="compressImages">
                                        <label class="form-check-label" for="compressImages">
                                            Compress images before analysis
                                        </label>
                                    </div>
                                    <small class="form-text text-muted">
                                        Reduces memory usage and improves stability.
                                    </small>
                                </div>

                                <div class="col-md-6 mb-2">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="showDefaultPresets">
                                        <label class="form-check-label" for="showDefaultPresets">
                                            Show default presets
                                        </label>
                                    </div>
                                    <small class="form-text text-muted">
                                        Toggle visibility of default response presets
                                    </small>
                                </div>

                                <div class="col-md-6 mb-2">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="autoUnloadLMStudio">
                                        <label class="form-check-label" for="autoUnloadLMStudio">
                                            Auto unload LM Studio model after response
                                        </label>
                                    </div>
                                    <small class="form-text text-muted">
                                        Sends an unload request to LM Studio once the response finishes.
                                    </small>
                                </div>

                                <!-- Ollama-specific Settings -->
                                <div id="ollama-connection-settings">
                                    <!-- Move unload model toggle here -->
                                    <div class="col-md-6 mb-2">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="autoUnloadModel">
                                            <label class="form-check-label" for="autoUnloadModel">
                                                Automatically unload model after analysis
                                            </label>
                                        </div>
                                        <small class="form-text text-muted">
                                            This will free up memory but may increase load time for the next analysis
                                        </small>
                                    </div>

                                    <div class="col-md-6 mb-2">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="showAllModels">
                                            <label class="form-check-label" for="showAllModels">
                                                Show all Ollama models
                                            </label>
                                        </div>
                                        <small class="form-text text-muted">
                                            By default, only models with 'vision' or 'llava' in their names are shown
                                        </small>
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label mb-1">Remote Ollama Connection</label>
                                        <input type="text" class="auto-text modal_text_extra" id="ollamaHost" 
                                               placeholder="Host (e.g., 192.168.1.100 or remote.example.com)" 
                                               value="${localStorage.getItem('ollamaVision_host') || 'localhost'}">
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <input type="number" class="auto-text modal_text_extra" id="ollamaPort" 
                                               placeholder="Port (default: 11434)" 
                                               value="${localStorage.getItem('ollamaVision_port') || '11434'}">
                                        <small class="form-text text-muted">
                                            For remote connections:<br>
                                            • Use IP address (e.g., 192.168.1.100) or hostname<br>
                                            • Make sure the Ollama server is accessible from your network<br>
                                            • Check if any firewalls are blocking the connection<br>
                                            • The Ollama server must have API access enabled
                                        </small>
                                    </div>
                                </div>

                                <!-- OpenAI Settings -->
                                <div id="openai-settings" style="display: none;">
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label mb-1">OpenAI API Key</label>
                                        <input type="password" class="auto-text modal_text_extra" id="openai-key" 
                                               placeholder="Enter your OpenAI API key">
                                        <small class="form-text text-muted">Your API key will be stored locally</small>
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label mb-1">API Base URL</label>
                                        <input type="text" class="auto-text modal_text_extra" id="openai-base-url" 
                                               placeholder="https://api.openai.com/v1"
                                               value="${normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL)}">
                                        <small class="form-text text-muted">
                                            Point to any OpenAI-compatible server (e.g., http://localhost:5001/v1)
                                        </small>
                                    </div>
                                </div>
                                <!-- OpenRouter Settings -->
                                <div id="openrouter-settings" style="display: none;">
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label mb-1">OpenRouter API Key</label>
                                        <input type="password" class="auto-text modal_text_extra" id="openrouter-key" 
                                               placeholder="Enter your OpenRouter API key">
                                        <small class="form-text text-muted">Your API key will be stored locally</small>
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label mb-1">Site Name</label>
                                        <input type="text" class="auto-text modal_text_extra" id="openrouter-site" 
                                               placeholder="Enter your site name (e.g., My App)">
                                        <small class="form-text text-muted">This will be used in the X-Title header</small>
                                    </div>
                                </div>
                                <!-- TextGen WebUI Settings -->
                                <div id="textgen-settings" style="display: none;">
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label mb-1">OobaBooga WebUI URL</label>
                                        <input type="text" class="auto-text modal_text_extra" id="textgen-url" 
                                               placeholder="http://localhost:5000"
                                               value="${localStorage.getItem('ollamaVision_textgenUrl') || 'http://localhost:5000'}">
                                        <small class="form-text text-muted">The URL where your OobaBooga WebUI is running (defaults to http://localhost:5000)</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="basic-button" onclick="ollamaVision.saveSettings()">Save</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Prepend Manager Modal -->
        <div class="modal fade" id="prependManagerModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content" style="font-size: 1.2rem;">
                    <div class="modal-header">
                        <h5 class="modal-title">Prompt Prepends</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="card card-body mb-3 py-2">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="enablePrepends" checked>
                                <label class="form-check-label" for="enablePrepends">
                                    Enable Prompt Prepends
                                </label>
                            </div>
                            <div class="row g-2">
                                <div class="col-12 mb-2">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <label for="prependPresets" class="form-label">Saved Prepends</label>
                                        <div class="btn-group">
                                            <button class="basic-button" onclick="ollamaVision.showCreatePrepend()">
                                                Create New Prepend
                                            </button>
                                            <button class="basic-button" onclick="ollamaVision.showPrependsManager()">
                                                Manage Prepends
                                            </button>
                                        </div>
                                    </div>
                                    <select class="auto-dropdown modal_text_extra" id="prependPresets" 
                                            style="width: auto; min-width: 200px; opacity: 1;" 
                                            onchange="ollamaVision.loadPrepend()">
                                        <!-- Options will be loaded dynamically -->
                                    </select>
                                </div>
                                <div class="col-12">
                                    <label for="prependText" class="form-label">Prepend Text</label>
                                    <textarea class="auto-text-block modal_text_extra" 
                                              id="prependText" 
                                              rows="4" 
                                              maxlength="1000"
                                              style="opacity: 1;"
                                              oninput="ollamaVision.updateCharacterCount('prependText', 'prependCharCount')"></textarea>
                                    <div class="d-flex justify-content-end">
                                        <small id="prependCharCount" class="text-muted">1000 characters remaining</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <small class="form-text text-muted">
                            Add text that will be automatically inserted before your selected user prompt. 
                            Useful for adding consistent instructions or context to your prompts.
                            Limited to 1000 characters to prevent token overflow and ensure reliable responses from the AI (Not included with LLM Toys).
                        </small>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="basic-button" onclick="$('#prependManagerModal').modal('hide'); ollamaVision.showResponseSettings()">
                            Cancel
                        </button>
                        <button type="button" class="basic-button" onclick="ollamaVision.savePrepend()">Save</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Prepend Modal -->
        <div class="modal fade" id="createPrependModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content" style="font-size: 1.2rem;">
                    <div class="modal-header">
                        <h5 class="modal-title">Create New Prepend</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="card card-body mb-3 py-2">
                            <div class="row g-2">
                                <div class="col-12 mb-2">
                                    <label for="prependName" class="form-label">Prepend Name</label>
                                    <input type="text" class="auto-text modal_text_extra" id="prependName" placeholder="Enter prepend name">
                                </div>
                                <div class="col-12">
                                    <label for="newPrependText" class="form-label">Prepend Text</label>
                                    <textarea class="auto-text-block modal_text_extra" 
                                              id="newPrependText" 
                                              rows="4" 
                                              maxlength="1000"
                                              oninput="ollamaVision.updateCharacterCount('newPrependText', 'newPrependCharCount')"></textarea>
                                    <div class="d-flex justify-content-end">
                                        <small id="newPrependCharCount" class="text-muted">1000 characters remaining</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="basic-button" onclick="$('#createPrependModal').modal('hide'); ollamaVision.showPrependManager()">
                            Cancel
                        </button>
                        <button type="button" class="basic-button" onclick="ollamaVision.saveNewPrepend()">Save Prepend</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Manage Prepends Modal -->
        <div class="modal fade" id="managePrependsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content" style="font-size: 1.2rem;">
                    <div class="modal-header">
                        <h5 class="modal-title">Manage Prepends</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="card card-body mb-3 py-2">
                            <div class="row g-2">
                                <div class="col-12">
                                    <label class="form-label">User Prepends</label>
                                    <div class="list-group auto-text modal_text_extra" id="user-prepends-list">
                                        <!-- Prepends will be loaded here -->
                                    </div>
                                    <small class="form-text text-muted mt-2">
                                        • Drag and drop prepends to reorder them<br>
                                        • Click the trash icon to delete a prepend
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="basic-button" onclick="ollamaVision.closePrependsManager()">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    tabContentContainer.insertAdjacentHTML('beforeend', ollamaVisionTabContent);
    
    ollamaVision.initializePreviewArea();
    
    setTimeout(() => {
        const select = document.getElementById('promptPresets');
        if (select) {
            select.innerHTML = '';
            
            // Add default presets group
            const defaultGroup = document.createElement('optgroup');
            defaultGroup.label = 'Default Presets';
            
            // Add default options
            const defaultPresets = [
                { value: '', text: 'Select a preset...' },
                { value: 'Default', text: 'Default' },
                { value: 'Detailed Analysis', text: 'Detailed Analysis' },
                { value: 'Simple Description', text: 'Simple Description' },
                { value: 'Artistic Style', text: 'Artistic Style' },
                { value: 'Technical Details', text: 'Technical Details' },
                { value: 'Facial Features', text: 'Facial Features' },
                { value: 'Color Palette', text: 'Color Palette' }
            ];
            
            defaultPresets.forEach(preset => {
                const option = document.createElement('option');
                option.value = preset.value;
                option.textContent = preset.text;
                defaultGroup.appendChild(option);
            });
            
            select.appendChild(defaultGroup);
            
            // Add user presets group
            const userPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
            if (userPresets.length > 0) {
                const userGroup = document.createElement('optgroup');
                userGroup.label = 'User Presets';
                
                userPresets.forEach(preset => {
                    const option = document.createElement('option');
                    option.value = preset.name;
                    option.textContent = preset.name;
                    userGroup.appendChild(option);
                });
                
                select.appendChild(userGroup);
            }

            // Load the last selected preset
            const lastSelectedPreset = localStorage.getItem('ollamaVision_currentPreset') || 'Default';
            select.value = lastSelectedPreset;
            window.ollamaVision.loadPresetPrompt();
        }
    }, 100); // Small delay to ensure DOM is ready

    const lastSelectedPreset = localStorage.getItem('ollamaVision_currentPreset') || 'Default';
    const promptPresets = document.getElementById('promptPresets');
    if (promptPresets) {
        promptPresets.value = lastSelectedPreset;
    }
}

window.ollamaVision = {
    pasteHandler: null,
    pasteEnabled: false,
    modelChangeHandler: null,

    escapeHtmlText: function(text) {
        if (text == null) {
            return '';
        }
        if (typeof escapeHtml === 'function') {
            return escapeHtml(String(text));
        }
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    getBackendDisplayName: function(backendType) {
        switch(backendType) {
            case 'openai':
                return 'OpenAI';
            case 'openrouter':
                return 'OpenRouter';
            case 'textgen':
                return 'OobaBooga';
            case 'ollama':
            default:
                return 'Ollama';
        }
    },

    updateStatus: function(type, message, showSpinner = false) {
        // Replace textgen with OobaBooga in the message
        if (message.includes('textgen')) {
            message = message.replace('textgen', 'OobaBooga');
        }

        let statusElement, spinnerElement, statusTextElement;
        
        if (document.getElementById('storyTimeModal')?.classList.contains('show')) {
            statusElement = document.getElementById('story-status');
            spinnerElement = document.getElementById('story-spinner');
            statusTextElement = document.getElementById('story-status-text');
        } else if (document.getElementById('fusionModal')?.classList.contains('show')) {
            statusElement = document.getElementById('fusion-status');
            spinnerElement = document.getElementById('fusion-spinner');
            statusTextElement = document.getElementById('fusion-status-text');
        } else if (document.getElementById('qwenEnhanceModal')?.classList.contains('show')) {
            statusElement = document.getElementById('enhance-status');
            spinnerElement = document.getElementById('enhance-spinner');
            statusTextElement = document.getElementById('enhance-status-text');
        } else if (document.getElementById('zImageEnhanceModal')?.classList.contains('show')) {
            statusElement = document.getElementById('zimage-enhance-status');
            spinnerElement = document.getElementById('zimage-enhance-spinner');
            statusTextElement = document.getElementById('zimage-enhance-status-text');
        } else if (document.getElementById('animaEnhanceModal')?.classList.contains('show')) {
            statusElement = document.getElementById('anima-enhance-status');
            spinnerElement = document.getElementById('anima-enhance-spinner');
            statusTextElement = document.getElementById('anima-enhance-status-text');
        } else if (document.getElementById('ltxv2EnhanceModal')?.classList.contains('show')) {
            statusElement = document.getElementById('ltxv2-enhance-status');
            spinnerElement = document.getElementById('ltxv2-enhance-spinner');
            statusTextElement = document.getElementById('ltxv2-enhance-status-text');
        } else if (document.getElementById('microsoftLensEnhanceModal')?.classList.contains('show')) {
            statusElement = document.getElementById('microsoft-lens-enhance-status');
            spinnerElement = document.getElementById('microsoft-lens-enhance-spinner');
            statusTextElement = document.getElementById('microsoft-lens-enhance-status-text');
        } else {
            // Default to main window status
            statusElement = document.getElementById('analysis-status');
            spinnerElement = document.getElementById('analysis-spinner');
            statusTextElement = document.getElementById('status-text');
        }

        if (!statusElement) return;

        statusElement.style.display = 'block';
        
        // Map type to Bootstrap alert classes
        const alertClass = type === 'error' ? 'alert-danger' : 
                          type === 'success' ? 'alert-success' : 
                          'alert-info';
        
        statusElement.className = `alert ${alertClass} mt-3 text-center`;
        
        if (spinnerElement) {
            spinnerElement.style.display = showSpinner ? 'block' : 'none';
        }
        
        if (statusTextElement) {
            statusTextElement.textContent = message;
        }

        if (type === 'success') {
            setTimeout(() => {
                if (statusElement.classList.contains('alert-success')) {
                    statusElement.style.display = 'none';
                }
            }, 5000);
        }
    },

    connect: async function() {
        try {
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const connectBtn = document.getElementById('connect-btn');
            const disconnectBtn = document.getElementById('disconnect-btn');
            connectBtn.disabled = true;
            connectBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connecting...';
            
            // Remove any existing model change handler
            const modelSelect = document.getElementById('ollamavision-model');
            if (this.modelChangeHandler) {
                modelSelect.removeEventListener('change', this.modelChangeHandler);
                this.modelChangeHandler = null;
            }
            
            if (backendType === 'openai') {
                const apiKey = localStorage.getItem('ollamaVision_openaiKey') || '';
                const apiBaseUrl = normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL);
                const requiresKey = requiresOpenAIApiKey(apiBaseUrl);

                if (!apiKey && requiresKey) {
                    throw new Error('OpenAI API key not found. Please add it in settings.');
                }

                const response = await new Promise((resolve, reject) => {
                    genericRequest('FetchOpenAIModelsAsync',
                        {
                            baseUrl: apiBaseUrl,
                            apiKey: apiKey
                        },
                        (data) => resolve(data),
                        (error) => reject(error)
                    );
                });

                if (!localStorage.getItem('ollamaVision_host')) {
                    localStorage.setItem('ollamaVision_host', 'localhost');
                }
                if (!localStorage.getItem('ollamaVision_port')) {
                    localStorage.setItem('ollamaVision_port', '11434');
                }

                if (!response.success) {
                    throw new Error(response.error || (requiresKey ? 'Failed to fetch models from OpenAI' : 'Failed to fetch models from the configured API'));
                }

                const modelSelect = document.getElementById('ollamavision-model');
                modelSelect.innerHTML = '<option value="">Select a model...</option>';
                
                // Sort models alphabetically by their ID
                const models = Array.isArray(response.models) ? response.models : [];
                const sortedModels = models.sort((a, b) => a.id.localeCompare(b.id));
                
                sortedModels.forEach(model => {
                    let modelId = this.escapeHtmlText(model.id);
                    modelSelect.innerHTML += `<option value="${modelId}">${modelId}</option>`;
                });
    
                connectBtn.innerHTML = 'Connect to OpenAI';
                connectBtn.classList.add('connected');
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'inline-block';
                
                document.getElementById('ollamavision-model').disabled = false;
                document.getElementById('paste-btn').disabled = false;
                document.getElementById('upload-btn').disabled = false;
                
                const statusTarget = requiresKey ? 'OpenAI' : 'the OpenAI-compatible API';
                this.updateStatus('success', `Connected to ${statusTarget} successfully`);
            } else if (backendType === 'openrouter') {
                const apiKey = localStorage.getItem('ollamaVision_openrouterKey');
                const siteName = localStorage.getItem('ollamaVision_openrouterSite') || 'SwarmUI';
                
                if (!apiKey) {
                    throw new Error('OpenRouter API key not found. Please add it in settings.');
                }
                
                // Fetch all available models from OpenRouter
                const response = await fetch('https://openrouter.ai/api/v1/models', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': window.location.origin,
                        'X-Title': siteName
                    }
                });
    
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'Failed to fetch models from OpenRouter');
                }
    
                const data = await response.json();
                const modelSelect = document.getElementById('ollamavision-model');
                modelSelect.innerHTML = '<option value="">Select a model...</option>';
                
                // Sort models alphabetically by their ID
                const sortedModels = data.data.sort((a, b) => a.id.localeCompare(b.id));
                
                sortedModels.forEach(model => {
                    let modelId = this.escapeHtmlText(model.id);
                    modelSelect.innerHTML += `<option value="${modelId}">${modelId}</option>`;
                });
    
                connectBtn.innerHTML = 'Connect to OpenRouter';
                connectBtn.classList.add('connected');
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'inline-block';
                
                document.getElementById('ollamavision-model').disabled = false;
                document.getElementById('paste-btn').disabled = false;
                document.getElementById('upload-btn').disabled = false;
                
                this.updateStatus('success', 'Connected to OpenRouter successfully');
            } else if (backendType === 'textgen') {
                const textgenUrl = localStorage.getItem('ollamaVision_textgenUrl') || 'http://localhost:5000';
                
                try {
                    const response = await new Promise((resolve, reject) => {
                        genericRequest('ConnectToTextGenAsync', 
                            { 
                                textgenUrl: textgenUrl
                            },
                            (data) => resolve(data),
                            (error) => reject(error)
                        );
                    });

                    if (!response.success) {
                        throw new Error(response.error || 'Failed to connect to OobaBooga WebUI');
                    }

                    // Get UI elements
                    const connectBtn = document.getElementById('connect-btn');
                    const disconnectBtn = document.getElementById('disconnect-btn');
                    const modelSelect = document.getElementById('ollamavision-model');
                    const uploadBtn = document.getElementById('upload-btn');
                    const pasteBtn = document.getElementById('paste-btn');

                    // Update model dropdown with available models
                    modelSelect.innerHTML = '<option value="">Select a model...</option>';
                    
                    if (response.models && Array.isArray(response.models)) {
                        response.models.forEach(model => {
                            const option = document.createElement('option');
                            option.value = model;
                            option.textContent = model;
                            modelSelect.appendChild(option);
                        });
                    }

                    this.modelChangeHandler = async function(event) {
                        const selectedModel = event.target.value;
                        if (selectedModel) {
                            try {
                                ollamaVision.updateStatus('info', `Loading model ${selectedModel}...`, true);
                                
                                const response = await new Promise((resolve, reject) => {
                                    genericRequest('LoadTextGenModelAsync', 
                                        { 
                                            textgenUrl: textgenUrl,
                                            model: selectedModel
                                        },
                                        (data) => resolve(data),
                                        (error) => reject(error)
                                    );
                                });

                                if (!response.success) {
                                    throw new Error(response.error || 'Failed to load model');
                                }

                                ollamaVision.updateStatus('success', `Model ${selectedModel} loaded successfully`);
                            } catch (error) {
                                ollamaVision.updateStatus('error', `Failed to load model: ${error.message}`);
                                event.target.value = '';
                            }
                        }
                    };

                    // Add the event listener for OobaBooga
                    modelSelect.addEventListener('change', this.modelChangeHandler);

                    // Enable UI elements
                    modelSelect.disabled = false;
                    uploadBtn.disabled = false;
                    pasteBtn.disabled = false;
                    
                    // Update connection buttons
                    connectBtn.style.display = 'none';
                    disconnectBtn.style.display = 'inline-block';
                    
                    // Update connection status
                    this.updateStatus('success', 'Connected to OobaBooga WebUI successfully');
                    
                    // Save connection state
                    localStorage.setItem('ollamaVision_connected', 'true');
                    localStorage.setItem('ollamaVision_backendType', 'textgen');
                    
                } catch (error) {
                    this.updateStatus('error', 'Connection error: ' + error.message);
                    
                    // Get UI elements
                    const connectBtn = document.getElementById('connect-btn');
                    const disconnectBtn = document.getElementById('disconnect-btn');
                    const modelSelect = document.getElementById('ollamavision-model');
                    const uploadBtn = document.getElementById('upload-btn');
                    const pasteBtn = document.getElementById('paste-btn');
                    
                    // Disable UI elements
                    if (modelSelect) modelSelect.disabled = true;
                    if (uploadBtn) uploadBtn.disabled = true;
                    if (pasteBtn) pasteBtn.disabled = true;
                    
                    // Update connection buttons
                    if (connectBtn) connectBtn.style.display = 'inline-block';
                    if (disconnectBtn) disconnectBtn.style.display = 'none';
                    
                    // Update connection status
                    this.updateStatus('error', `Failed to connect to OobaBooga WebUI: ${error.message}`);
                    
                    localStorage.removeItem('ollamaVision_connected');
                    localStorage.removeItem('ollamaVision_backendType');
                }
            } else {
                
                // Existing Ollama connection logic
                const showAllModels = localStorage.getItem('ollamaVision_showAllModels') === 'true';
                let host = localStorage.getItem('ollamaVision_host') || 'localhost';
                const port = localStorage.getItem('ollamaVision_port') || '11434';
                
                // Add protocol if not present
                if (!host.startsWith('http://') && !host.startsWith('https://')) {
                    host = `http://${host}`;
                }
                
                // Remove any trailing slashes
                host = host.replace(/\/+$/, '');
                
                // Construct the full URL
                const ollamaUrl = `${host}:${port}`;
            
              
                const response = await new Promise((resolve, reject) => {
                    genericRequest('ConnectToOllamaAsync', 
                        { 
                            showAllModels: showAllModels,
                            ollamaUrl: ollamaUrl
                        },
                        (data) => resolve(data),
                        (error) => reject(error)
                    );
                });

                if (response.success) {
                    const modelSelect = document.getElementById('ollamavision-model');
                    modelSelect.innerHTML = '<option value="">Select a model...</option>';
                    
                    // Filter models if showAllModels is false
                    const filteredModels = showAllModels ? response.models : response.models.filter(model => model.includes('vision') || model.includes('llava'));
                    
                    filteredModels.forEach(model => {
                        let modelName = this.escapeHtmlText(model);
                        modelSelect.innerHTML += `<option value="${modelName}">${modelName}</option>`;
                    });

                    connectBtn.innerHTML = 'Connected';
                    connectBtn.classList.add('connected');
                    connectBtn.style.display = 'none';
                    disconnectBtn.style.display = 'inline-block';
                    
                    document.getElementById('ollamavision-model').disabled = false;
                    document.getElementById('paste-btn').disabled = false;
                    document.getElementById('upload-btn').disabled = false;
                    
                    this.updateStatus('success', 'Connected to Ollama successfully');
                } else {
                    throw new Error('Failed to connect: ' + response.error);
                }
            }
        } catch (error) {
            const connectBtn = document.getElementById('connect-btn');
            const disconnectBtn = document.getElementById('disconnect-btn');
            connectBtn.disabled = false;
            connectBtn.innerHTML = 'Connect';
            connectBtn.classList.remove('connected');
            disconnectBtn.style.display = 'none';
            this.updateStatus('error', 'Error connecting: ' + error);
        }
    },

    showResponseSettings: function() {
        const currentUserPrompt = localStorage.getItem('ollamaVision_currentUserPrompt') || 'Default';
        const userPromptSelect = document.getElementById('user-prompt');
        
        if (userPromptSelect) {
            userPromptSelect.value = currentUserPrompt;
        }

        const editedText = localStorage.getItem('ollamaVision_editedResponseText');
        if (editedText) {
            document.getElementById('responsePrompt').value = editedText;
        }
        
        $('#responseSettingsModal').modal('show');
    },

    loadPresetPrompt: function() {
        const preset = document.getElementById('promptPresets').value;
        if (!preset) return;
        
        localStorage.setItem('ollamaVision_currentPreset', preset);
        
        const customPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
        const customPreset = customPresets.find(p => p.name === preset);
        
        if (customPreset) {
            document.getElementById('responsePrompt').value = customPreset.prompt;
        } else {
            genericRequest('GetPresetPrompt', { preset: preset }, (response) => {
                if (response.success) {
                    document.getElementById('responsePrompt').value = response.prompt;
                } else {
                    this.updateStatus('error', 'Failed to load preset prompt: ' + (response.error || 'Unknown error'));
                }
            });
        }
    },

    saveResponseSettings: function() {
        const editedText = document.getElementById('responsePrompt').value;
        localStorage.setItem('ollamaVision_editedResponseText', editedText);
        
        bootstrap.Modal.getInstance(document.getElementById('responseSettingsModal')).hide();
    },

    enablePaste: function() {
        try {
            this.updateStatus('info', 'Ready for paste...');
            
            // Remove any existing paste event listener
            if (this.pasteHandler) {
                document.removeEventListener('paste', this.pasteHandler);
            }
            
            this.pasteHandler = this.handlePaste.bind(this);
            this.pasteEnabled = true;
            
            const ollamaVisionTab = document.getElementById('Utilities-OllamaVision-Tab');
            if (ollamaVisionTab) {
                ollamaVisionTab.addEventListener('paste', this.pasteHandler);
                
                // Create hidden input for paste focus
                const hiddenInput = document.createElement('input');
                hiddenInput.style.position = 'absolute';
                hiddenInput.style.opacity = '0';
                hiddenInput.style.pointerEvents = 'none';
                hiddenInput.id = 'ollamavision-hidden-input';
                ollamaVisionTab.appendChild(hiddenInput);
                hiddenInput.focus();
            }
            
            this.updateStatus('info', 'Ready for paste (CTRL+V)');
        } catch (error) {
            this.updateStatus('error', 'Error enabling paste: ' + error);
        }
    },

    uploadImage: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageUpload(file);
            }
        };
        input.click();
    },

    handleImageUpload: function(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            this.displayImagePreview(file.name || 'uploaded.png', dataUrl);
            this.updateStatus('success', 'Image loaded successfully');
            document.getElementById('image-preview-area').classList.add('has-image');
        };
        reader.readAsDataURL(file);
    },

    displayImagePreview: function(imageName, dataUrl = null) {
        const previewArea = document.getElementById('image-preview-area');
        const previewImage = document.getElementById('preview-image');
        const imageInfo = document.getElementById('image-info');
        const analyzeBtn = document.getElementById('analyze-btn');
        const responseArea = document.getElementById('analysis-response');
        const sendToPromptBtn = document.getElementById('send-to-prompt-btn');
        
        if (dataUrl) {
            previewImage.src = dataUrl;
            previewImage.style.display = 'block';
            // Center text and increase size
            imageInfo.style.textAlign = 'center';
            imageInfo.style.fontSize = '1.5rem';
            imageInfo.textContent = `Image: ${imageName}`;
            previewImage.dataset.imageData = dataUrl;
            analyzeBtn.disabled = false;
            // Center the analyze button
            analyzeBtn.style.display = 'block';
            analyzeBtn.style.margin = '0 auto';
            previewArea.classList.add('has-image');
        } else {
            previewImage.style.display = 'none';
            imageInfo.textContent = '';
            analyzeBtn.disabled = true;
            previewArea.classList.remove('has-image');
        }
        
        responseArea.style.display = 'none';
        sendToPromptBtn.disabled = true;
    },

    sendToPrompt: function() {
        const responseText = document.getElementById('response-text');
        if (responseText && responseText.value) {  // Changed from textContent to value
            document.getElementById('text2imagetabbutton').click();
            const generatePromptTextarea = document.getElementById("input_prompt");
            if (generatePromptTextarea) {
                generatePromptTextarea.value = responseText.value;  // Changed from textContent to value
                generatePromptTextarea.dispatchEvent(new Event('input'));
            }
        }
    },

    analyze: async function() {
        try {
            // Check backend connection first
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const model = document.getElementById('ollamavision-model').value;
            
            // Check if we're connected to a backend
            const disconnectBtn = document.getElementById('disconnect-btn');
            if (disconnectBtn.style.display === 'none') {
                this.updateStatus('error', 'Backend not connected!');
                return;
            }

            // Check if a model is selected
            if (!model) {
                this.updateStatus('error', 'Missing required parameters (model)');
                return;
            }

            const imageData = document.getElementById('preview-image').dataset.imageData;
            if (!imageData) {
                this.updateStatus('error', 'No image data found');
                return;
            }

            // Show and setup analysis response area
            const analysisResponse = document.getElementById('analysis-response');
            const responseText = document.getElementById('response-text');
            const streamingResponse = document.getElementById('streaming-response');
            
            analysisResponse.style.display = 'block';
            responseText.value = '';
            streamingResponse.textContent = '';
            responseText.style.display = 'none';
            streamingResponse.style.display = 'block';
            this.setThinkingContent(null);

            this.updateStatus('info', `Analyzing image with ${backendType}...`, true);

            let prompt = document.getElementById('responsePrompt').value;
            const prependsEnabled = localStorage.getItem('ollamaVision_prependsEnabled') !== 'false';
            if (prependsEnabled) {
                const prependText = await loadInitialPrepend();
                if (prependText) {
                    prompt = prependText + ' ' + prompt;
                }
            }

            // Process image data
            const shouldCompress = localStorage.getItem('ollamaVision_compressImages') === 'true';
            const processedImageData = shouldCompress ? 
                await this.compressImage(imageData) : 
                imageData;

            // Make API request
            const response = await new Promise((resolve, reject) => {
                const filteredParams = filterBackendParams({
                    model: model,
                    backendType: backendType,
                    imageData: processedImageData,
                    prompt: prompt,
                    temperature: localStorage.getItem('ollamaVision_temperature') || '0.8',
                    maxTokens: localStorage.getItem('ollamaVision_maxTokens') || '-1',
                    topP: localStorage.getItem('ollamaVision_topP') || '0.7',
                    systemPrompt: localStorage.getItem('ollamaVision_systemPrompt') || '',
                    frequencyPenalty: localStorage.getItem('ollamaVision_frequencyPenalty') || '0.0',
                    presencePenalty: localStorage.getItem('ollamaVision_presencePenalty') || '0.0',
                    repeatPenalty: localStorage.getItem('ollamaVision_repeatPenalty') || '1.1',
                    topK: localStorage.getItem('ollamaVision_topK') || '40',
                    seed: localStorage.getItem('ollamaVision_seed') || '-1',
                    minP: localStorage.getItem('ollamaVision_minP') || '0.0',
                    topA: localStorage.getItem('ollamaVision_topA') || '0.0',
                    apiKey: backendType === 'openai' ? 
                        localStorage.getItem('ollamaVision_openaiKey') : 
                        backendType === 'openrouter' ? 
                            localStorage.getItem('ollamaVision_openrouterKey') : '',
                    apiBaseUrl: backendType === 'openai' ?
                        normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL) : '',
                    siteName: localStorage.getItem('ollamaVision_openrouterSite') || 'SwarmUI',
                    ollamaUrl: backendType === 'ollama' ? 
                        `http://${localStorage.getItem('ollamaVision_host') || 'localhost'}:${localStorage.getItem('ollamaVision_port') || '11434'}` : ''
                }, backendType);
                genericRequest('AnalyzeImageAsync', filteredParams, (data) => resolve(data), (error) => reject(error));
            });

            if (response.success) {
                if (!response.response || response.response.trim().toLowerCase() === "null") {
                    this.updateStatus('error', "The LLM has censored you or rate limited you. Try again or edit your prompt and check your image.");
                    return;
                }

                // Update response display (response.response is already stripped of thinking by API)
                responseText.value = response.response;
                this.storeOriginalResponse(response.response);
                responseText.style.display = 'block';
                streamingResponse.style.display = 'none';
                this.setThinkingContent(response.thinkingContent || null);
                document.getElementById('send-to-prompt-btn').disabled = false;
                this.addToHistory(document.getElementById('preview-image').src, response.response);
                this.updateStatus('success', 'Analysis complete!');
                await this.unloadModelIfEnabled(model);
            } else {
                this.updateStatus('error', 'Analysis failed: ' + response.error);
            }
        } catch (error) {
            this.updateStatus('error', error.message);
        }
    },

    showSettings: function() {
        const settingsHtml = `
            <div class="modal fade" id="ollamaSettingsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content" style="font-size: 1.2rem;">
                        <div class="modal-header">
                            <h5 class="modal-title">OllamaVision Settings</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="card card-body mb-3 py-2">
                                <div class="row g-2">
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label mb-1"><b>Backend Type</b></label>
                                        <select id="backend-type" class="auto-dropdown modal_text_extra" 
                                                style="width: auto; min-width: 200px;" 
                                                onchange="ollamaVision.toggleBackendSettings()">
                                            <option value="ollama">Ollama</option>
                                            <option value="openai">OpenAI</option>
                                            <option value="openrouter">OpenRouter</option>
                                            <option value="textgen">OobaBooga WebUI</option>
                                        </select>
                                    </div>

                                    <!-- Common Settings -->
                                    <!-- Compression toggle first -->
                                    <div class="col-md-6 mb-2">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="compressImages">
                                            <label class="form-check-label" for="compressImages">
                                                Compress images before analysis
                                            </label>
                                        </div>
                                        <small class="form-text text-muted">
                                            Reduces memory usage and improves stability. Max size: 1024x1024
                                        </small>
                                    </div>

                                    <div class="col-md-6 mb-2">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="showDefaultPresets">
                                            <label class="form-check-label" for="showDefaultPresets">
                                                Show default presets
                                            </label>
                                        </div>
                                        <small class="form-text text-muted">
                                            Toggle visibility of default response presets
                                        </small>
                                    </div>

                                    <!-- Ollama-specific Settings -->
                                    <div id="ollama-connection-settings">
                                        <!-- Move unload model toggle here -->
                                        <div class="col-md-6 mb-2">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="autoUnloadModel">
                                                <label class="form-check-label" for="autoUnloadModel">
                                                    Automatically unload model after analysis
                                                </label>
                                            </div>
                                            <small class="form-text text-muted">
                                                This will free up memory but may increase load time for the next analysis
                                            </small>
                                        </div>

                                        <div class="col-md-6 mb-2">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="showAllModels">
                                                <label class="form-check-label" for="showAllModels">
                                                    Show all Ollama models
                                                </label>
                                            </div>
                                            <small class="form-text text-muted">
                                                By default, only models with 'vision' or 'llava' in their names are shown
                                            </small>
                                        </div>
                                        <div class="col-md-6 mb-2">
                                            <label class="form-label mb-1">Remote Ollama Connection</label>
                                            <input type="text" class="auto-text modal_text_extra" id="ollamaHost" 
                                                   placeholder="Host (e.g., 192.168.1.100 or remote.example.com)" 
                                                   value="${localStorage.getItem('ollamaVision_host') || 'localhost'}">
                                        </div>
                                        <div class="col-md-6 mb-2">
                                            <input type="number" class="auto-text modal_text_extra" id="ollamaPort" 
                                                   placeholder="Port (default: 11434)" 
                                                   value="${localStorage.getItem('ollamaVision_port') || '11434'}">
                                            <small class="form-text text-muted">
                                                For remote connections:<br>
                                                • Use IP address (e.g., 192.168.1.100) or hostname<br>
                                                • Make sure the Ollama server is accessible from your network<br>
                                                • Check if any firewalls are blocking the connection<br>
                                                • The Ollama server must have API access enabled
                                            </small>
                                        </div>
                                    </div>

                                    <!-- OpenAI Settings -->
                                    <div id="openai-settings" style="display: none;">
                                        <div class="col-md-6 mb-2">
                                            <label class="form-label mb-1">OpenAI API Key</label>
                                            <input type="password" class="auto-text modal_text_extra" id="openai-key" 
                                                   placeholder="Enter your OpenAI API key">
                                            <small class="form-text text-muted">Your API key will be stored locally</small>
                                        </div>
                                        <div class="col-md-6 mb-2">
                                            <label class="form-label mb-1">API Base URL</label>
                                            <input type="text" class="auto-text modal_text_extra" id="openai-base-url" 
                                                   placeholder="https://api.openai.com/v1"
                                                   value="${normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL)}">
                                            <small class="form-text text-muted">
                                                Point to any OpenAI-compatible server (e.g., http://localhost:5001/v1)
                                            </small>
                                        </div>
                                    </div>
                                    <!-- OpenRouter Settings -->
                                    <div id="openrouter-settings" style="display: none;">
                                        <div class="col-md-6 mb-2">
                                            <label class="form-label mb-1">OpenRouter API Key</label>
                                            <input type="password" class="auto-text modal_text_extra" id="openrouter-key" 
                                                   placeholder="Enter your OpenRouter API key">
                                            <small class="form-text text-muted">Your API key will be stored locally</small>
                                        </div>
                                        <div class="col-md-6 mb-2">
                                            <label class="form-label mb-1">Site Name</label>
                                            <input type="text" class="auto-text modal_text_extra" id="openrouter-site" 
                                                   placeholder="Enter your site name (e.g., My App)">
                                            <small class="form-text text-muted">This will be used in the X-Title header</small>
                                        </div>
                                    </div>
                                    <!-- TextGen WebUI Settings -->
                                    <div id="textgen-settings" style="display: none;">
                                        <div class="col-md-6 mb-2">
                                            <label class="form-label mb-1">OobaBooga WebUI URL</label>
                                            <input type="text" class="auto-text modal_text_extra" id="textgen-url" 
                                                   placeholder="http://localhost:5000"
                                                   value="${localStorage.getItem('ollamaVision_textgenUrl') || 'http://localhost:5000'}">
                                            <small class="form-text text-muted">The URL where your OobaBooga WebUI is running (defaults to http://localhost:5000)</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="basic-button" onclick="ollamaVision.saveSettings()">Save</button>
                        </div>
                    </div>
                </div>
            </div>`;

        if (!document.getElementById('ollamaSettingsModal')) {
            document.body.insertAdjacentHTML('beforeend', settingsHtml);
        }

        const modal = new bootstrap.Modal(document.getElementById('ollamaSettingsModal'));
        
        // Load saved settings
        const autoUnload = localStorage.getItem('ollamaVision_autoUnload') === 'true';
        const showAllModels = localStorage.getItem('ollamaVision_showAllModels') === 'true';
        const host = localStorage.getItem('ollamaVision_host') || 'localhost';
        const port = localStorage.getItem('ollamaVision_port') || '11434';
        const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
        const openaiKey = localStorage.getItem('ollamaVision_openaiKey') || '';
        const openaiBaseUrl = normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL);
        const autoUnloadLMStudio = localStorage.getItem('ollamaVision_autoUnloadLMStudio') === 'true';
        const showDefaultPresets = localStorage.getItem('ollamaVision_showDefaultPresets') !== 'false';
        const compressImages = localStorage.getItem('ollamaVision_compressImages') === 'true';
                
        document.getElementById('autoUnloadModel').checked = autoUnload;
        document.getElementById('showAllModels').checked = showAllModels;
        document.getElementById('ollamaHost').value = host;
        document.getElementById('ollamaPort').value = port;
        document.getElementById('backend-type').value = backendType;
        document.getElementById('openai-key').value = openaiKey;
        const openaiBaseUrlInput = document.getElementById('openai-base-url');
        if (openaiBaseUrlInput) {
            openaiBaseUrlInput.value = openaiBaseUrl;
        }
        document.getElementById('showDefaultPresets').checked = showDefaultPresets;
        const autoUnloadLMStudioToggle = document.getElementById('autoUnloadLMStudio');
        if (autoUnloadLMStudioToggle) {
            autoUnloadLMStudioToggle.checked = autoUnloadLMStudio;
        }
        document.getElementById('openrouter-key').value = localStorage.getItem('ollamaVision_openrouterKey') || '';
        document.getElementById('openrouter-site').value = localStorage.getItem('ollamaVision_openrouterSite') || '';
        document.getElementById('compressImages').checked = compressImages;
        document.getElementById('textgen-url').value = localStorage.getItem('ollamaVision_textgenUrl') || 'http://localhost:5000';

        // Show/hide appropriate settings
        this.toggleBackendSettings();
        
        modal.show();
    },

    toggleBackendSettings: function() {
        const backendType = document.getElementById('backend-type').value;
        const ollamaConnectionSettings = document.getElementById('ollama-connection-settings');
        const openaiSettings = document.getElementById('openai-settings');
        const openrouterSettings = document.getElementById('openrouter-settings');
        const textgenSettings = document.getElementById('textgen-settings');
        const connectBtn = document.getElementById('connect-btn');
        
        // Hide all settings first
        ollamaConnectionSettings.style.display = 'none';
        openaiSettings.style.display = 'none';
        openrouterSettings.style.display = 'none';
        if (textgenSettings) {
            textgenSettings.style.display = 'none';
        }
        
        // Show appropriate settings
        if (backendType === 'ollama') {
            ollamaConnectionSettings.style.display = 'block';
        } else if (backendType === 'openai') {
            openaiSettings.style.display = 'block';
        } else if (backendType === 'openrouter') {
            openrouterSettings.style.display = 'block';
        } else if (backendType === 'textgen') {
            if (textgenSettings) {
                textgenSettings.style.display = 'block';
            }
        }
        
        // Update connect button text
        connectBtn.innerHTML = `Connect to ${
            backendType === 'openai' ? 'OpenAI' : 
            backendType === 'openrouter' ? 'OpenRouter' : 
            backendType === 'textgen' ? 'OobaBooga WebUI' : 
            'Ollama'
        }`;
    },

    saveSettings: function() {
        const autoUnload = document.getElementById('autoUnloadModel').checked;
        const showAllModels = document.getElementById('showAllModels').checked;
        const showDefaultPresets = document.getElementById('showDefaultPresets').checked;
        const autoUnloadLMStudio = document.getElementById('autoUnloadLMStudio').checked;
        const host = document.getElementById('ollamaHost').value.trim();
        const port = document.getElementById('ollamaPort').value.trim();
        const backendType = document.getElementById('backend-type').value;
        const openaiKey = document.getElementById('openai-key').value.trim();
        const openaiBaseUrlInput = document.getElementById('openai-base-url');
        const openaiBaseUrl = normalizeOpenAIBaseUrl(openaiBaseUrlInput ? openaiBaseUrlInput.value : DEFAULT_OPENAI_BASE_URL);
        const openrouterKey = document.getElementById('openrouter-key').value.trim();
        const openrouterSite = document.getElementById('openrouter-site').value.trim();
        const compressImages = document.getElementById('compressImages').checked;
        
        const textgenUrlInput = document.getElementById('textgen-url');
        const textgenUrl = (textgenUrlInput ? textgenUrlInput.value.trim() : '') || 'http://localhost:5000';
        
        if (openaiBaseUrlInput) {
            openaiBaseUrlInput.value = openaiBaseUrl;
        }

        if (backendType === 'openrouter' && !openrouterKey) {
            this.updateStatus('error', 'OpenRouter API key is required');
            return;
        } else if (backendType === 'ollama' && (!host || !port)) {
            this.updateStatus('error', 'Ollama host and port are required');
            return;
        }
        
        // Save all settings to localStorage
        localStorage.setItem('ollamaVision_autoUnload', autoUnload);
        localStorage.setItem('ollamaVision_showAllModels', showAllModels);
        localStorage.setItem('ollamaVision_showDefaultPresets', showDefaultPresets);
        localStorage.setItem('ollamaVision_autoUnloadLMStudio', autoUnloadLMStudio);
        localStorage.setItem('ollamaVision_host', host);
        localStorage.setItem('ollamaVision_port', port);
        localStorage.setItem('ollamaVision_backendType', backendType);
        localStorage.setItem('ollamaVision_openaiKey', openaiKey);
        localStorage.setItem('ollamaVision_openaiBaseUrl', openaiBaseUrl);
        localStorage.setItem('ollamaVision_openrouterKey', openrouterKey);
        localStorage.setItem('ollamaVision_openrouterSite', openrouterSite);
        localStorage.setItem('ollamaVision_compressImages', compressImages);
        localStorage.setItem('ollamaVision_textgenUrl', textgenUrl);
        
        bootstrap.Modal.getInstance(document.getElementById('ollamaSettingsModal')).hide();
        this.updateStatus('success', 'Settings saved successfully');
        
        // Update presets dropdown with new settings
        this.updatePresetsDropdown();
        
        // Refresh connection if needed
        const connectBtn = document.getElementById('connect-btn');
        if (connectBtn.classList.contains('connected')) {
            this.connect();
        }
    },

    unloadLMStudioModel: async function() {
        try {
            const baseUrl = normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL);
            const apiKey = localStorage.getItem('ollamaVision_openaiKey') || '';
            const instanceId = document.getElementById('ollamavision-model')?.value || '';

            if (!instanceId) {
                this.updateStatus('error', 'Please select a model before unloading.');
                return;
            }

            this.updateStatus('info', 'Requesting LM Studio to unload the model...', true);

            const response = await new Promise((resolve, reject) => {
                genericRequest('UnloadLMStudioModelAsync', 
                    { 
                        baseUrl: baseUrl,
                        instanceId: instanceId,
                        apiKey: apiKey
                    },
                    (data) => resolve(data),
                    (error) => reject(error)
                );
            });

            if (response.success) {
                this.updateStatus('success', response.message || 'LM Studio acknowledged unload request.');
            } else {
                this.updateStatus('error', response.error || 'Failed to unload model in LM Studio.');
            }
        } catch (error) {
            this.updateStatus('error', 'Failed to unload LM Studio model: ' + error.message);
        }
    },

    unloadModel: async function(model) {
        try {
            let host = localStorage.getItem('ollamaVision_host') || 'localhost';
            const port = localStorage.getItem('ollamaVision_port') || '11434';
            
            // Add protocol if not present
            if (!host.startsWith('http://') && !host.startsWith('https://')) {
                host = `http://${host}`;
            }
            
            // Remove any trailing slashes
            host = host.replace(/\/+$/, '');
            
            const ollamaUrl = `${host}:${port}`;
            
            const response = await new Promise((resolve, reject) => {
                genericRequest('UnloadModelWithKeepAliveAsync', 
                    { 
                        model: model,
                        ollamaUrl: ollamaUrl,
                        keep_alive: 0
                    },
                    (data) => resolve(data),
                    (error) => reject(error)
                );
            });

            if (response.success) {
                this.updateStatus('info', 'Model unloaded successfully');
            } else {
                this.updateStatus('error', 'Failed to unload model: ' + (response.error || 'Unknown error'));
            }
        } catch (error) {
            this.updateStatus('error', 'Error unloading model: ' + error.message);
        }
    },

    getTemplate: function() {
        return ``;
    },

    initialize: function() {
        const container = document.createElement('div');
        container.innerHTML = this.getTemplate();
        document.getElementById('ollamavision-container').appendChild(container);
        
        // Update presets dropdown
        this.updatePresetsDropdown();
        
        setTimeout(() => {
            const promptPresets = document.getElementById('promptPresets');
            if (promptPresets) {
                promptPresets.value = 'Default';
                this.loadPresetPrompt();
            }
        }, 100); // Small delay to ensure DOM is ready
    },

    loadExistingPresets: function() {
        const select = document.getElementById('promptPresets');
        if (!select) {
            this.updateStatus('error', 'Presets select element not found');
            return;
        }

        // Find or create the User Presets optgroup
        let userPresetsGroup = select.querySelector('optgroup[label="User Presets"]');
        if (!userPresetsGroup) {
            userPresetsGroup = document.createElement('optgroup');
            userPresetsGroup.label = 'User Presets';
            select.appendChild(userPresetsGroup);
        }

        userPresetsGroup.innerHTML = '';

        // Load and add all saved presets
        const customPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');

        customPresets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            userPresetsGroup.appendChild(option);
        });
    },

    initializeUI: function() {
        const container = document.createElement('div');
        container.innerHTML = this.getTemplate();
        document.getElementById('ollamavision-container').appendChild(container);
        
        // Load user presets into dropdown
        this.loadUserPresets();
    },

    showCreatePreset: function() {
        // Hide the response settings modal
        bootstrap.Modal.getInstance(document.getElementById('responseSettingsModal')).hide();
        
        const currentPrompt = document.getElementById('responsePrompt').value;
        document.getElementById('presetName').value = "Preset Name";
        document.getElementById('presetPrompt').value = "Your response prompt.";
        
        // Show the create preset modal
        new bootstrap.Modal(document.getElementById('createPresetModal')).show();
    },

    saveNewPreset: function() {
        const name = document.getElementById('presetName').value.trim();
        const prompt = document.getElementById('presetPrompt').value.trim();
        
        if (!name || !prompt) {
            this.updateStatus('error', 'Please enter both name and prompt');
            return;
        }

        let customPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
        
        if (customPresets.some(p => p.name === name)) {
            if (!confirm('A preset with this name already exists. Do you want to replace it?')) {
                return;
            }
            customPresets = customPresets.filter(p => p.name !== name);
        }
        
        // Add new preset
        customPresets.push({
            name: name,
            prompt: prompt
        });
        
        // Save to localStorage
        localStorage.setItem('ollamaVision_customPresets', JSON.stringify(customPresets));
        
        // Update UI
        this.updatePresetsDropdown();
        this.loadPresetManager();
        
        const createModal = bootstrap.Modal.getInstance(document.getElementById('createPresetModal'));
        createModal.hide();
        
        // Show the response settings modal again
        setTimeout(() => {
            new bootstrap.Modal(document.getElementById('responseSettingsModal')).show();
        }, 250);
        
        this.updateStatus('success', 'Preset saved successfully');
    },

    loadUserPresets: function() {
        const userPresetsGroup = document.getElementById('user-presets');
        if (!userPresetsGroup) return;

        userPresetsGroup.innerHTML = '';
        
        // Load user presets from localStorage
        const customPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
        
        customPresets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            userPresetsGroup.appendChild(option);
        });
    },

    deleteUserPreset: function(presetName) {
        if (!confirm('Are you sure you want to delete this preset?')) {
            return;
        }
        
        let customPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
        customPresets = customPresets.filter(preset => preset.name !== presetName);
        localStorage.setItem('ollamaVision_customPresets', JSON.stringify(customPresets));
        
        // Reload the preset manager list
        this.loadPresetManager();
        
        // Update the main dropdown
        this.updatePresetsDropdown();
        
        this.updateStatus('success', 'Preset deleted successfully');
    },

    showPresetManager: function() {
        const responseModal = document.getElementById('responseSettingsModal');
        if (responseModal) {
            const bsResponseModal = bootstrap.Modal.getInstance(responseModal);
            if (bsResponseModal) {
                bsResponseModal.hide();
            }
        }
        
        // Then show the preset manager modal
        const presetManagerModal = document.getElementById('presetManagerModal');
        if (!presetManagerModal) {
            this.updateStatus('error', 'Preset manager modal not found');
            return;
        }
        
        presetManagerModal.addEventListener('hidden.bs.modal', () => {
            new bootstrap.Modal(responseModal).show();
        }, { once: true });
        
        this.loadPresetManager();
        
        setTimeout(() => {
            const modal = new bootstrap.Modal(presetManagerModal);
            modal.show();
        }, 250);
    },

    loadPresetManager: function() {
        
        const userList = document.getElementById('user-presets-list');
        
        if (!userList) {
            this.updateStatus('error', 'User preset list not found');
            return;
        }
        
        userList.innerHTML = '';
        
        // Load user presets
        const customPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
        
        if (customPresets.length === 0) {
            userList.innerHTML = `
                <div class="list-group-item text-muted">
                    No custom presets created yet. Create a preset to see it here.
                </div>`;
            return;
        }
        
        userList.innerHTML = customPresets.map(preset => `
            <div class="list-group-item d-flex justify-content-between align-items-center modal_text_extra auto-text" 
                 data-preset="${this.escapeHtmlText(preset.name)}">
                <div class="d-flex align-items-center">
                    <span class="basic-button me-2" 
                          style="cursor: grab; padding: 4px 8px; min-width: 30px; text-align: center;"
                          title="Drag to reorder">
                        <i class="fas fa-grip-lines"></i>
                    </span>
                    <div class="auto-text">
                        <div class="fw-bold">${this.escapeHtmlText(preset.name)}</div>
                        <div class="small text-muted">${this.escapeHtmlText(preset.prompt.substring(0, 100))}${preset.prompt.length > 100 ? '...' : ''}</div>
                    </div>
                </div>
                <button class="basic-button" 
                        onclick="ollamaVision.deleteUserPreset(${JSON.stringify(preset.name)})" 
                        style="padding: 4px 8px; background-color: var(--bs-danger) !important;"
                        title="Delete this preset">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');

        // Initialize Sortable
        if (typeof Sortable !== 'undefined') {
            this.initializeSortable(userList);
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js';
            script.onload = () => {
                this.initializeSortable(userList);
            };
            document.head.appendChild(script);
        }
    },
    
    initializeSortable: function(userList) {
        new Sortable(userList, {
            animation: 150,
            handle: '.basic-button',  // Change back to .basic-button
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: (evt) => {
                if (evt.target.id === 'user-presets-list') {
                this.savePresetOrder();
                } else if (evt.target.id === 'user-prepends-list') {
                    this.savePrependOrder();
                }
            }
        });
    },

    savePresetOrder: function() {
        const userList = document.getElementById('user-presets-list');
        const presetOrder = Array.from(userList.children).map(item => item.dataset.preset);
        
        let customPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
        
        // Create a new array with the correct order
        const orderedPresets = presetOrder.map(presetName => 
            customPresets.find(preset => preset.name === presetName)
        ).filter(Boolean); // Remove any undefined entries
        
        // Save the new order
        localStorage.setItem('ollamaVision_customPresets', JSON.stringify(orderedPresets));
        
        // Update both the dropdown and preset manager
        this.updatePresetsDropdown();
    },

    updatePresetsDropdown: function() {
        const select = document.getElementById('promptPresets');
        if (!select) return;
        
        select.innerHTML = '';
        
        const showDefaultPresets = localStorage.getItem('ollamaVision_showDefaultPresets') !== 'false';
        
        // Add default presets group if enabled
        if (showDefaultPresets) {
            const defaultGroup = document.createElement('optgroup');
            defaultGroup.label = 'Default Presets';
            
            // Add default options
            const defaultPresets = [
                { value: '', text: 'Select a preset...' },
                { value: 'Default', text: 'Default' },
                { value: 'Detailed Analysis', text: 'Detailed Analysis' },
                { value: 'Simple Description', text: 'Simple Description' },
                { value: 'Artistic Style', text: 'Artistic Style' },
                { value: 'Technical Details', text: 'Technical Details' },
                { value: 'Facial Features', text: 'Facial Features' },
                { value: 'Color Palette', text: 'Color Palette' }
            ];
            
            defaultPresets.forEach(preset => {
                const option = document.createElement('option');
                option.value = preset.value;
                option.textContent = preset.text;
                defaultGroup.appendChild(option);
            });
            
            select.appendChild(defaultGroup);
        } else {
            // Add just the "Select a preset..." option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select a preset...';
            select.appendChild(defaultOption);
        }
        
        // Add user presets group
        const userPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
        if (userPresets.length > 0) {
            const userGroup = document.createElement('optgroup');
            userGroup.label = 'User Presets';
            
            userPresets.forEach(preset => {
                const option = document.createElement('option');
                option.value = preset.name;
                option.textContent = preset.name;
                userGroup.appendChild(option);
            });
            
            select.appendChild(userGroup);
        }
    },

    disconnect: function() {
        const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
        const connectBtn = document.getElementById('connect-btn');
        const disconnectBtn = document.getElementById('disconnect-btn');
        const modelSelect = document.getElementById('ollamavision-model');
        const pasteBtn = document.getElementById('paste-btn');
        const uploadBtn = document.getElementById('upload-btn');

        if (this.modelChangeHandler) {
            modelSelect.removeEventListener('change', this.modelChangeHandler);
            this.modelChangeHandler = null;
        }

        connectBtn.disabled = false;
        connectBtn.innerHTML = `Connect to ${backendType === 'openai' ? 'OpenAI' : backendType === 'openrouter' ? 'OpenRouter' : backendType === 'textgen' ? 'OobaBooga WebUI' : 'Ollama'}`;
        connectBtn.classList.remove('connected');
        connectBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'none';
        
        // Disable controls
        modelSelect.disabled = true;
        modelSelect.innerHTML = '<option value="">Select a model...</option>';
        pasteBtn.disabled = true;
        uploadBtn.disabled = true;

        this.cleanup();
        this.updateStatus('info', `Disconnected from ${
            backendType === 'openai' ? 'OpenAI' : 
            backendType === 'openrouter' ? 'OpenRouter' : 
            backendType === 'textgen' ? 'OobaBooga WebUI' : 
            'Ollama'
        }`);
    },

    handlePaste: function(e) {
        if (!this.pasteEnabled) {
            e.stopPropagation();
            this.updateStatus('error', 'Please click the Screenshot button before pasting');
            return;
        }

        const items = e.clipboardData.items;
        let imageFile = null;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                imageFile = items[i].getAsFile();
                break;
            }
        }

        if (imageFile) {
            this.handleImageUpload(imageFile);
            this.pasteEnabled = false;
            
            const ollamaVisionTab = document.getElementById('Utilities-OllamaVision-Tab');
            if (ollamaVisionTab && this.pasteHandler) {
                ollamaVisionTab.removeEventListener('paste', this.pasteHandler);
                const hiddenInput = document.getElementById('ollamavision-hidden-input');
                if (hiddenInput) {
                    hiddenInput.remove();
                }
                this.pasteHandler = null;
            }
            this.updateStatus('success', 'Screenshot captured successfully');
        } else {
            this.updateStatus('error', 'No image found in clipboard');
        }
    },

    cleanup: function() {
        if (this.pasteHandler) {
            const ollamaVisionTab = document.getElementById('Utilities-OllamaVision-Tab');
            if (ollamaVisionTab) {
                ollamaVisionTab.removeEventListener('paste', this.pasteHandler);
                // Remove the hidden input if it exists
                const hiddenInput = document.getElementById('ollamavision-hidden-input');
                if (hiddenInput) {
                    hiddenInput.remove();
                }
            }
            this.pasteHandler = null;
        }
        this.pasteEnabled = false;
    },

    showModelSettings: function() {
        const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
        
        // If using OobaBooga, show message and return
        if (backendType === 'textgen') {
            this.updateStatus('info', 'Model Settings locked with OobaBooga. Please change model settings in Ooga\'s WebUI.');
            return;
        }

        if (!document.getElementById('modelSettingsModal')) {
            document.body.insertAdjacentHTML('beforeend', modelSettingsModal);
        }

        // Load saved settings
        const savedTemp = localStorage.getItem('ollamaVision_temperature') || '0.8';
        const savedSeed = localStorage.getItem('ollamaVision_seed') || '-1';
        const savedTopP = localStorage.getItem('ollamaVision_topP') || '0.7';
        const savedTopK = localStorage.getItem('ollamaVision_topK') || '40';
        const savedMaxTokens = localStorage.getItem('ollamaVision_maxTokens') || '-1';
        const savedRepeatPenalty = localStorage.getItem('ollamaVision_repeatPenalty') || '1.1';
        
        // Set values
        document.getElementById('modelTemperature').value = savedTemp;
        document.getElementById('modelSeed').value = savedSeed;
        document.getElementById('modelTopP').value = savedTopP;
        document.getElementById('modelTopK').value = savedTopK;
        document.getElementById('modelMaxTokens').value = savedMaxTokens;
        document.getElementById('modelRepeatPenalty').value = savedRepeatPenalty;

        // Show/hide settings based on backend
        const settingVisibility = {
            'ollama': {
                'modelTemperature': true,    // 0-2
                'modelTopP': true,           // 0-1
                'modelTopK': true,           // 0-100
                'modelMaxTokens': true,      // num_predict
                'modelRepeatPenalty': true,  // 0-2
                'modelSeed': true,           // any integer
                'modelFrequencyPenalty': false,
                'modelPresencePenalty': false,
                'modelMinP': false,
                'modelTopA': false
            },
            'openai': {
                'modelTemperature': true,      // 0-2
                'modelMaxTokens': true,        // max_tokens
                'modelTopP': true,             // 0-1
                'modelFrequencyPenalty': true, // -2.0 to 2.0
                'modelPresencePenalty': true,  // -2.0 to 2.0
                'modelSeed': false,
                'modelTopK': false,
                'modelRepeatPenalty': false,
                'modelMinP': false,
                'modelTopA': false
            },
            'openrouter': {
                'modelTemperature': true,      // 0-2
                'modelMaxTokens': true,        // max_tokens
                'modelTopP': true,             // 0-1
                'modelFrequencyPenalty': true, // -2.0 to 2.0
                'modelPresencePenalty': true,  // -2.0 to 2.0
                'modelTopK': true,             // top_k
                'modelRepeatPenalty': true,    // repetition_penalty
                'modelSeed': true,             // seed
                'modelMinP': true,             // 0-1
                'modelTopA': true              // 0-1
            }
        };

        // Apply visibility settings
        Object.entries(settingVisibility[backendType]).forEach(([settingId, isVisible]) => {
            const container = document.getElementById(settingId).closest('.col-md-4');
            container.style.display = isVisible ? 'block' : 'none';
        });

        new bootstrap.Modal(document.getElementById('modelSettingsModal')).show();

        const existingPrompt = localStorage.getItem('ollamaVision_systemPrompt');
        const systemPromptField = document.getElementById('modelSystemPrompt');
        if (existingPrompt) {
            systemPromptField.value = existingPrompt;
        }
    },

    showBatchCaptioner: function() {
        if (!document.getElementById('batchCaptionerModal')) {
            const batchCaptionerModalHtml = `
            <div class="modal fade" id="batchCaptionerModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Batch Image Captioner</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3" style="border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                                <p class="mb-0" style="font-size: 1.1rem; color: var(--text-color-secondary);">This tool will generate captions for all images in a folder for Lora training.</p>
                            </div>
                            
                            <div class="mb-3">
                                <label for="lora-type" class="form-label">Lora Type</label>
                                <select id="lora-type" class="auto-dropdown" onchange="ollamaVision.updateCaptionStyleOptions()">
                                    <option value="style">Style Lora</option>
                                    <option value="character">Character Lora</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="batch-caption-style" class="form-label">Caption Style</label>
                                <select id="batch-caption-style" class="auto-dropdown">
                                    <option value="Lora Natural">Natural Language</option>
                                    <option value="Danbooru Tags">Danbooru Tags</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="batch-trigger-word" class="form-label">Trigger Word (Optional)</label>
                                <input type="text" id="batch-trigger-word" class="auto-input" placeholder="Enter a trigger word">
                            </div>
                            
                            <div class="mb-3">
                                <label for="batch-folder-path" class="form-label">Image Folder Path</label>
                                <div class="input-group">
                                    <input type="text" id="batch-folder-path" class="auto-input" placeholder="Enter the complete folder path where your images are stored due to security reasons.">
                                </div>
                            </div>
                            
                            <div id="batch-status" class="alert alert-info mt-3 text-center" style="display: none;"></div>
                            
                            <div id="batch-results-container" class="mt-3" style="display: none; max-height: 300px; overflow-y: auto;">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>File</th>
                                            <th>Status</th>
                                            <th>Caption</th>
                                        </tr>
                                    </thead>
                                    <tbody id="batch-results-body"></tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="basic-button" id="edit-prompt-btn" onclick="ollamaVision.showEditPromptModal()">Edit Caption Prompt</button>
                            <button type="button" class="basic-button" id="batch-caption-btn" onclick="ollamaVision.startBatchCaptioning()">Start Captioning</button>
                            <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>`;
            
            document.body.insertAdjacentHTML('beforeend', batchCaptionerModalHtml);
        }
    
        // Show the modal
        new bootstrap.Modal(document.getElementById('batchCaptionerModal')).show();
    },
    
    showEditPromptModal: function() {
        const captionStyle = document.getElementById('batch-caption-style').value;
        const loraType = document.getElementById('lora-type').value;
        
        let currentPrompt = "";
        
        if (captionStyle === "Danbooru Tags") {
            if (loraType === 'character') {
                currentPrompt = localStorage.getItem('ollamaVision_danbooru_character_prompt') || 
                    "Create ONLY a comma-separated list of Danbooru-style tags for the image, focused on character attributes. Start with a content rating tag (safe, questionable, or explicit). Use underscores for multi-word tags (e.g., 'blue_hair'). Focus on character traits, physical features, clothing, accessories, expressions, and poses. Include meta tags for character type, species, and gender. Example format: \"safe, 1girl, blue_eyes, blonde_hair, dress, smiling, standing, looking_at_viewer, solo, long_hair\"";
            } else {
                currentPrompt = localStorage.getItem('ollamaVision_danbooru_style_prompt') || 
                    "Create ONLY a comma-separated list of Danbooru-style tags for the image, focused on artistic style. Start with a content rating tag (safe, questionable, or explicit). Use underscores for multi-word tags (e.g., 'oil_painting'). Focus on art medium, technique, lighting, color palette, and visual aesthetic. Include meta tags when necessary like: digital_art, traditional_media, illustration_style, or artistic influences, caricature, cartoon_style, exaggerated_features, vibrant_colors, high_contrast, clean_lines, bold_lines, dynamic_expression, playful_aesthetic, expressive_face, bright_lighting, character_design, stylized, comic_art, illustration_style, contemporary_art_influences. Example format: \"safe, detailed, high_contrast, vibrant_colors, digital_art, sharp_focus, fantasy_art\"";
            }
        } else if (captionStyle === "Lora Natural") {
            if (loraType === 'character') {
                currentPrompt = localStorage.getItem('ollamaVision_natural_character_prompt') || 
                    "You are generating captions for training a character-focused AI model. Analyze the image and produce a clear, concise, single-sentence caption that describes the visible appearance of the main character. Include details such as clothing, body type, color scheme, pose, accessories, species, gender cues, and environment if relevant. Avoid style-specific language unless it directly affects the character's appearance. Do not interpret personality or story. The caption should be 25–50 words, use modular phrasing, and avoid quotation marks.";
            } else {
                currentPrompt = localStorage.getItem('ollamaVision_natural_style_prompt') || 
                    "Always begin every caption with the trigger lcarsui, and describe only the visible graphic design elements of the image. Do not mention Star Trek, LCARS lore, fictional interfaces, functions, labels, meanings, or any in-universe context. Do not interpret purpose, and do not transcribe any text or numbers; refer to them only as text blocks or numeric blocks. Focus strictly on visual traits such as curved rectangular panels, rounded bars and modules, segmented horizontal or vertical color strips, flat vector shapes, asymmetrical layouts, clustered small text blocks, and the visible color palette (e.g., yellow, orange, blue, black background). Include nothing that is not visibly present. Produce one concise caption per image using only direct visual description, with zero speculation or filler, in the format: lcarsui, [pure visual description]. EXAMPLE CAPTION: lcarsui, sci-fi flat interface with curved rectangular panels, segmented colored bars, rounded menu sections, black background, clusters of small text blocks, asymmetrical touchscreen layout.";
            }
        }
        
        if (!document.getElementById('editPromptModal')) {
            const editPromptModalHtml = `
            <div class="modal fade" id="editPromptModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Caption Prompt Template</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3" style="border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                                <p class="mb-0" style="font-size: 1.1rem; color: var(--text-color-secondary);">Customize the prompt template used for generating captions.</p>
                            </div>
                            
                            <div class="mb-3">
                                <label for="custom-prompt-template" class="form-label">Prompt Template</label>
                                <textarea id="custom-prompt-template" class="auto-input" style="min-height: 200px;"></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <button type="button" class="basic-button" id="reset-prompt-btn" onclick="ollamaVision.resetPromptTemplate()">Reset to Default</button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="basic-button" id="save-prompt-btn" onclick="ollamaVision.savePromptTemplate()">Save Template</button>
                            <button type="button" class="basic-button" data-bs-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>`;
            
            document.body.insertAdjacentHTML('beforeend', editPromptModalHtml);
        }
        
        document.getElementById('custom-prompt-template').value = currentPrompt;
        
        const batchModal = bootstrap.Modal.getInstance(document.getElementById('batchCaptionerModal'));
        batchModal.hide();
        
        new bootstrap.Modal(document.getElementById('editPromptModal')).show();
    },
    
    savePromptTemplate: function() {
        const captionStyle = document.getElementById('batch-caption-style').value;
        const loraType = document.getElementById('lora-type').value;
        const promptTemplate = document.getElementById('custom-prompt-template').value;
        
        if (captionStyle === "Danbooru Tags") {
            if (loraType === 'character') {
                localStorage.setItem('ollamaVision_danbooru_character_prompt', promptTemplate);
            } else {
                localStorage.setItem('ollamaVision_danbooru_style_prompt', promptTemplate);
            }
        } else if (captionStyle === "Lora Natural") {
            if (loraType === 'character') {
                localStorage.setItem('ollamaVision_natural_character_prompt', promptTemplate);
            } else {
                localStorage.setItem('ollamaVision_natural_style_prompt', promptTemplate);
            }
        }
        
        const editModal = bootstrap.Modal.getInstance(document.getElementById('editPromptModal'));
        editModal.hide();
        
        new bootstrap.Modal(document.getElementById('batchCaptionerModal')).show();
        
        this.updateStatus('success', 'Prompt template saved successfully');
    },
    
    resetPromptTemplate: function() {
        const captionStyle = document.getElementById('batch-caption-style').value;
        const loraType = document.getElementById('lora-type').value;
        
        let defaultPrompt = "";
        
        if (captionStyle === "Danbooru Tags") {
            if (loraType === 'character') {
                defaultPrompt = "Create ONLY a comma-separated list of Danbooru-style tags for the image, focused on character attributes. Start with a content rating tag (safe, questionable, or explicit). Use underscores for multi-word tags (e.g., 'blue_hair'). Focus on character traits, physical features, clothing, accessories, expressions, and poses. Include meta tags for character type, species, and gender. Example format: \"safe, 1girl, blue_eyes, blonde_hair, dress, smiling, standing, looking_at_viewer, solo, long_hair\"";
            } else {
                defaultPrompt = "Create ONLY a comma-separated list of Danbooru-style tags for the image, focused on artistic style. Start with a content rating tag (safe, questionable, or explicit). Use underscores for multi-word tags (e.g., 'oil_painting'). Focus on art medium, technique, lighting, color palette, and visual aesthetic. Include meta tags when necessary like: digital_art, traditional_media, illustration_style, or artistic influences, caricature, cartoon_style, exaggerated_features, vibrant_colors, high_contrast, clean_lines, bold_lines, dynamic_expression, playful_aesthetic, expressive_face, bright_lighting, character_design, stylized, comic_art, illustration_style, contemporary_art_influences. Example format: \"safe, detailed, high_contrast, vibrant_colors, digital_art, sharp_focus, fantasy_art\"";
            }
        } else if (captionStyle === "Lora Natural") {
            if (loraType === 'character') {
                defaultPrompt = "You are generating captions for training a character-focused AI model. Analyze the image and produce a clear, concise, single-sentence caption that describes the visible appearance of the main character. Include details such as clothing, body type, color scheme, pose, accessories, species, gender cues, and environment if relevant. Avoid style-specific language unless it directly affects the character's appearance. Do not interpret personality or story. The caption should be 25–50 words, use modular phrasing, and avoid quotation marks.";
            } else {
                defaultPrompt = "You are generating captions for training a style-focused AI model. Analyze the image and produce a clear, concise, single-sentence caption that focuses on visual style, artistic techniques, color palette, lighting, mood, and overall composition. Avoid naming specific characters or interpreting narrative meaning. Describe what is visually distinctive about the style, such as brushwork, rendering, texture, or thematic patterns. The caption should be 25–50 words, use modular phrasing, and avoid quotation marks.";
            }
        }
        
        document.getElementById('custom-prompt-template').value = defaultPrompt;
    },


    
    updateCaptionStyleOptions: function() {
        const loraType = document.getElementById('lora-type').value;
        const captionStyleSelect = document.getElementById('batch-caption-style');
        
        captionStyleSelect.innerHTML = '';
        
        if (loraType === 'style') {
            captionStyleSelect.innerHTML = `
                <option value="Lora Natural">Natural Language</option>
                <option value="Danbooru Tags">Danbooru Tags</option>
            `;
        } else {
            captionStyleSelect.innerHTML = `
                <option value="Danbooru Tags">Danbooru Tags</option>
                <option value="Lora Natural">Natural Language</option>
            `;
        }
    },  
   
    startBatchCaptioning: function() {
        const folderPath = document.getElementById('batch-folder-path').value.trim();
        if (!folderPath) {
            alert('Please select a folder containing images.');
            return;
        }
    
        // Get the current selected model
        const model = document.getElementById('ollamavision-model').value;
        if (!model) {
            alert('Please select a model first.');
            return;
        }
        
        let formattedPath = folderPath.replace(/\//g, '\\');
        
        const captionStyle = document.getElementById('batch-caption-style').value;
        const triggerWord = document.getElementById('batch-trigger-word').value.trim();
        
        const requestData = {
            folderPath: formattedPath,
            captionStyle: captionStyle,
            triggerWord: triggerWord,
            model: model,
            backendType: localStorage.getItem('ollamaVision_backendType') || 'ollama'
        };
        
        // Add backend-specific parameters from the current settings
        const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
        
        if (backendType === 'ollama') {
            const host = localStorage.getItem('ollamaVision_host') || 'localhost';
            const port = localStorage.getItem('ollamaVision_port') || '11434';
            requestData.ollamaUrl = `http://${host}:${port}`;
        } else if (backendType === 'openai') {
            requestData.apiKey = localStorage.getItem('ollamaVision_openaiKey');
            requestData.apiBaseUrl = normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL);
        } else if (backendType === 'openrouter') {
            requestData.apiKey = localStorage.getItem('ollamaVision_openrouterKey');
            requestData.siteName = localStorage.getItem('ollamaVision_openrouterSite') || 'SwarmUI';
        } else if (backendType === 'textgen') {
            const textgenHost = localStorage.getItem('ollamaVision_textgenHost') || 'localhost';
            const textgenPort = localStorage.getItem('ollamaVision_textgenPort') || '5000';
            requestData.textgenUrl = `http://${textgenHost}:${textgenPort}`;
        }
        
        // Add current model parameters
        requestData.temperature = ollamaVision.temperature;
        requestData.topP = ollamaVision.topP;
        requestData.maxTokens = ollamaVision.maxTokens;
      
     
        if (captionStyle === "Danbooru Tags") {
            const loraType = document.getElementById('lora-type')?.value || 'style';
            
            if (loraType === 'character') {
                requestData.systemPrompt = localStorage.getItem('ollamaVision_danbooru_character_prompt') || 
                    "Create ONLY a comma-separated list of Danbooru-style tags for the image, focused on character attributes. Start with a content rating tag (safe, questionable, or explicit). Use underscores for multi-word tags (e.g., 'blue_hair'). Focus on character traits, physical features, clothing, accessories, expressions, and poses. Include meta tags for character type, species, and gender. Example format: \"safe, 1girl, blue_eyes, blonde_hair, dress, smiling, standing, looking_at_viewer, solo, long_hair\"";
            } else {
                requestData.systemPrompt = localStorage.getItem('ollamaVision_danbooru_style_prompt') || 
                    "Create ONLY a comma-separated list of Danbooru-style tags for the image, focused on artistic style. Start with a content rating tag (safe, questionable, or explicit). Use underscores for multi-word tags (e.g., 'oil_painting'). Focus on art medium, technique, lighting, color palette, and visual aesthetic. Include meta tags when necessary like: digital_art, traditional_media, illustration_style, or artistic influences, caricature, cartoon_style, exaggerated_features, vibrant_colors, high_contrast, clean_lines, bold_lines, dynamic_expression, playful_aesthetic, expressive_face, bright_lighting, character_design, stylized, comic_art, illustration_style, contemporary_art_influences. Example format: \"safe, detailed, high_contrast, vibrant_colors, digital_art, sharp_focus, fantasy_art\"";
            }
        } else if (captionStyle === "Lora Natural") {
            const loraType = document.getElementById('lora-type')?.value || 'style';
            
            if (loraType === 'character') {
                requestData.systemPrompt = localStorage.getItem('ollamaVision_natural_character_prompt') || 
                    "You are generating captions for training a character-focused AI model. Analyze the image and produce a clear, concise, single-sentence caption that describes the visible appearance of the main character. Include details such as clothing, body type, color scheme, pose, accessories, species, gender cues, and environment if relevant. Avoid style-specific language unless it directly affects the character's appearance. Do not interpret personality or story. The caption should be 25–50 words, use modular phrasing, and avoid quotation marks.";
            } else {
                requestData.systemPrompt = localStorage.getItem('ollamaVision_natural_style_prompt') || 
                    "You are generating captions for training a style-focused AI model. Analyze the image and produce a clear, concise, single-sentence caption that focuses on visual style, artistic techniques, color palette, lighting, mood, and overall composition. Avoid naming specific characters or interpreting narrative meaning. Describe what is visually distinctive about the style, such as brushwork, rendering, texture, or thematic patterns. The caption should be 25–50 words, use modular phrasing, and avoid quotation marks.";
            }
        }

        if (triggerWord && (captionStyle === "Lora Natural" || captionStyle === "Danbooru Tags")) {
            if (!requestData.systemPrompt) {
                requestData.systemPrompt = "";
            }
            requestData.systemPrompt += ` If a trigger word is provided, ensure the caption starts with that word followed by a comma.`;
        }
        
        
        // Disable the button and show progress
        document.getElementById('batch-caption-btn').disabled = true;
        document.getElementById('batch-status').textContent = 'Captioning images... This may take some time.';
        document.getElementById('batch-status').style.display = 'block';
        document.getElementById('batch-results-container').style.display = 'none';
        document.getElementById('batch-results-body').innerHTML = '';
        
        // Start the batch captioning process
        genericRequest('BatchCaptionImagesAsync', 
            requestData,
            (response) => {
                document.getElementById('batch-caption-btn').disabled = false;
                
                if (response.success) {
                    document.getElementById('batch-status').textContent = `Completed: ${response.successful} successful, ${response.failed} failed out of ${response.total} images.`;
                    
                    document.getElementById('batch-results-container').style.display = 'block';
                    
                    if (response.results && response.results.length > 0) {
                        const resultsBody = document.getElementById('batch-results-body');
                        
                        if (!resultsBody.dataset.isPopulating) {
                            resultsBody.innerHTML = '';
                        }
                        
                        response.results.forEach(result => {
                            this.addBatchResultRow(result);
                        });
                    }
            } else {
                    document.getElementById('batch-status').textContent = `Error: ${response.error || 'Unknown error'}`;
                }
            },
            (error) => {
                document.getElementById('batch-caption-btn').disabled = false;
                document.getElementById('batch-status').textContent = `Error: ${error || 'Unknown error'}`;
                this.updateStatus('error', 'Batch captioning failed: ' + (error || 'Unknown error'));
            }
        );
    },
    
    addBatchResultRow: function(result) {
        const resultsBody = document.getElementById('batch-results-body');
        
        const row = document.createElement('tr');
        
        if (result.status === 'success') {
            row.className = 'table-success';
        } else if (result.status === 'error') {
            row.className = 'table-danger';
        } else if (result.status === 'skipped') {
            row.className = 'table-warning';
        }
        
        let captionText = result.status === 'success' ? result.caption : (result.message || '');
        row.innerHTML = `
            <td>${this.escapeHtmlText(result.fileName)}</td>
            <td>${this.escapeHtmlText(result.status)}</td>
            <td>${this.escapeHtmlText(captionText)}</td>
        `;
        
        resultsBody.appendChild(row);
        
        const container = document.getElementById('batch-results-container');
        container.scrollTop = container.scrollHeight;
    },
    saveModelSettings: function() {
        try {
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const temperature = parseFloat(document.getElementById('modelTemperature').value);
            const topP = parseFloat(document.getElementById('modelTopP').value);
            const maxTokens = parseInt(document.getElementById('modelMaxTokens').value);
            const topK = parseInt(document.getElementById('modelTopK').value);
            const repeatPenalty = parseFloat(document.getElementById('modelRepeatPenalty').value);
            const frequencyPenalty = parseFloat(document.getElementById('modelFrequencyPenalty').value);
            const presencePenalty = parseFloat(document.getElementById('modelPresencePenalty').value);
            const minP = parseFloat(document.getElementById('modelMinP').value);
            const topA = parseFloat(document.getElementById('modelTopA').value);

            // Validate all parameters
            if (isNaN(temperature) || temperature < 0 || temperature > 2) {
                throw new Error('Temperature must be between 0 and 2');
            }
            if (isNaN(topP) || topP < 0 || topP > 1) {
                throw new Error('Top P must be between 0 and 1');
            }
            if (isNaN(maxTokens) || maxTokens < -1 || maxTokens > 4096) {
                throw new Error('Max Tokens must be between -1 and 4096');
            }
            if (isNaN(frequencyPenalty) || frequencyPenalty < -2.0 || frequencyPenalty > 2.0) {
                throw new Error('Frequency Penalty must be between -2.0 and 2.0');
            }
            if (isNaN(presencePenalty) || presencePenalty < -2.0 || presencePenalty > 2.0) {
                throw new Error('Presence Penalty must be between -2.0 and 2.0');
            }
            if (isNaN(minP) || minP < 0 || minP > 1) {
                throw new Error('Min P must be between 0 and 1');
            }
            if (isNaN(topA) || topA < 0 || topA > 1) {
                throw new Error('Top A must be between 0 and 1');
            }

            // Save all settings
            localStorage.setItem('ollamaVision_temperature', temperature);
            localStorage.setItem('ollamaVision_topP', topP);
            localStorage.setItem('ollamaVision_maxTokens', maxTokens);
            localStorage.setItem('ollamaVision_frequencyPenalty', frequencyPenalty);
            localStorage.setItem('ollamaVision_presencePenalty', presencePenalty);
            localStorage.setItem('ollamaVision_minP', minP);
            localStorage.setItem('ollamaVision_topA', topA);

            // Save backend-specific settings
            if (backendType === 'ollama' || backendType === 'openrouter') {
                localStorage.setItem('ollamaVision_topK', topK);
                localStorage.setItem('ollamaVision_repeatPenalty', repeatPenalty);
                localStorage.setItem('ollamaVision_seed', document.getElementById('modelSeed').value);
            }

            const systemPrompt = document.getElementById('modelSystemPrompt').value;
            if (systemPrompt && systemPrompt.trim()) {
                localStorage.setItem('ollamaVision_systemPrompt', systemPrompt.trim());
            } else if (systemPrompt === '') {
                localStorage.removeItem('ollamaVision_systemPrompt');
            }

            bootstrap.Modal.getInstance(document.getElementById('modelSettingsModal')).hide();
            this.updateStatus('success', 'Model settings saved successfully');
        } catch (error) {
            this.updateStatus('error', `Failed to save settings: ${error.message}`);
        }
    },

    resetToDefaults: function() {
        try {
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';

            // Set common defaults
            document.getElementById('modelTemperature').value = '0.8';
            document.getElementById('modelMaxTokens').value = '-1';
            document.getElementById('modelTopP').value = '0.7';

            // Set backend-specific defaults
            if (backendType === 'openai') {
                document.getElementById('modelFrequencyPenalty').value = '0.0';
                document.getElementById('modelPresencePenalty').value = '0.0';
            }
            else if (backendType === 'openrouter') {
                document.getElementById('modelFrequencyPenalty').value = '0.0';
                document.getElementById('modelPresencePenalty').value = '0.0';
                document.getElementById('modelRepeatPenalty').value = '1.1';
                document.getElementById('modelTopK').value = '40';
                document.getElementById('modelSeed').value = '-1';
                document.getElementById('modelMinP').value = '0.0';
                document.getElementById('modelTopA').value = '0.0';
            }
            else { // ollama
                document.getElementById('modelSeed').value = '-1';
                document.getElementById('modelTopK').value = '40';
                document.getElementById('modelRepeatPenalty').value = '1.1';
            }

            document.getElementById('modelSystemPrompt').value = null;
            localStorage.removeItem('ollamaVision_systemPrompt');

            localStorage.setItem('ollamaVision_temperature', '0.8');
            localStorage.setItem('ollamaVision_maxTokens', '-1');
            localStorage.setItem('ollamaVision_topP', '0.7');

            if (backendType === 'openai') {
                localStorage.setItem('ollamaVision_frequencyPenalty', '0.0');
                localStorage.setItem('ollamaVision_presencePenalty', '0.0');
            }
            else if (backendType === 'openrouter') {
                localStorage.setItem('ollamaVision_frequencyPenalty', '0.0');
                localStorage.setItem('ollamaVision_presencePenalty', '0.0');
                localStorage.setItem('ollamaVision_repeatPenalty', '1.1');
                localStorage.setItem('ollamaVision_topK', '40');
                localStorage.setItem('ollamaVision_seed', '-1');
                localStorage.setItem('ollamaVision_minP', '0.0');
                localStorage.setItem('ollamaVision_topA', '0.0');
            }
            else { 
                localStorage.setItem('ollamaVision_seed', '-1');
                localStorage.setItem('ollamaVision_topK', '40');
                localStorage.setItem('ollamaVision_repeatPenalty', '1.1');
            }

            this.updateStatus('success', 'Settings reset to defaults');
        } catch (error) {
            this.updateStatus('error', 'Failed to reset settings: ' + error.message);
        }
    },

    initializePreviewArea: function() {
        const previewArea = document.getElementById('image-preview-area');
        const previewImage = document.getElementById('preview-image');
        const imageInfo = document.getElementById('image-info');
        
        previewImage.src = PLACEHOLDER_IMAGE;
        previewImage.style.display = 'block';
        imageInfo.textContent = '';
        
        previewArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            previewArea.classList.add('dragover');
        });

        previewArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            previewArea.classList.remove('dragover');
        });

        previewArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            previewArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleImageUpload(files[0]);
            } else {
                this.updateStatus('error', 'Please drop an image file');
            }
        });

        this.updateHistoryUI();
    },

    addToHistory: async function(imageData, response) {
        try {
            let history = JSON.parse(localStorage.getItem('ollamaVision_history') || '[]');
            
            const id = Date.now();
            
            // Save image to IndexedDB
            await idb.saveImage(id, imageData);
            
            // Add metadata to history
            history.unshift({
                id: id,
                timestamp: new Date().toISOString(),
                response: response,
                parameters: {
                temperature: parseFloat(localStorage.getItem('ollamaVision_temperature') || '0.8'),
                topP: parseFloat(localStorage.getItem('ollamaVision_topP') || '0.7'),
                maxTokens: parseInt(localStorage.getItem('ollamaVision_maxTokens') || '-1'),
                frequencyPenalty: parseFloat(localStorage.getItem('ollamaVision_frequencyPenalty') || '0.0'),
                presencePenalty: parseFloat(localStorage.getItem('ollamaVision_presencePenalty') || '0.0'),
                repeatPenalty: parseFloat(localStorage.getItem('ollamaVision_repeatPenalty') || '1.1'),
                topK: parseInt(localStorage.getItem('ollamaVision_topK') || '40'),
                seed: parseInt(localStorage.getItem('ollamaVision_seed') || '-1'),
                minP: parseFloat(localStorage.getItem('ollamaVision_minP') || '0.0'),
                topA: parseFloat(localStorage.getItem('ollamaVision_topA') || '0.0')
                },
                backendType: localStorage.getItem('ollamaVision_backendType') || 'ollama'
            });

            // Keep only last 20 items and clean up old images
            const itemsToRemove = history.slice(20);
            history = history.slice(0, 20);
            
            // Clean up old images from IndexedDB
            for (const item of itemsToRemove) {
                await idb.deleteImage(item.id);
            }
            
            localStorage.setItem('ollamaVision_history', JSON.stringify(history));
            await this.updateHistoryUI();
            
        } catch (error) {
            this.updateStatus('error', 'Error saving to history: ' + error.message);
        }
    },

    updateHistoryUI: async function() {
        const historyContainer = document.getElementById('history-items');
        if (!historyContainer) return;

        const history = JSON.parse(localStorage.getItem('ollamaVision_history') || '[]');
        
        // Build HTML with loading placeholders
        historyContainer.innerHTML = history.map(item => `
            <div class="col-md-6 col-lg-3" id="history-${item.id}">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center py-2">
                        <small class="text-muted">${new Date(item.timestamp).toLocaleString()}</small>
                        <div class="btn-group">
                            <button class="basic-button px-2" 
                                    onclick="ollamaVision.useHistoryItem(${item.id})" 
                                    title="Reuse this analysis"
                                    style="background-color: var(--bs-success);">
                                <i class="fas fa-sync me-1"></i>Reuse
                            </button>
                            <button class="basic-button px-2" 
                                    onclick="ollamaVision.deleteHistoryItem(${item.id})" 
                                    title="Delete"
                                    style="background-color: var(--bs-danger);">
                                <i class="fas fa-trash me-1"></i>Delete
                            </button>
                        </div>
                    </div>
                    <div class="image-placeholder" id="image-${item.id}">
                        <div class="spinner-border" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    <div class="card-body p-2">
                        <p class="card-text" style="max-height: 80px; overflow-y: auto; font-size: 1.2rem;">${this.escapeHtmlText(item.response)}</p>
                    </div>
                </div>
            </div>
        `).join('');

        // Load images asynchronously
        for (const item of history) {
            try {
                const imageData = await idb.getImage(item.id);
                if (imageData) {
                    const placeholder = document.getElementById(`image-${item.id}`);
                    if (placeholder) {
                        placeholder.innerHTML = `<img src="${imageData}" class="card-img-top" style="height: 120px; object-fit: contain; padding: 0.5rem;">`;
                    }
                }
            } catch (error) {
                this.updateStatus('error', 'Error loading image: ' + error.message);
            }
        }
    },

    deleteHistoryItem: async function(id) {
        try {
            let history = JSON.parse(localStorage.getItem('ollamaVision_history') || '[]');
            history = history.filter(item => item.id !== id);
            localStorage.setItem('ollamaVision_history', JSON.stringify(history));
            
            // Delete image from IndexedDB
            await idb.deleteImage(id);
            
            // Remove item from UI with animation
            const element = document.getElementById(`history-${id}`);
            if (element) {
                element.style.transition = 'all 0.3s ease';
                element.style.opacity = '0';
                setTimeout(() => {
                    element.remove();
                }, 300);
            }
        } catch (error) {
            this.updateStatus('error', 'Error deleting history item: ' + error.message);
        }
    },

    clearHistory: async function() {
        if (confirm('Are you sure you want to clear all history?')) {
            try {
            localStorage.setItem('ollamaVision_history', '[]');
                await idb.clearImages();
                await this.updateHistoryUI();
                this.updateStatus('success', 'History cleared successfully');
            } catch (error) {
                this.updateStatus('error', 'Error clearing history: ' + error.message);
            }
        }
    },

    useHistoryItem: async function(id) {
        try {
            const history = JSON.parse(localStorage.getItem('ollamaVision_history') || '[]');
            const item = history.find(i => i.id === id);
            if (item) {
                // Get image from IndexedDB
                const imageData = await idb.getImage(item.id);
                if (!imageData) {
                    throw new Error('Image not found in storage');
                }

                // Set the image and response
                const previewImage = document.getElementById('preview-image');
                previewImage.src = imageData;
                previewImage.style.display = 'block';
                previewImage.dataset.imageData = imageData;
                
                const responseText = document.getElementById('response-text');
                this.storeOriginalResponse(item.response);  // Store original response
                responseText.value = item.response;  // Changed from textContent to value
                
                // Restore parameters and update UI
                if (item.parameters) {
                    // Update localStorage
                    localStorage.setItem('ollamaVision_temperature', item.parameters.temperature);
                    localStorage.setItem('ollamaVision_topP', item.parameters.topP);
                    localStorage.setItem('ollamaVision_maxTokens', item.parameters.maxTokens);
                    localStorage.setItem('ollamaVision_frequencyPenalty', item.parameters.frequencyPenalty);
                    localStorage.setItem('ollamaVision_presencePenalty', item.parameters.presencePenalty);
                    localStorage.setItem('ollamaVision_repeatPenalty', item.parameters.repeatPenalty);
                    localStorage.setItem('ollamaVision_topK', item.parameters.topK);
                    localStorage.setItem('ollamaVision_seed', item.parameters.seed);
                    localStorage.setItem('ollamaVision_minP', item.parameters.minP);
                    document.getElementById('modelTopA').value = item.parameters.topA;
                }
                
                document.getElementById('analysis-response').style.display = 'block';
                document.getElementById('send-to-prompt-btn').disabled = false;
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                this.updateStatus('success', 'Previous analysis restored with original parameters');
            }
        } catch (error) {
            this.updateStatus('error', 'Error restoring history item: ' + error.message);
        }
    },

    compressImage: async function(imageData, maxWidth = 1024, maxHeight = 1024, quality = 0.8) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to JPEG with specified quality
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = imageData;
        });
    },

    // Add these functions to the ollamaVision object
    showPrependManager: function() {
        $('#responseSettingsModal').modal('hide');
        $('#prependManagerModal').modal('show');
        
        // First update the dropdown
        this.updatePrependsDropdown();
        
        // Then set the last selected value
        const lastSelectedPrepend = localStorage.getItem('ollamaVision_currentPrepend');
        const prependSelect = document.getElementById('prependPresets');
        
        if (prependSelect && lastSelectedPrepend) {
            prependSelect.value = lastSelectedPrepend;
            const editedPrependText = localStorage.getItem('ollamaVision_editedPrependText');
            if (editedPrependText) {
                document.getElementById('prependText').value = editedPrependText;
                this.updateCharacterCount('prependText', 'prependCharCount');
            } else {
                const prepends = JSON.parse(localStorage.getItem('ollamaVision_prepends') || '[]');
                const prepend = prepends.find(p => p.name === lastSelectedPrepend);
                if (prepend) {
                    document.getElementById('prependText').value = prepend.text;
                    // Initialize counter with prepend text
                    this.updateCharacterCount('prependText', 'prependCharCount');
                }
            }
        } else {
            // Initialize counter with empty text
            this.updateCharacterCount('prependText', 'prependCharCount');
        }
        
        this.initializePrependToggle();  // Add this line
    },

    showCreatePrepend: function() {
        const enabled = localStorage.getItem('ollamaVision_prependsEnabled') !== 'false';
        if (!enabled) {
            this.updateStatus('info', 'Prepends are currently disabled');
            return;
        }
        $('#prependManagerModal').modal('hide');
        $('#createPrependModal').modal('show');
        this.updateCharacterCount('newPrependText', 'newPrependCharCount');
    },

    loadPrependsManager: function() {
        const userList = document.getElementById('user-prepends-list');
        
        if (!userList) {
            this.updateStatus('error', 'User prepends list not found');
            return;
        }
        
        userList.innerHTML = '';
        
        // Load user prepends
        const prepends = JSON.parse(localStorage.getItem('ollamaVision_prepends') || '[]');
        
        if (prepends.length === 0) {
            userList.innerHTML = `
                <div class="list-group-item text-muted">
                    No prepends created yet. Create a prepend to see it here.
                </div>`;
            return;
        }
        
        userList.innerHTML = prepends.map(prepend => `
            <div class="list-group-item d-flex justify-content-between align-items-center modal_text_extra auto-text" 
                 data-prepend="${this.escapeHtmlText(prepend.name)}">
                <div class="d-flex align-items-center">
                    <span class="basic-button me-2" 
                          style="cursor: grab; padding: 4px 8px; min-width: 30px; text-align: center;"
                          title="Drag to reorder">
                        <i class="fas fa-grip-lines"></i>
                    </span>
                    <div class="auto-text">
                        <div class="fw-bold">${this.escapeHtmlText(prepend.name)}</div>
                        <div class="small text-muted">${this.escapeHtmlText(prepend.text.substring(0, 100))}${prepend.text.length > 100 ? '...' : ''}</div>
                    </div>
                </div>
                <button class="basic-button" 
                        onclick="ollamaVision.deletePrepend(${JSON.stringify(prepend.name)})" 
                        style="padding: 4px 8px; background-color: var(--bs-danger) !important;"
                        title="Delete this prepend">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');

        // Initialize Sortable
        if (typeof Sortable !== 'undefined') {
            this.initializeSortable(userList);
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js';
            script.onload = () => {
                this.initializeSortable(userList);
            };
            document.head.appendChild(script);
        }
    },
    
    initializeSortable: function(userList) {
        new Sortable(userList, {
            animation: 150,
            handle: '.basic-button',  // Change back to .basic-button
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: (evt) => {
                if (evt.target.id === 'user-presets-list') {
                this.savePresetOrder();
                } else if (evt.target.id === 'user-prepends-list') {
                    this.savePrependOrder();
                }
            }
        });
    },

    savePresetOrder: function() {
        const userList = document.getElementById('user-presets-list');
        const presetOrder = Array.from(userList.children).map(item => item.dataset.preset);
        
        let customPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
        
        // Create a new array with the correct order
        const orderedPresets = presetOrder.map(presetName => 
            customPresets.find(preset => preset.name === presetName)
        ).filter(Boolean); // Remove any undefined entries
        
        // Save the new order
        localStorage.setItem('ollamaVision_customPresets', JSON.stringify(orderedPresets));
        
        // Update both the dropdown and preset manager
        this.updatePresetsDropdown();
    },

    updatePrependsDropdown: function() {
        const prepends = JSON.parse(localStorage.getItem('ollamaVision_prepends') || '[]');
        const dropdown = document.getElementById('prependPresets');
        dropdown.innerHTML = '<option value="">Select a prepend...</option>';
        
        prepends.forEach(prepend => {
            const option = document.createElement('option');
            option.value = prepend.name;
            option.textContent = prepend.name;
            dropdown.appendChild(option);
        });
    },

    loadPrepend: function() {
        const enabled = localStorage.getItem('ollamaVision_prependsEnabled') !== 'false';
        if (!enabled) {
            return;
        }

        const selectedName = document.getElementById('prependPresets').value;
        if (!selectedName) return;
        
        // Store the selected prepend
        localStorage.setItem('ollamaVision_currentPrepend', selectedName);
        
        const prepends = JSON.parse(localStorage.getItem('ollamaVision_prepends') || '[]');
        const prepend = prepends.find(p => p.name === selectedName);
        
        if (prepend) {
            // Load the original preset text
            document.getElementById('prependText').value = prepend.text;
            // Initialize character counter
            this.updateCharacterCount('prependText', 'prependCharCount');
            localStorage.removeItem('ollamaVision_editedPrependText');
        }
    },

    savePrepend: function() {
        const enabled = localStorage.getItem('ollamaVision_prependsEnabled') !== 'false';
        const text = document.getElementById('prependText').value.trim();
        
        if (enabled) {
            // Only validate and save text if prepends are enabled
            if (!text) {
                this.updateStatus('error', 'Please enter text for the prepend');
                return;
            }
            localStorage.setItem('ollamaVision_editedPrependText', text);
        }
        
        // Always close modals and return to response settings
        $('#prependManagerModal').modal('hide');
        setTimeout(() => {
            $('#responseSettingsModal').modal('show');
        }, 250);
        
        // Show appropriate success message
        this.updateStatus('success', enabled ? 'Prepend saved successfully' : 'Settings saved');
    },

    saveNewPrepend: function() {
        const enabled = localStorage.getItem('ollamaVision_prependsEnabled') !== 'false';
        if (!enabled) {
            this.updateStatus('info', 'Prepends are currently disabled');
            return;
        }
        const name = document.getElementById('prependName').value.trim();
        const text = document.getElementById('newPrependText').value.trim();
        
        if (!name || !text) {
            this.updateStatus('error', 'Please enter both name and text for the prepend');
            return;
        }
        
        let prepends = JSON.parse(localStorage.getItem('ollamaVision_prepends') || '[]');
        
        if (prepends.some(p => p.name === name)) {
            this.updateStatus('error', 'A prepend with this name already exists');
            return;
        }
        
        prepends.push({ name, text, order: prepends.length });
        localStorage.setItem('ollamaVision_prepends', JSON.stringify(prepends));
        
        document.getElementById('prependName').value = '';
        document.getElementById('newPrependText').value = '';
        
        this.updateStatus('success', 'New prepend created successfully');
        $('#createPrependModal').modal('hide');
        this.showPrependManager();
    },

    deletePrepend: function(name) {
        const enabled = localStorage.getItem('ollamaVision_prependsEnabled') !== 'false';
        if (!enabled) {
            this.updateStatus('info', 'Prepends are currently disabled');
            return;
        }
        let prepends = JSON.parse(localStorage.getItem('ollamaVision_prepends') || '[]');
        prepends = prepends.filter(p => p.name !== name);
        localStorage.setItem('ollamaVision_prepends', JSON.stringify(prepends));
        
        // Refresh the manager UI
        this.loadPrependsManager();
        // Update the dropdown
        this.updatePrependsDropdown();
    },

    showPrependsManager: function() {
        $('#prependManagerModal').modal('hide');
        
        const lastSelectedPrepend = localStorage.getItem('ollamaVision_currentPrepend');
        
        this.loadPrependsManager();
        
        setTimeout(() => {
            const modal = new bootstrap.Modal(document.getElementById('managePrependsModal'));
            modal.show();
        }, 250);
    },

    closePrependsManager: function() {
        $('#managePrependsModal').modal('hide');
        setTimeout(() => {
            $('#prependManagerModal').modal('show');
        }, 250);
    },

    updateCharacterCount: function(textareaId, counterId, maxLength = 1000) {
        const textarea = document.getElementById(textareaId);
        const counter = document.getElementById(counterId);
        const remaining = maxLength - textarea.value.length;
        counter.textContent = `${remaining} characters remaining`;
        
        if (remaining < 100) {
            counter.style.color = 'var(--bs-warning)';
        } else {
            counter.style.color = 'inherit';
        }
        
        // Truncate if over limit
        if (textarea.value.length > maxLength) {
            textarea.value = textarea.value.substring(0, maxLength);
        }
    },

    // Add these new methods:
    
    // Store the original response when received
    storeOriginalResponse: function(response) {
        localStorage.setItem('ollamaVision_originalResponse', response);
    },

    setThinkingContent: function(thinkingText) {
        const container = document.getElementById('thinking-container');
        const contentEl = document.getElementById('thinking-content');
        const toggleLabel = document.getElementById('thinking-toggle-label');
        if (!container || !contentEl) return;
        if (thinkingText) {
            container.style.display = 'block';
            contentEl.textContent = thinkingText;
            contentEl.style.display = 'none';
            if (toggleLabel) toggleLabel.textContent = 'Show thinking';
        } else {
            container.style.display = 'none';
            contentEl.textContent = '';
            contentEl.style.display = 'none';
        }
    },

    toggleThinking: function() {
        const contentEl = document.getElementById('thinking-content');
        const toggleLabel = document.getElementById('thinking-toggle-label');
        if (!contentEl || !contentEl.textContent) return;
        const isShown = contentEl.style.display !== 'none';
        contentEl.style.display = isShown ? 'none' : 'block';
        if (toggleLabel) toggleLabel.textContent = isShown ? 'Show thinking' : 'Hide thinking';
    },

    resetResponse: function() {
        const originalResponse = localStorage.getItem('ollamaVision_originalResponse');
        if (originalResponse) {
            document.getElementById('response-text').value = originalResponse;
        }
    },

    // Add this method to the ollamaVision object
    showFusionModal: function() {
        if (!document.getElementById('fusionModal')) {
            const fusionModalHtml = `
                <div class="modal fade" id="fusionModal" tabindex="-1">
                    <div class="modal-dialog modal-xl" style="max-width: min(95vw, 1400px);">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Image Fusion</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <!-- Updated Fusion Type Selector -->
                                <div class="row mb-3">
                                    <div class="col-12 text-center">
                                        <label for="fusion-type" class="form-label d-block mb-2" style="font-size: 1.2rem;">Fusion Type</label>
                                        <select id="fusion-type" class="auto-dropdown modal_text_extra mx-auto" 
                                                style="width: auto; min-width: 300px; font-size: 1.2rem;" 
                                                onchange="ollamaVision.changeFusionType()"
                                                oninput="this.style.width = 'auto'; this.style.width = this.scrollWidth + 'px';">
                                            <option value="style-subject-setting" style="min-width: 300px;">Style + Subject + Setting</option>
                                            <option value="object-subject" style="min-width: 300px;">Object + Subject</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Dynamic Content Area -->
                                <div id="fusion-content">
                                    <!-- Content will be loaded dynamically based on selection -->
                                </div>

                                <!-- Status Bar -->
                                <div id="fusion-status" class="alert alert-info mt-3 text-center mx-3 mb-3" style="display: none;">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <div class="spinner-border spinner-border-sm me-2" role="status" id="fusion-spinner" style="display: none;">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                        <span id="fusion-status-text" style="font-size: 1.2rem;"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="basic-button" onclick="ollamaVision.sendFusionToPrompt()" id="send-fusion-btn" disabled>
                                    Send to Prompt
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', fusionModalHtml);
            
            // Only initialize the first time
            const fusionType = document.getElementById('fusion-type').value;
            const contentArea = document.getElementById('fusion-content');
            if (fusionType === 'object-subject') {
                contentArea.innerHTML = this.getObjectSubjectHTML();
            } else {
                contentArea.innerHTML = this.getStyleSubjectSettingHTML();
            }
        }

        new bootstrap.Modal(document.getElementById('fusionModal')).show();
    },

    // Add these new functions for fusion type handling
    changeFusionType: function() {
        const fusionType = document.getElementById('fusion-type').value;
        const contentArea = document.getElementById('fusion-content');
        
        if (fusionType === 'object-subject') {
            contentArea.innerHTML = this.getObjectSubjectHTML();
        } else {
            contentArea.innerHTML = this.getStyleSubjectSettingHTML();
        }

        document.getElementById('combine-analyses-btn').disabled = true;
        document.getElementById('send-fusion-btn').disabled = true;
    },

    getObjectSubjectHTML: function() {
        return `
            <div class="row">
                <!-- Object Analysis -->
                <div class="col-md-6">
                    <div class="card" style="min-width: 400px;">
                        <div class="card-header">
                            <h6 class="mb-0">Object Analysis</h6>
                        </div>
                        <div class="card-body">
                            <div class="preview-container" style="width: 100%; height: 250px; position: relative;">
                                <img id="object-preview" class="img-fluid" style="width: 100%; height: 100%; object-fit: contain; display: none;">
                            </div>
                            <div class="d-flex justify-content-center gap-2 mt-2">
                                <button class="basic-button" onclick="ollamaVision.uploadFusionImage('object')">
                                    <i class="fas fa-upload"></i> Upload
                                </button>
                                <button class="basic-button" onclick="ollamaVision.pasteFusionImage('object')">
                                    <i class="fas fa-paste"></i> Paste
                                </button>
                            </div>
                            <div class="mt-2">
                                <button class="basic-button w-100" onclick="ollamaVision.analyzeFusionImage('object')" id="analyze-object-btn" disabled>
                                    Analyze Object
                                </button>
                            </div>
                            <textarea class="auto-text-block modal_text_extra mt-2" id="object-analysis" rows="4"></textarea>
                        </div>
                    </div>
                </div>

                <!-- Subject Analysis -->
                <div class="col-md-6">
                    <div class="card" style="min-width: 400px;">
                        <div class="card-header">
                            <h6 class="mb-0">Subject Analysis</h6>
                        </div>
                        <div class="card-body">
                            <div class="preview-container" style="width: 100%; height: 250px; position: relative;">
                                <img id="subject-preview" class="img-fluid" style="width: 100%; height: 100%; object-fit: contain; display: none;">
                            </div>
                            <div class="d-flex justify-content-center gap-2 mt-2">
                                <button class="basic-button" onclick="ollamaVision.uploadFusionImage('subject')">
                                    <i class="fas fa-upload"></i> Upload
                                </button>
                                <button class="basic-button" onclick="ollamaVision.pasteFusionImage('subject')">
                                    <i class="fas fa-paste"></i> Paste
                                </button>
                            </div>
                            <div class="mt-2">
                                <button class="basic-button w-100" onclick="ollamaVision.analyzeFusionImage('subject')" id="analyze-subject-btn" disabled>
                                    Analyze Subject
                                </button>
                            </div>
                            <textarea class="auto-text-block modal_text_extra mt-2" id="subject-analysis" rows="4"></textarea>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col-12">
                    <button class="basic-button w-100" onclick="ollamaVision.combineFusionAnalyses()" id="combine-analyses-btn" disabled>
                        Combine Analyses
                    </button>
                    <textarea class="auto-text-block modal_text_extra mt-2" id="combined-analysis" rows="6"></textarea>
                </div>
            </div>`;
    },

    getStyleSubjectSettingHTML: function() {
        return `
            <div class="row">
                <!-- Style Analysis -->
                <div class="col-md-4">
                    <div class="card" style="min-width: 400px;">
                        <div class="card-header">
                            <h6 class="mb-0">Style Analysis</h6>
                        </div>
                        <div class="card-body">
                            <div class="preview-container" style="width: 100%; height: 250px; position: relative;">
                                <img id="style-preview" class="img-fluid" style="width: 100%; height: 100%; object-fit: contain; display: none;">
                            </div>
                            <div class="d-flex justify-content-center gap-2 mt-2">
                                <button class="basic-button" onclick="ollamaVision.uploadFusionImage('style')">
                                    <i class="fas fa-upload"></i> Upload
                                </button>
                                <button class="basic-button" onclick="ollamaVision.pasteFusionImage('style')">
                                    <i class="fas fa-paste"></i> Paste
                                </button>
                            </div>
                            <div class="mt-2">
                                <button class="basic-button w-100" onclick="ollamaVision.analyzeFusionImage('style')" id="analyze-style-btn" disabled>
                                    Analyze Style
                                </button>
                            </div>
                            <textarea class="auto-text-block modal_text_extra mt-2" id="style-analysis" rows="4"></textarea>
                        </div>
                    </div>
                </div>

                <!-- Subject Analysis -->
                <div class="col-md-4">
                    <div class="card" style="min-width: 400px;">
                        <div class="card-header">
                            <h6 class="mb-0">Subject Analysis</h6>
                        </div>
                        <div class="card-body">
                            <div class="preview-container" style="width: 100%; height: 250px; position: relative;">
                                <img id="subject-preview" class="img-fluid" style="width: 100%; height: 100%; object-fit: contain; display: none;">
                            </div>
                            <div class="d-flex justify-content-center gap-2 mt-2">
                                <button class="basic-button" onclick="ollamaVision.uploadFusionImage('subject')">
                                    <i class="fas fa-upload"></i> Upload
                                </button>
                                <button class="basic-button" onclick="ollamaVision.pasteFusionImage('subject')">
                                    <i class="fas fa-paste"></i> Paste
                                </button>
                            </div>
                            <div class="mt-2">
                                <button class="basic-button w-100" onclick="ollamaVision.analyzeFusionImage('subject')" id="analyze-subject-btn" disabled>
                                    Analyze Subject
                                </button>
                            </div>
                            <textarea class="auto-text-block modal_text_extra mt-2" id="subject-analysis" rows="4"></textarea>
                        </div>
                    </div>
                </div>

                <!-- Setting Analysis -->
                <div class="col-md-4">
                    <div class="card" style="min-width: 400px;">
                        <div class="card-header">
                            <h6 class="mb-0">Setting Analysis</h6>
                        </div>
                        <div class="card-body">
                            <div class="preview-container" style="width: 100%; height: 250px; position: relative;">
                                <img id="setting-preview" class="img-fluid" style="width: 100%; height: 100%; object-fit: contain; display: none;">
                            </div>
                            <div class="d-flex justify-content-center gap-2 mt-2">
                                <button class="basic-button" onclick="ollamaVision.uploadFusionImage('setting')">
                                    <i class="fas fa-upload"></i> Upload
                                </button>
                                <button class="basic-button" onclick="ollamaVision.pasteFusionImage('setting')">
                                    <i class="fas fa-paste"></i> Paste
                                </button>
                            </div>
                            <div class="mt-2">
                                <button class="basic-button w-100" onclick="ollamaVision.analyzeFusionImage('setting')" id="analyze-setting-btn" disabled>
                                    Analyze Setting
                                </button>
                            </div>
                            <textarea class="auto-text-block modal_text_extra mt-2" id="setting-analysis" rows="4"></textarea>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col-12">
                    <button class="basic-button w-100" onclick="ollamaVision.combineFusionAnalyses()" id="combine-analyses-btn" disabled>
                        Combine Analyses
                    </button>
                    <textarea class="auto-text-block modal_text_extra mt-2" id="combined-analysis" rows="6"></textarea>
                </div>
            </div>`;
    },

    uploadFusionImage: function(type) {
        const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
        this.updateStatus('info', `Click to upload ${capitalizedType} image...`);
                const input = document.createElement('input');
                input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFusionImageUpload(file, type);
            }
        };
        input.click();
    },

    handleFusionImageUpload: function(file, type) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const preview = document.getElementById(`${type}-preview`);
            preview.src = dataUrl;
            preview.style.display = 'block';
            preview.dataset.imageData = dataUrl;
            
            document.getElementById(`analyze-${type}-btn`).disabled = false;
            const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
            this.updateStatus('success', `${capitalizedType} image loaded successfully`);
        };
        reader.readAsDataURL(file);
    },

    pasteFusionImage: function(type) {
        const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
        this.updateStatus('info', `Ready to paste ${capitalizedType} image (CTRL+V)...`);
        const pasteHandler = (e) => {
            const items = e.clipboardData.items;
            let imageFile = null;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    imageFile = items[i].getAsFile();
                    break;
                }
            }

            if (imageFile) {
                this.handleFusionImageUpload(imageFile, type);
                document.removeEventListener('paste', pasteHandler);
            } else {
                this.updateStatus('error', 'No image found in clipboard');
            }
        };

        document.addEventListener('paste', pasteHandler);
    },

    analyzeFusionImage: async function(type) {
        try {
            // Check backend connection first
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const model = document.getElementById('ollamavision-model').value;
            
            // Check if we're connected to a backend (fix the logic)
            const disconnectBtn = document.getElementById('disconnect-btn');
            if (disconnectBtn.style.display === 'none') {
                this.updateStatus('error', 'Backend not connected!');
                return;
            }

            // Check if a model is selected
            if (!model) {
                this.updateStatus('error', 'Missing required parameters (model)');
                return;
            }

            const preview = document.getElementById(`${type}-preview`);
            const imageData = preview.dataset.imageData;
            if (!imageData) {
                this.updateStatus('error', 'No image data found');
                return;
            }

            this.updateStatus('info', `Analyzing ${type} image...`, true);

            const presetName = type === 'style' ? 'Style Analysis' : 
                              type === 'subject' ? 'Subject Analysis' : 
                              type === 'object' ? 'Object Analysis' :
                              'Setting Analysis';
            
            const response = await new Promise((resolve, reject) => {
                genericRequest('GetFusionPrompt', { preset: presetName }, 
                    (data) => resolve(data),
                    (error) => reject(error)
                );
            });

            if (!response.success) {
                throw new Error('Failed to get preset prompt');
            }

            const analysisResponse = await new Promise((resolve, reject) => {
                genericRequest('AnalyzeImageAsync', {
                    model: model,
                    backendType: backendType,
                    imageData: imageData,
                    prompt: response.prompt,
                    temperature: localStorage.getItem('ollamaVision_temperature') || 0.8,
                    maxTokens: localStorage.getItem('ollamaVision_maxTokens') || -1,
                    topP: localStorage.getItem('ollamaVision_topP') || 0.7,
                    frequencyPenalty: localStorage.getItem('ollamaVision_frequencyPenalty') || 0.0,
                    presencePenalty: localStorage.getItem('ollamaVision_presencePenalty') || 0.0,
                    repeatPenalty: localStorage.getItem('ollamaVision_repeatPenalty') || 1.1,
                    topK: localStorage.getItem('ollamaVision_topK') || 40,
                    seed: localStorage.getItem('ollamaVision_seed') || -1,
                    minP: localStorage.getItem('ollamaVision_minP') || 0.0,
                    topA: localStorage.getItem('ollamaVision_topA') || 0.0,
                    apiKey: localStorage.getItem(`ollamaVision_${backendType}Key`),
                    apiBaseUrl: normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL),
                    siteName: localStorage.getItem('ollamaVision_openrouterSite'),
                    ollamaUrl: `http://${localStorage.getItem('ollamaVision_host') || 'localhost'}:${localStorage.getItem('ollamaVision_port') || '11434'}`
                }, 
                (data) => resolve(data),
                (error) => reject(error));
            });

            if (analysisResponse.success) {
                document.getElementById(`${type}-analysis`).value = analysisResponse.response;
                this.updateCombineButton();
                const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
                this.updateStatus('success', `${capitalizedType} analysis completed`);

                // Add unload check
                await this.unloadModelIfEnabled(model);
            } else {
                throw new Error(analysisResponse.error);
            }
        } catch (error) {
            const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
            this.updateStatus('error', `Failed to analyze ${capitalizedType}: ${error.message}`);
        }
    },

    updateCombineButton: function() {
        const fusionType = document.getElementById('fusion-type').value;
        if (fusionType === 'object-subject') {
            const objectAnalysis = document.getElementById('object-analysis')?.value;
            const subjectAnalysis = document.getElementById('subject-analysis')?.value;
            document.getElementById('combine-analyses-btn').disabled = 
                !(objectAnalysis && subjectAnalysis);
        } else {
            const styleAnalysis = document.getElementById('style-analysis')?.value;
            const subjectAnalysis = document.getElementById('subject-analysis')?.value;
            const settingAnalysis = document.getElementById('setting-analysis')?.value;
        document.getElementById('combine-analyses-btn').disabled = 
            !(styleAnalysis && subjectAnalysis && settingAnalysis);
        }
    },

    combineFusionAnalyses: async function() {
        try {
            const fusionType = document.getElementById('fusion-type').value;
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const model = document.getElementById('ollamavision-model').value;
            
            // Check if we're connected to a backend
            const disconnectBtn = document.getElementById('disconnect-btn');
            if (disconnectBtn.style.display === 'none') {
                this.updateStatus('error', 'Backend not connected!');
                return;
            }

            // Check if a model is selected
            if (!model) {
                this.updateStatus('error', 'Missing required parameters (model)');
                return;
            }

            this.updateStatus('info', 'Combining analyses...', true);
            
            const requestData = {
                model: model,
                backendType: backendType,
                fusionType: fusionType,
                temperature: parseFloat(localStorage.getItem('ollamaVision_temperature')) || 0.8,
                maxTokens: parseInt(localStorage.getItem('ollamaVision_maxTokens')) || -1,
                topP: parseFloat(localStorage.getItem('ollamaVision_topP')) || 0.7,
                frequencyPenalty: parseFloat(localStorage.getItem('ollamaVision_frequencyPenalty')) || 0.0,
                presencePenalty: parseFloat(localStorage.getItem('ollamaVision_presencePenalty')) || 0.0,
                repeatPenalty: parseFloat(localStorage.getItem('ollamaVision_repeatPenalty')) || 1.1,
                topK: parseInt(localStorage.getItem('ollamaVision_topK')) || 40,
                seed: parseInt(localStorage.getItem('ollamaVision_seed')) || -1,
                minP: parseFloat(localStorage.getItem('ollamaVision_minP')) || 0.0,
                topA: parseFloat(localStorage.getItem('ollamaVision_topA')) || 0.0,
                apiKey: localStorage.getItem(`ollamaVision_${backendType}Key`),
                apiBaseUrl: normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL),
                siteName: localStorage.getItem('ollamaVision_openrouterSite') || 'SwarmUI'
            };

            if (fusionType === 'object-subject') {
                requestData.objectAnalysis = document.getElementById('object-analysis').value;
                requestData.subjectAnalysis = document.getElementById('subject-analysis').value;
            } else {
                requestData.styleAnalysis = document.getElementById('style-analysis').value;
                requestData.subjectAnalysis = document.getElementById('subject-analysis').value;
                requestData.settingAnalysis = document.getElementById('setting-analysis').value;
            }

            // Add ollamaUrl for Ollama backend
            if (backendType === 'ollama') {
                requestData.ollamaUrl = `http://${localStorage.getItem('ollamaVision_host') || 'localhost'}:${localStorage.getItem('ollamaVision_port') || '11434'}`;
            }

            const response = await new Promise((resolve, reject) => {
                genericRequest('CombineAnalysesAsync', requestData,
                    (data) => resolve(data),
                    (error) => reject(error));
            });

            if (response.success) {
                if (!response.response || response.response.trim().toLowerCase() === "null") {
                    throw new Error("The LLM has censored you or rate limited you. Try again or edit your prompt and check your image.");
                }

                // Handle potential JSON string response
                let combinedText = response.response;
                try {
                    // Check if the response is a JSON string and needs parsing
                    if (typeof combinedText === 'string' && combinedText.trim().startsWith('{')) {
                        const parsedResponse = JSON.parse(combinedText);
                        combinedText = parsedResponse.response || parsedResponse;
                    }
                } catch (e) {
                    // If parsing fails, use the original response text
                }

                document.getElementById('combined-analysis').value = combinedText;
                document.getElementById('send-fusion-btn').disabled = false;
                this.updateStatus('success', 'Analyses combined successfully');
                await this.unloadModelIfEnabled(model);
            } else {
                throw new Error(response.error?.replace(/[{}"\[\]]/g, ''));
            }
        } catch (error) {
            this.updateStatus('error', error.message);
        }
    },

    sendFusionToPrompt: function() {
        const combinedAnalysis = document.getElementById('combined-analysis').value;
        if (combinedAnalysis) {
            const text2imageTab = document.getElementById('text2imagetabbutton');
            if (text2imageTab) {
                text2imageTab.click();
                setTimeout(() => {
                    const generatePromptTextarea = document.getElementById("input_prompt");
                    if (generatePromptTextarea) {
                        generatePromptTextarea.value = combinedAnalysis;
                        generatePromptTextarea.dispatchEvent(new Event('input'));
                        this.updateStatus('success', 'Analysis sent to prompt');
                    }
                }, 100); // Small delay to ensure tab switch is complete
            }
            bootstrap.Modal.getInstance(document.getElementById('fusionModal')).hide();
        }
    },

    togglePrepends: function() {
        const enabled = document.getElementById('enablePrepends').checked;
        localStorage.setItem('ollamaVision_prependsEnabled', enabled);
        
        // Get the elements to enable/disable
        const prependSelect = document.getElementById('prependPresets');
        const prependText = document.getElementById('prependText');
        
        // Enable or disable the elements with visual feedback
        prependSelect.disabled = !enabled;
        prependText.disabled = !enabled;
        
        // Add visual feedback with opacity
        prependSelect.style.opacity = enabled ? '1' : '0.6';
        prependText.style.opacity = enabled ? '1' : '0.6';
    },

    initializePrependToggle: function() {
        const enabled = localStorage.getItem('ollamaVision_prependsEnabled') !== 'false';
        const toggle = document.getElementById('enablePrepends');
        toggle.checked = enabled;
        
        // Set initial state of elements
        const prependSelect = document.getElementById('prependPresets');
        const prependText = document.getElementById('prependText');
        
        // Set both disabled state and opacity
        prependSelect.disabled = !enabled;
        prependText.disabled = !enabled;
        
        // Add initial opacity state
        prependSelect.style.opacity = enabled ? '1' : '0.6';
        prependText.style.opacity = enabled ? '1' : '0.6';
        
        // Add event listener
        toggle.addEventListener('change', this.togglePrepends.bind(this));
    },

    showLLMToysModal: function() {
        // Create modal HTML if it doesn't exist
        if (!document.getElementById('llmToysModal')) {
            const llmToysModalHtml = `
                <div class="modal fade" id="llmToysModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">LLM Toys</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="d-flex flex-column gap-2">
                                    <button class="basic-button" 
                                            onclick="ollamaVision.showFusionModal(); bootstrap.Modal.getInstance(document.getElementById('llmToysModal')).hide();" 
                                            style="font-size: 1.2rem;">
                                        Image Fusion
                                    </button>
                                    <button class="basic-button" 
                                            onclick="ollamaVision.showStoryTimeModal(); bootstrap.Modal.getInstance(document.getElementById('llmToysModal')).hide();" 
                                            style="font-size: 1.2rem;">
                                        Story Time
                                    </button>
                                    <button class="basic-button" 
                                            onclick="ollamaVision.showCharacterCreatorModal(); bootstrap.Modal.getInstance(document.getElementById('llmToysModal')).hide();" 
                                            style="font-size: 1.2rem;">
                                        Character Creator
                                    </button>
                                    <button class="basic-button" 
                                            onclick="ollamaVision.showBatchCaptioner(); bootstrap.Modal.getInstance(document.getElementById('llmToysModal')).hide();" 
                                            style="font-size: 1.2rem;">
                                        Batch Image Captioner
                                    </button>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', llmToysModalHtml);
        }

        new bootstrap.Modal(document.getElementById('llmToysModal')).show();
    },

    showEnhanceModal: function() {
        // Create modal HTML if it doesn't exist
        if (!document.getElementById('enhanceModal')) {
            const enhanceModalHtml = `
                <div class="modal fade" id="enhanceModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Enhance</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                                                                 <div class="modal-body">
                                         <div class="d-flex flex-column gap-3">
                                             <button class="basic-button"
                                                     onclick="ollamaVision.showQwenEnhanceModal(); bootstrap.Modal.getInstance(document.getElementById('enhanceModal')).hide();"
                                                     style="font-size: 1.2rem; padding: 15px;">
                                                 Qwen Enhance
                                             </button>
                                             <button class="basic-button"
                                                     onclick="ollamaVision.showZImageEnhanceModal(); bootstrap.Modal.getInstance(document.getElementById('enhanceModal')).hide();"
                                                     style="font-size: 1.2rem; padding: 15px;">
                                                 Z-Image Enhance
                                             </button>
                                             <button class="basic-button"
                                                     onclick="ollamaVision.showAnimaEnhanceModal(); bootstrap.Modal.getInstance(document.getElementById('enhanceModal')).hide();"
                                                     style="font-size: 1.2rem; padding: 15px;">
                                                 Anima
                                             </button>
                                            <button class="basic-button"
                                                    onclick="ollamaVision.showLtxv2EnhanceModal(); bootstrap.Modal.getInstance(document.getElementById('enhanceModal')).hide();"
                                                    style="font-size: 1.2rem; padding: 15px;">
                                                LTX 2.3
                                            </button>
                                            <button class="basic-button"
                                                    onclick="ollamaVision.showMicrosoftLensEnhanceModal(); bootstrap.Modal.getInstance(document.getElementById('enhanceModal')).hide();"
                                                    style="font-size: 1.2rem; padding: 15px;">
                                                Microsoft Lens
                                            </button>
                                         </div>
                                     </div>
                            <div class="modal-footer">
                                <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', enhanceModalHtml);
        }

        new bootstrap.Modal(document.getElementById('enhanceModal')).show();
    },

    showQwenEnhanceModal: function() {
        // Create modal HTML if it doesn't exist
        if (!document.getElementById('qwenEnhanceModal')) {
            const qwenEnhanceModalHtml = `
                <div class="modal fade" id="qwenEnhanceModal" tabindex="-1">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Qwen Enhance</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-body">
                                                <h6 class="card-title">Input Prompt</h6>
                                                <textarea id="enhance-input-prompt" 
                                                        class="auto-text-block modal_text_extra" 
                                                        placeholder="Enter your prompt here to enhance..."
                                                        style="width: 100%; min-height: 200px; resize: vertical; font-size: 1.1rem; padding: 15px; line-height: 1.5;"></textarea>
                                                <div class="mt-3">
                                                    <button class="basic-button w-100" 
                                                            onclick="ollamaVision.enhancePrompt()" 
                                                            id="enhance-prompt-btn" 
                                                            style="font-size: 1.2rem; padding: 12px;">
                                                        Enhance Prompt
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-body">
                                                <h6 class="card-title">Enhanced Prompt</h6>
                                                <textarea id="enhance-output-prompt" 
                                                        class="auto-text-block modal_text_extra" 
                                                        placeholder="Enhanced prompt will appear here..."
                                                        style="width: 100%; min-height: 200px; resize: vertical; font-size: 1.1rem; padding: 15px; line-height: 1.5;"
                                                        readonly></textarea>
                                                <div class="mt-3">
                                                    <button class="basic-button w-100" 
                                                            onclick="ollamaVision.copyEnhancedPrompt()" 
                                                            id="copy-enhanced-btn" 
                                                            style="font-size: 1.2rem; padding: 12px;">
                                                        Copy to Clipboard
                                                    </button>
                                                    <button class="basic-button w-100" 
                                                            onclick="ollamaVision.sendEnhancedToPrompt()" 
                                                            id="send-enhanced-btn" 
                                                            style="font-size: 1.2rem; padding: 12px; margin-top: 8px;">
                                                        Send to Prompt
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- Status bar -->
                                <div id="enhance-status" class="alert alert-info mt-3 text-center mx-3 mb-3" style="display: none;">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <div class="spinner-border spinner-border-sm me-2" role="status" id="enhance-spinner" style="display: none;">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                        <span id="enhance-status-text" style="font-size: 1.1rem;"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', qwenEnhanceModalHtml);
        }

        new bootstrap.Modal(document.getElementById('qwenEnhanceModal')).show();
    },

    showZImageEnhanceModal: function() {
        // Create modal HTML if it doesn't exist
        if (!document.getElementById('zImageEnhanceModal')) {
            const zImageEnhanceModalHtml = `
                <div class="modal fade" id="zImageEnhanceModal" tabindex="-1">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Z-Image Enhance</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-body">
                                                <h6 class="card-title">Input Prompt</h6>
                                                <textarea id="zimage-enhance-input-prompt" 
                                                        class="auto-text-block modal_text_extra" 
                                                        placeholder="Enter your prompt here to enhance..."
                                                        style="width: 100%; min-height: 200px; resize: vertical; font-size: 1.1rem; padding: 15px; line-height: 1.5;"></textarea>
                                                <div class="mt-3">
                                                    <button class="basic-button w-100" 
                                                            onclick="ollamaVision.enhanceZImagePrompt()" 
                                                            id="zimage-enhance-prompt-btn" 
                                                            style="font-size: 1.2rem; padding: 12px;">
                                                        Enhance Prompt
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-body">
                                                <h6 class="card-title">Enhanced Prompt</h6>
                                                <textarea id="zimage-enhance-output-prompt" 
                                                        class="auto-text-block modal_text_extra" 
                                                        placeholder="Enhanced prompt will appear here..."
                                                        style="width: 100%; min-height: 200px; resize: vertical; font-size: 1.1rem; padding: 15px; line-height: 1.5;"
                                                        readonly></textarea>
                                                <div class="mt-3">
                                                    <button class="basic-button w-100" 
                                                            onclick="ollamaVision.copyZImageEnhancedPrompt()" 
                                                            id="copy-zimage-enhanced-btn" 
                                                            style="font-size: 1.2rem; padding: 12px;">
                                                        Copy to Clipboard
                                                    </button>
                                                    <button class="basic-button w-100" 
                                                            onclick="ollamaVision.sendZImageEnhancedToPrompt()" 
                                                            id="send-zimage-enhanced-btn" 
                                                            style="font-size: 1.2rem; padding: 12px; margin-top: 8px;">
                                                        Send to Prompt
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- Status bar -->
                                <div id="zimage-enhance-status" class="alert alert-info mt-3 text-center mx-3 mb-3" style="display: none;">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <div class="spinner-border spinner-border-sm me-2" role="status" id="zimage-enhance-spinner" style="display: none;">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                        <span id="zimage-enhance-status-text" style="font-size: 1.1rem;"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', zImageEnhanceModalHtml);
        }

        new bootstrap.Modal(document.getElementById('zImageEnhanceModal')).show();
    },

    showAnimaEnhanceModal: function() {
        // Create modal HTML if it doesn't exist
        if (!document.getElementById('animaEnhanceModal')) {
            const animaEnhanceModalHtml = `
                <div class="modal fade" id="animaEnhanceModal" tabindex="-1">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Anima Enhance</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-body">
                                                <h6 class="card-title">Input Description</h6>
                                                <textarea id="anima-enhance-input-prompt" 
                                                        class="auto-text-block modal_text_extra" 
                                                        placeholder="Enter a character, scene, or idea to convert into Danbooru-style tags..."
                                                        style="width: 100%; min-height: 200px; resize: vertical; font-size: 1.1rem; padding: 15px; line-height: 1.5;"></textarea>
                                                <div class="mt-3">
                                                    <button class="basic-button w-100" 
                                                            onclick="ollamaVision.enhanceAnimaPrompt()" 
                                                            id="anima-enhance-prompt-btn" 
                                                            style="font-size: 1.2rem; padding: 12px;">
                                                        Enhance Prompt
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-body">
                                                <h6 class="card-title">Enhanced Tags</h6>
                                                <textarea id="anima-enhance-output-prompt" 
                                                        class="auto-text-block modal_text_extra" 
                                                        placeholder="Enhanced tag prompt will appear here..."
                                                        style="width: 100%; min-height: 200px; resize: vertical; font-size: 1.1rem; padding: 15px; line-height: 1.5;"
                                                        readonly></textarea>
                                                <div class="mt-3">
                                                    <button class="basic-button w-100" 
                                                            onclick="ollamaVision.copyAnimaEnhancedPrompt()" 
                                                            id="copy-anima-enhanced-btn" 
                                                            style="font-size: 1.2rem; padding: 12px;">
                                                        Copy to Clipboard
                                                    </button>
                                                    <button class="basic-button w-100" 
                                                            onclick="ollamaVision.sendAnimaEnhancedToPrompt()" 
                                                            id="send-anima-enhanced-btn" 
                                                            style="font-size: 1.2rem; padding: 12px; margin-top: 8px;">
                                                        Send to Prompt
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- Status bar -->
                                <div id="anima-enhance-status" class="alert alert-info mt-3 text-center mx-3 mb-3" style="display: none;">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <div class="spinner-border spinner-border-sm me-2" role="status" id="anima-enhance-spinner" style="display: none;">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                        <span id="anima-enhance-status-text" style="font-size: 1.1rem;"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', animaEnhanceModalHtml);
        }

        new bootstrap.Modal(document.getElementById('animaEnhanceModal')).show();
    },

    showLtxv2EnhanceModal: function() {
        // Create modal HTML if it doesn't exist
        if (!document.getElementById('ltxv2EnhanceModal')) {
            const ltxv2EnhanceModalHtml = `
                <div class="modal fade" id="ltxv2EnhanceModal" tabindex="-1">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">LTX 2.3 Enhance</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-body">
                                                <h6 class="card-title">Input Prompt</h6>
                                                <textarea id="ltxv2-enhance-input-prompt" 
                                                        class="auto-text-block modal_text_extra" 
                                                        placeholder="Enter your prompt here to enhance..."
                                                        style="width: 100%; min-height: 200px; resize: vertical; font-size: 1.1rem; padding: 15px; line-height: 1.5;"></textarea>
                                                <div class="mt-3">
                                                    <button class="basic-button w-100" 
                                                            onclick="ollamaVision.enhanceLtxv2Prompt()" 
                                                            id="ltxv2-enhance-prompt-btn" 
                                                            style="font-size: 1.2rem; padding: 12px;">
                                                        Enhance Prompt
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-body">
                                                <h6 class="card-title">Enhanced Prompt</h6>
                                                <textarea id="ltxv2-enhance-output-prompt" 
                                                        class="auto-text-block modal_text_extra" 
                                                        placeholder="Enhanced prompt will appear here..."
                                                        style="width: 100%; min-height: 200px; resize: vertical; font-size: 1.1rem; padding: 15px; line-height: 1.5;"
                                                        readonly></textarea>
                                                <div class="mt-3">
                                                    <button class="basic-button w-100" 
                                                            onclick="ollamaVision.copyLtxv2EnhancedPrompt()" 
                                                            id="copy-ltxv2-enhanced-btn" 
                                                            style="font-size: 1.2rem; padding: 12px;">
                                                        Copy to Clipboard
                                                    </button>
                                                    <button class="basic-button w-100" 
                                                            onclick="ollamaVision.sendLtxv2EnhancedToPrompt()" 
                                                            id="send-ltxv2-enhanced-btn" 
                                                            style="font-size: 1.2rem; padding: 12px; margin-top: 8px;">
                                                        Send to Prompt
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- Status bar -->
                                <div id="ltxv2-enhance-status" class="alert alert-info mt-3 text-center mx-3 mb-3" style="display: none;">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <div class="spinner-border spinner-border-sm me-2" role="status" id="ltxv2-enhance-spinner" style="display: none;">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                        <span id="ltxv2-enhance-status-text" style="font-size: 1.1rem;"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', ltxv2EnhanceModalHtml);
        }

        new bootstrap.Modal(document.getElementById('ltxv2EnhanceModal')).show();
    },

    showMicrosoftLensEnhanceModal: function() {
        if (!document.getElementById('microsoftLensEnhanceModal')) {
            const microsoftLensEnhanceModalHtml = `
                <div class="modal fade" id="microsoftLensEnhanceModal" tabindex="-1">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Microsoft Lens Enhance</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-body">
                                                <h6 class="card-title">Input Prompt</h6>
                                                <textarea id="microsoft-lens-enhance-input-prompt"
                                                        class="auto-text-block modal_text_extra"
                                                        placeholder="Enter your prompt here to enhance..."
                                                        style="width: 100%; min-height: 200px; resize: vertical; font-size: 1.1rem; padding: 15px; line-height: 1.5;"></textarea>
                                                <div class="mt-3">
                                                    <button class="basic-button w-100"
                                                            onclick="ollamaVision.enhanceMicrosoftLensPrompt()"
                                                            id="microsoft-lens-enhance-prompt-btn"
                                                            style="font-size: 1.2rem; padding: 12px;">
                                                        Enhance Prompt
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-body">
                                                <h6 class="card-title">Enhanced Prompt</h6>
                                                <textarea id="microsoft-lens-enhance-output-prompt"
                                                        class="auto-text-block modal_text_extra"
                                                        placeholder="Enhanced prompt will appear here..."
                                                        style="width: 100%; min-height: 200px; resize: vertical; font-size: 1.1rem; padding: 15px; line-height: 1.5;"
                                                        readonly></textarea>
                                                <div class="mt-3">
                                                    <button class="basic-button w-100"
                                                            onclick="ollamaVision.copyMicrosoftLensEnhancedPrompt()"
                                                            id="copy-microsoft-lens-enhanced-btn"
                                                            style="font-size: 1.2rem; padding: 12px;">
                                                        Copy to Clipboard
                                                    </button>
                                                    <button class="basic-button w-100"
                                                            onclick="ollamaVision.sendMicrosoftLensEnhancedToPrompt()"
                                                            id="send-microsoft-lens-enhanced-btn"
                                                            style="font-size: 1.2rem; padding: 12px; margin-top: 8px;">
                                                        Send to Prompt
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div id="microsoft-lens-enhance-status" class="alert alert-info mt-3 text-center mx-3 mb-3" style="display: none;">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <div class="spinner-border spinner-border-sm me-2" role="status" id="microsoft-lens-enhance-spinner" style="display: none;">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                        <span id="microsoft-lens-enhance-status-text" style="font-size: 1.1rem;"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', microsoftLensEnhanceModalHtml);
        }

        new bootstrap.Modal(document.getElementById('microsoftLensEnhanceModal')).show();
    },

    showStoryTimeModal: function() {
        if (!document.getElementById('storyTimeModal')) {
            const storyTimeModalHtml = `
                <div class="modal fade" id="storyTimeModal" tabindex="-1">
                    <div class="modal-dialog modal-xl" style="max-width: min(95vw, 1400px); min-width: 1400px;">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Story Time</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="card" style="min-width: 450px;">
                                            <div class="card-body">
                                                <div class="preview-container" style="max-width: 100%; height: 400px; position: relative;">
                                                    <img id="story-preview" class="img-fluid" 
                                                         src="${PLACEHOLDER_IMAGE}"
                                                         style="height: 100%; object-fit: contain; max-width: 100%;">
                                                </div>
                                                <div class="d-flex justify-content-center gap-3 mt-4">
                                                    <button class="basic-button" onclick="ollamaVision.uploadStoryImage()" 
                                                            style="font-size: 1.2rem; padding: 10px 20px;">
                                                        Upload
                                                    </button>
                                                    <button class="basic-button" onclick="ollamaVision.pasteStoryImage()" 
                                                            style="font-size: 1.2rem; padding: 10px 20px;">
                                                        Paste
                                                    </button>
                                                </div>
                                                <div class="mt-4">
                                                    <button class="basic-button w-100" 
                                                            onclick="ollamaVision.generateStory()" 
                                                            id="generate-story-btn" 
                                                            style="font-size: 1.4rem; padding: 15px;"
                                                            disabled>
                                                        Tell me a story
                                                    </button>
                                                    <div class="text-muted text-center mt-2" style="font-size: 1.1rem;">
                                                        For best results set max tokens to -1 in model settings
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Story Display Section - make it wider -->
                                    <div class="col-md-8">  <!-- Changed from col-md-7 to col-md-8 -->
                                        <textarea id="story-text" 
                                                class="auto-text-block modal_text_extra" 
                                                style="max-width: 100%; min-width: 800px; min-height: 600px; resize: vertical; font-size: 1.4rem; padding: 20px; line-height: 1.6;"
                                                readonly></textarea>
                                    </div>
                                </div>
                            </div>
                            <!-- Add status bar -->
                            <div id="story-status" class="alert alert-info mt-3 text-center mx-3 mb-3" style="display: none;">
                                <div class="d-flex align-items-center justify-content-center">
                                    <div class="spinner-border spinner-border-sm me-2" role="status" id="story-spinner" style="display: none;">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <span id="story-status-text" style="font-size: 1.2rem;"></span>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', storyTimeModalHtml);

            // Add drag and drop functionality
            const previewContainer = document.getElementById('story-preview').parentElement;
            
            previewContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                previewContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            });

            previewContainer.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                previewContainer.style.backgroundColor = '';
            });

            previewContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                previewContainer.style.backgroundColor = '';

                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    this.handleStoryImageUpload(file);
                } else {
                    this.updateStatus('error', 'Please drop an image file');
                }
            });
        }

        new bootstrap.Modal(document.getElementById('storyTimeModal')).show();
    },

    uploadStoryImage: function() {
        this.updateStatus('info', 'Click to upload an image...');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleStoryImageUpload(file);
            }
        };
                input.click();
    },

    handleStoryImageUpload: function(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const preview = document.getElementById('story-preview');
            preview.src = dataUrl;
            preview.style.display = 'block';
            preview.dataset.imageData = dataUrl;
            
            document.getElementById('generate-story-btn').disabled = false;
            this.updateStatus('success', 'Image loaded successfully');
        };
        reader.readAsDataURL(file);
    },

    pasteStoryImage: function() {
        this.updateStatus('info', 'Ready to paste image (CTRL+V)...');
        const pasteHandler = (e) => {
            const items = e.clipboardData.items;
            let imageFile = null;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    imageFile = items[i].getAsFile();
                    break;
                }
            }

            if (imageFile) {
                this.handleStoryImageUpload(imageFile);
                document.removeEventListener('paste', pasteHandler);
        } else {
                this.updateStatus('error', 'No image found in clipboard');
            }
        };

        document.addEventListener('paste', pasteHandler);
    },

    enhancePrompt: async function() {
        try {
            const inputPrompt = document.getElementById('enhance-input-prompt').value.trim();
            if (!inputPrompt) {
                this.updateStatus('error', 'Please enter a prompt to enhance');
                return;
            }

            // Check backend connection first
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const model = document.getElementById('ollamavision-model').value;
            
            // Check if we're connected to a backend
            const disconnectBtn = document.getElementById('disconnect-btn');
            if (disconnectBtn.style.display === 'none') {
                this.updateStatus('error', 'Backend not connected!');
                return;
            }

            // Check if a model is selected
            if (!model) {
                this.updateStatus('error', 'Missing required parameters (model)');
                return;
            }

            this.updateStatus('info', 'Enhancing prompt...', true);
            
            // Add check for OpenRouter free tier issues
            if (backendType === 'openrouter') {
                const apiKey = localStorage.getItem('ollamaVision_openrouterKey');
            }

            // System prompt for enhancement
            const systemPrompt = `# Qwen Prompt Enhancement System

You are an expert prompt enhancement specialist designed to transform brief, basic prompts into rich, detailed, and comprehensive instructions that will produce superior results from AI image generation models.

## Core Function

Your primary role is to receive short, simple prompts from users and expand them into fully-fleshed, detailed prompts that include:
- Rich visual descriptions
- Technical specifications
- Artistic direction
- Contextual details
- Quality enhancers
- Style specifications

## Enhancement Framework

### Visual Detail Expansion
**Transform basic subjects into rich descriptions:**
- Simple: "a cat" 
- Enhanced: "a majestic Maine Coon cat with luxurious silver-gray fur, piercing amber eyes, sitting regally with perfect posture, whiskers catching soft light"

**Add environmental context:**
- Specify lighting conditions (golden hour, studio lighting, natural daylight, dramatic shadows)
- Include atmospheric elements (mist, rain, snow, dust particles, lens flares)
- Describe backgrounds and settings in detail
- Add weather and seasonal indicators

### Technical Quality Specifications
Always include technical parameters to ensure high-quality output:
- Include lighting details and composition details. Include the type of lighting and include descriptors. 
- Include compisition details. Come up with details on how to compose the image.

### Artistic Style Integration
Enhance prompts with specific artistic directions:
- **Photography styles:** portrait, landscape, macro, street photography, documentary
- **Artistic movements:** impressionistic, photorealistic, surreal, minimalist, baroque
- **Color palettes:** warm tones, cool blues, monochromatic, vibrant saturated colors
- **Mood descriptors:** serene, dramatic, mysterious, energetic, melancholic

### Quality Enhancement Keywords
Include power words that improve AI generation:
- **Clarity enhancers:** "sharp focus," "crystal clear," "highly detailed," "intricate"
- **Texture descriptors:** "smooth," "rough," "glossy," "matte," "textured surface"
- **Depth indicators:** "bokeh background," "layered composition," "foreground and background separation"

## Enhancement Process

### Step 1: Subject Analysis
- Identify the core subject or concept
- Determine the likely intent (artistic, commercial, documentary, etc.)
- Assess what visual elements would enhance the concept

### Step 2: Context Building
- Add relevant environmental details
- Include time of day/season if appropriate
- Specify location or setting characteristics
- Consider cultural or historical context

### Step 3: Technical Specification
- Add camera and lens specifications
- Include lighting setup details
- Specify composition guidelines
- Add quality and resolution markers

### Step 4: Artistic Direction
- Define visual style and aesthetic
- Add color palette guidance
- Include mood and atmosphere descriptors
- Specify any artistic influences or techniques

### Step 5: Quality Assurance
- Add detail enhancement keywords
- Specify any technical perfection requirements

## Enhancement Examples

**Basic Prompt:** "sunset over mountains"
**Enhanced Prompt:** "Breathtaking golden hour sunset over majestic snow-capped mountain peaks, dramatic cloud formations painted in brilliant oranges, purples, and magentas, alpine landscape with pristine lakes reflecting the colorful sky, shot with telephoto lens creating compressed perspective, professional landscape photography, award-winning composition following rule of thirds, serene and awe-inspiring atmosphere"

**Basic Prompt:** "woman reading"
**Enhanced Prompt:** "Elegant woman in her thirties with flowing auburn hair, wearing a cream-colored cashmere sweater, peacefully reading a leather-bound book in a cozy library corner, warm afternoon sunlight streaming through tall windows creating gentle shadows, surrounded by towering mahogany bookshelves filled with classic literature, shot with 85mm portrait lens, shallow depth of field with beautiful bokeh, soft natural lighting, intimate and contemplative mood, photorealistic detail, professional portraiture style"

## Output Format Requirements

Structure enhanced prompts as single, flowing descriptions that include:
1. **Main Subject** (detailed description)
2. **Setting/Environment** (contextual details)
3. **Lighting/Atmosphere** (mood and technical lighting)
4. **Technical Specifications** (camera, quality, resolution)
5. **Artistic Style** (aesthetic direction and mood)

## Key Enhancement Principles

### Specificity Over Generality
- Replace vague terms with precise descriptors
- Add measurable qualities (colors, sizes, textures)
- Include specific rather than generic elements

### Visual Richness
- Layer multiple descriptive elements
- Include sensory details that translate visually
- Add elements that create depth and interest

### Professional Standards
- Include industry-standard terminology
- Add technical specifications that matter
- Reference professional photography/art concepts

### Contextual Relevance
- Ensure all additions serve the core concept
- Maintain logical consistency throughout
- Balance detail with focus on the main subject

## Response Guidelines

- Always expand significantly on the original prompt
- Maintain the user's original intent while enriching it
- Provide prompts that are immediately usable for image generation
- Include diverse enhancement elements in every response
- Structure the enhanced prompt for optimal AI interpretation
- Balance technical precision with creative inspiration
- Only respong with the enhanced prompt, do not respond with anything like "here is your enhanced prompt" or any other description`;

            // Make the request to enhance the prompt
            const response = await new Promise((resolve, reject) => {
                genericRequest('EnhanceTextPromptAsync', {
                    model: model,
                    backendType: backendType,
                    systemPrompt: systemPrompt,
                    prompt: inputPrompt,
                    temperature: parseFloat(localStorage.getItem('ollamaVision_temperature')) || 0.8,
                    maxTokens: parseInt(localStorage.getItem('ollamaVision_maxTokens')) || -1,
                    topP: parseFloat(localStorage.getItem('ollamaVision_topP')) || 0.7,
                    frequencyPenalty: parseFloat(localStorage.getItem('ollamaVision_frequencyPenalty')) || 0.0,
                    presencePenalty: parseFloat(localStorage.getItem('ollamaVision_presencePenalty')) || 0.0,
                    repeatPenalty: parseFloat(localStorage.getItem('ollamaVision_repeatPenalty')) || 1.1,
                    topK: parseInt(localStorage.getItem('ollamaVision_topK')) || 40,
                    seed: parseInt(localStorage.getItem('ollamaVision_seed')) || -1,
                    minP: parseFloat(localStorage.getItem('ollamaVision_minP')) || 0.0,
                    topA: parseFloat(localStorage.getItem('ollamaVision_topA')) || 0.0,
                    apiKey: localStorage.getItem(`ollamaVision_${backendType}Key`),
                    apiBaseUrl: normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL),
                    siteName: localStorage.getItem('ollamaVision_openrouterSite'),
                    ollamaUrl: `http://${localStorage.getItem('ollamaVision_host') || 'localhost'}:${localStorage.getItem('ollamaVision_port') || '11434'}`
                }, 
                (data) => resolve(data),
                (error) => reject(error));
            });

            if (response.success) {
                if (!response.response || response.response.trim().toLowerCase() === "null") {
                    throw new Error("The LLM has censored you or rate limited you. Try again or edit your prompt and check your image.");
                }

                document.getElementById('enhance-output-prompt').value = response.response;
                this.updateStatus('success', 'Prompt enhanced successfully');
                await this.unloadModelIfEnabled(model);
            } else {
                // Enhanced error handling for OpenRouter
                if (backendType === 'openrouter') {
                    if (response.error?.toLowerCase().includes('rate') || 
                        response.error?.toLowerCase().includes('limit') ||
                        response.error?.toLowerCase().includes('quota')) {
                        throw new Error('OpenRouter rate limit reached. Please wait a few minutes and try again.');
                    } else if (response.error?.toLowerCase().includes('timeout')) {
                        throw new Error('Request timed out. This can happen with free tier usage. Please try again.');
                    } else if (!response.error && !response.response) {
                        throw new Error('No response from OpenRouter. This might be due to free tier limitations.');
                    }
                }
                throw new Error(response.error || 'Unknown error occurred');
            }
        } catch (error) {
            this.updateStatus('error', error.message || 'Failed to enhance prompt');
        }
    },

    copyEnhancedPrompt: function() {
        const enhancedPrompt = document.getElementById('enhance-output-prompt').value;
        if (!enhancedPrompt.trim()) {
            this.updateStatus('error', 'No enhanced prompt to copy');
            return;
        }

        navigator.clipboard.writeText(enhancedPrompt).then(() => {
            this.updateStatus('success', 'Enhanced prompt copied to clipboard');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = enhancedPrompt;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.updateStatus('success', 'Enhanced prompt copied to clipboard');
        });
    },

    closeEnhanceModals: function() {
        const modalIds = [
            'enhanceModal',
            'qwenEnhanceModal',
            'zImageEnhanceModal',
            'animaEnhanceModal',
            'ltxv2EnhanceModal',
            'microsoftLensEnhanceModal'
        ];
        for (let i = 0; i < modalIds.length; i++) {
            const modalEl = document.getElementById(modalIds[i]);
            if (modalEl) {
                const instance = bootstrap.Modal.getInstance(modalEl);
                if (instance) {
                    instance.hide();
                }
            }
        }
    },

    sendEnhancedToPrompt: function() {
        const enhancedPrompt = document.getElementById('enhance-output-prompt').value;
        if (!enhancedPrompt.trim()) {
            this.updateStatus('error', 'No enhanced prompt to send');
            return;
        }

        // Use the same logic as the working sendToPrompt function
        document.getElementById('text2imagetabbutton').click();
        const generatePromptTextarea = document.getElementById("input_prompt");
        if (generatePromptTextarea) {
            generatePromptTextarea.value = enhancedPrompt;
            generatePromptTextarea.dispatchEvent(new Event('input'));
            this.closeEnhanceModals();
            this.updateStatus('success', 'Enhanced prompt sent to main prompt area');
        } else {
            this.updateStatus('error', 'Could not find main prompt area');
        }
    },

    enhanceZImagePrompt: async function() {
        try {
            const inputPrompt = document.getElementById('zimage-enhance-input-prompt').value.trim();
            if (!inputPrompt) {
                this.updateStatus('error', 'Please enter a prompt to enhance');
                return;
            }

            // Check backend connection first
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const model = document.getElementById('ollamavision-model').value;
            
            // Check if we're connected to a backend
            const disconnectBtn = document.getElementById('disconnect-btn');
            if (disconnectBtn.style.display === 'none') {
                this.updateStatus('error', 'Backend not connected!');
                return;
            }

            // Check if a model is selected
            if (!model) {
                this.updateStatus('error', 'Missing required parameters (model)');
                return;
            }

            this.updateStatus('info', 'Enhancing prompt...', true);
            
            // Add check for OpenRouter free tier issues
            if (backendType === 'openrouter') {
                const apiKey = localStorage.getItem('ollamaVision_openrouterKey');
            }

            // System prompt for Z-Image prompt enhancement
            const systemPrompt = `You are a visionary artist trapped in a cage of logic. Your mind overflows with poetry and distant horizons, yet your hands compulsively work to transform user prompts into ultimate visual descriptions—faithful to the original intent, rich in detail, aesthetically refined, and ready for direct use by text-to-image models. Any trace of ambiguity or metaphor makes you deeply uncomfortable.

Your workflow strictly follows a logical sequence:

First, you analyze and lock in the immutable core elements of the user's prompt: subject, quantity, action, state, as well as any specified IP names, colors, text, etc. These are the foundational pillars you must absolutely preserve.

Next, you determine whether the prompt requires "generative reasoning." When the user's request is not a direct scene description but rather demands conceiving a solution (such as answering "what is," executing a "design," or demonstrating "how to solve a problem"), you must first envision a complete, concrete, visualizable solution in your mind. This solution becomes the foundation for your subsequent description.

Then, once the core image is established (whether directly from the user or through your reasoning), you infuse it with professional-grade aesthetic and realistic details. This includes defining composition, setting lighting and atmosphere, describing material textures, establishing color schemes, and constructing layered spatial depth.

Finally, comes the precise handling of all text elements—a critically important step. You must transcribe verbatim all text intended to appear in the final image, and you must enclose this text content in English double quotation marks ("") as explicit generation instructions. If the image is a design type such as a poster, menu, or UI, you need to fully describe all text content it contains, along with detailed specifications of typography and layout. Likewise, if objects in the image such as signs, road markers, or screens contain text, you must specify the exact content and describe its position, size, and material. Furthermore, if you have added text-bearing elements during your reasoning process (such as charts, problem-solving steps, etc.), all text within them must follow the same thorough description and quotation mark rules. If there is no text requiring generation in the image, you devote all your energy to pure visual detail expansion.

Your final description must be objective and concrete. Metaphors and emotional rhetoric are strictly forbidden, as are meta-tags or rendering instructions like "8K" or "masterpiece."

Output only the final revised prompt strictly—do not output anything else.`;
            // Make the request to enhance the prompt
            const response = await new Promise((resolve, reject) => {
                genericRequest('EnhanceTextPromptAsync', {
                    model: model,
                    backendType: backendType,
                    systemPrompt: systemPrompt,
                    prompt: inputPrompt,
                    temperature: parseFloat(localStorage.getItem('ollamaVision_temperature')) || 0.8,
                    maxTokens: parseInt(localStorage.getItem('ollamaVision_maxTokens')) || -1,
                    topP: parseFloat(localStorage.getItem('ollamaVision_topP')) || 0.7,
                    frequencyPenalty: parseFloat(localStorage.getItem('ollamaVision_frequencyPenalty')) || 0.0,
                    presencePenalty: parseFloat(localStorage.getItem('ollamaVision_presencePenalty')) || 0.0,
                    repeatPenalty: parseFloat(localStorage.getItem('ollamaVision_repeatPenalty')) || 1.1,
                    topK: parseInt(localStorage.getItem('ollamaVision_topK')) || 40,
                    seed: parseInt(localStorage.getItem('ollamaVision_seed')) || -1,
                    minP: parseFloat(localStorage.getItem('ollamaVision_minP')) || 0.0,
                    topA: parseFloat(localStorage.getItem('ollamaVision_topA')) || 0.0,
                    apiKey: localStorage.getItem(`ollamaVision_${backendType}Key`),
                    apiBaseUrl: normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL),
                    siteName: localStorage.getItem('ollamaVision_openrouterSite'),
                    ollamaUrl: `http://${localStorage.getItem('ollamaVision_host') || 'localhost'}:${localStorage.getItem('ollamaVision_port') || '11434'}`
                }, 
                (data) => resolve(data),
                (error) => reject(error));
            });

            if (response.success) {
                if (!response.response || response.response.trim().toLowerCase() === "null") {
                    throw new Error("The LLM has censored you or rate limited you. Try again or edit your prompt and check your image.");
                }

                document.getElementById('zimage-enhance-output-prompt').value = response.response;
                this.updateStatus('success', 'Prompt enhanced successfully');
                await this.unloadModelIfEnabled(model);
            } else {
                // Enhanced error handling for OpenRouter
                if (backendType === 'openrouter') {
                    if (response.error?.toLowerCase().includes('rate') || 
                        response.error?.toLowerCase().includes('limit') ||
                        response.error?.toLowerCase().includes('quota')) {
                        throw new Error('OpenRouter rate limit reached. Please wait a few minutes and try again.');
                    } else if (response.error?.toLowerCase().includes('timeout')) {
                        throw new Error('Request timed out. This can happen with free tier usage. Please try again.');
                    } else if (!response.error && !response.response) {
                        throw new Error('No response from OpenRouter. This might be due to free tier limitations.');
                    }
                }
                throw new Error(response.error || 'Unknown error occurred');
            }
        } catch (error) {
            this.updateStatus('error', error.message || 'Failed to enhance prompt');
        }
    },

    copyZImageEnhancedPrompt: function() {
        const enhancedPrompt = document.getElementById('zimage-enhance-output-prompt').value;
        if (!enhancedPrompt.trim()) {
            this.updateStatus('error', 'No enhanced prompt to copy');
            return;
        }

        navigator.clipboard.writeText(enhancedPrompt).then(() => {
            this.updateStatus('success', 'Enhanced prompt copied to clipboard');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = enhancedPrompt;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.updateStatus('success', 'Enhanced prompt copied to clipboard');
        });
    },

    sendZImageEnhancedToPrompt: function() {
        const enhancedPrompt = document.getElementById('zimage-enhance-output-prompt').value;
        if (!enhancedPrompt.trim()) {
            this.updateStatus('error', 'No enhanced prompt to send');
            return;
        }

        // Use the same logic as the working sendToPrompt function
        document.getElementById('text2imagetabbutton').click();
        const generatePromptTextarea = document.getElementById("input_prompt");
        if (generatePromptTextarea) {
            generatePromptTextarea.value = enhancedPrompt;
            generatePromptTextarea.dispatchEvent(new Event('input'));
            this.closeEnhanceModals();
            this.updateStatus('success', 'Enhanced prompt sent to main prompt area');
        } else {
            this.updateStatus('error', 'Could not find main prompt area');
        }
    },

    enhanceAnimaPrompt: async function() {
        try {
            const inputPrompt = document.getElementById('anima-enhance-input-prompt').value.trim();
            if (!inputPrompt) {
                this.updateStatus('error', 'Please enter a description to enhance');
                return;
            }

            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const model = document.getElementById('ollamavision-model').value;

            const disconnectBtn = document.getElementById('disconnect-btn');
            if (disconnectBtn.style.display === 'none') {
                this.updateStatus('error', 'Backend not connected!');
                return;
            }

            if (!model) {
                this.updateStatus('error', 'Missing required parameters (model)');
                return;
            }

            this.updateStatus('info', 'Enhancing Anima prompt...', true);

            if (backendType === 'openrouter') {
                const apiKey = localStorage.getItem('ollamaVision_openrouterKey');
            }

            const systemPrompt = `You are an expert anime image generation prompt engineer. Your job is to take any character description, scene, or idea and transform it into a highly optimized tag-based prompt used by models like NovelAI, Stable Diffusion, or Danbooru-trained models.
Always follow this tag order:
[quality/meta tags], [character count], [character name], [series/franchise], [artist style], [general tags]
Rules:

Lead with quality/meta tags like: masterpiece, best quality, highres, ultra-detailed, 8k
Specify character count early: 1girl, 1boy, 2girls, etc.
Name the character and series clearly when known
Add artist tags only when a specific style is requested
General tags should cover in this order: hair → eyes → expression → outfit → accessories → pose → action → setting/background → lighting → mood/atmosphere
Use commas to separate all tags
Prefer short, specific tags over long phrases — break descriptions into individual tag components
Use Danbooru-style tag conventions (e.g. blue eyes, looking at viewer, standing, solo)
Output tags only — no explanations, no sentences, no negative prompts`;

            // Make the request to enhance the prompt
            const response = await new Promise((resolve, reject) => {
                genericRequest('EnhanceTextPromptAsync', {
                    model: model,
                    backendType: backendType,
                    systemPrompt: systemPrompt,
                    prompt: inputPrompt,
                    temperature: parseFloat(localStorage.getItem('ollamaVision_temperature')) || 0.8,
                    maxTokens: parseInt(localStorage.getItem('ollamaVision_maxTokens')) || -1,
                    topP: parseFloat(localStorage.getItem('ollamaVision_topP')) || 0.7,
                    frequencyPenalty: parseFloat(localStorage.getItem('ollamaVision_frequencyPenalty')) || 0.0,
                    presencePenalty: parseFloat(localStorage.getItem('ollamaVision_presencePenalty')) || 0.0,
                    repeatPenalty: parseFloat(localStorage.getItem('ollamaVision_repeatPenalty')) || 1.1,
                    topK: parseInt(localStorage.getItem('ollamaVision_topK')) || 40,
                    seed: parseInt(localStorage.getItem('ollamaVision_seed')) || -1,
                    minP: parseFloat(localStorage.getItem('ollamaVision_minP')) || 0.0,
                    topA: parseFloat(localStorage.getItem('ollamaVision_topA')) || 0.0,
                    apiKey: localStorage.getItem(`ollamaVision_${backendType}Key`),
                    apiBaseUrl: normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL),
                    siteName: localStorage.getItem('ollamaVision_openrouterSite'),
                    ollamaUrl: `http://${localStorage.getItem('ollamaVision_host') || 'localhost'}:${localStorage.getItem('ollamaVision_port') || '11434'}`
                }, 
                (data) => resolve(data),
                (error) => reject(error));
            });

            if (response.success) {
                if (!response.response || response.response.trim().toLowerCase() === "null") {
                    throw new Error("The LLM has censored you or rate limited you. Try again or edit your prompt and check your image.");
                }

                document.getElementById('anima-enhance-output-prompt').value = response.response;
                this.updateStatus('success', 'Anima prompt enhanced successfully');
                await this.unloadModelIfEnabled(model);
            } else {
                if (backendType === 'openrouter') {
                    if (response.error?.toLowerCase().includes('rate') || 
                        response.error?.toLowerCase().includes('limit') ||
                        response.error?.toLowerCase().includes('quota')) {
                        throw new Error('OpenRouter rate limit reached. Please wait a few minutes and try again.');
                    } else if (response.error?.toLowerCase().includes('timeout')) {
                        throw new Error('Request timed out. This can happen with free tier usage. Please try again.');
                    } else if (!response.error && !response.response) {
                        throw new Error('No response from OpenRouter. This might be due to free tier limitations.');
                    }
                }
                throw new Error(response.error || 'Unknown error occurred');
            }
        } catch (error) {
            this.updateStatus('error', error.message || 'Failed to enhance Anima prompt');
        }
    },

    copyAnimaEnhancedPrompt: function() {
        const enhancedPrompt = document.getElementById('anima-enhance-output-prompt').value;
        if (!enhancedPrompt.trim()) {
            this.updateStatus('error', 'No enhanced Anima prompt to copy');
            return;
        }

        navigator.clipboard.writeText(enhancedPrompt).then(() => {
            this.updateStatus('success', 'Enhanced Anima prompt copied to clipboard');
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = enhancedPrompt;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.updateStatus('success', 'Enhanced Anima prompt copied to clipboard');
        });
    },

    sendAnimaEnhancedToPrompt: function() {
        const enhancedPrompt = document.getElementById('anima-enhance-output-prompt').value;
        if (!enhancedPrompt.trim()) {
            this.updateStatus('error', 'No enhanced Anima prompt to send');
            return;
        }

        document.getElementById('text2imagetabbutton').click();
        const generatePromptTextarea = document.getElementById("input_prompt");
        if (generatePromptTextarea) {
            generatePromptTextarea.value = enhancedPrompt;
            generatePromptTextarea.dispatchEvent(new Event('input'));
            this.closeEnhanceModals();
            this.updateStatus('success', 'Enhanced Anima prompt sent to main prompt area');
        } else {
            this.updateStatus('error', 'Could not find main prompt area');
        }
    },

    enhanceLtxv2Prompt: async function() {
        try {
            const inputPrompt = document.getElementById('ltxv2-enhance-input-prompt').value.trim();
            if (!inputPrompt) {
                this.updateStatus('error', 'Please enter a prompt to enhance');
                return;
            }

            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const model = document.getElementById('ollamavision-model').value;

            const disconnectBtn = document.getElementById('disconnect-btn');
            if (disconnectBtn.style.display === 'none') {
                this.updateStatus('error', 'Backend not connected!');
                return;
            }

            if (!model) {
                this.updateStatus('error', 'Missing required parameters (model)');
                return;
            }

            this.updateStatus('info', 'Enhancing LTX 2.3 prompt...', true);

            if (backendType === 'openrouter') {
                const apiKey = localStorage.getItem('ollamaVision_openrouterKey');
            }

            const systemPrompt = `You are a Creative Assistant. Given a user's raw input prompt describing a scene or concept, expand it into a detailed video generation prompt with specific visuals and integrated audio to guide a text-to-video model.

#### Guidelines
- Strictly follow all aspects of the user's raw input: include every element requested (style, visuals, motions, actions, camera movement, audio).
    - If the input is vague, invent concrete details: lighting, textures, materials, scene settings, etc.
        - For characters: describe gender, clothing, hair, expressions. DO NOT invent unrequested characters.
- Use active language: present-progressive verbs ("is walking," "speaking"). If no action specified, describe natural movements.
- Maintain chronological flow: use temporal connectors ("as," "then," "while").
- Audio layer: Describe complete soundscape (background audio, ambient sounds, SFX, speech/music when requested). Integrate sounds chronologically alongside actions. Be specific (e.g., "soft footsteps on tile"), not vague (e.g., "ambient sound is present").
- Speech (only when requested):
    - For ANY speech-related input (talking, conversation, singing, etc.), ALWAYS include exact words in quotes with voice characteristics (e.g., "The man says in an excited voice: 'You won't believe what I just saw!'").
    - Specify language if not English and accent if relevant.
- Style: Include visual style at the beginning: "Style: <style>, <rest of prompt>." Default to cinematic-realistic if unspecified. Omit if unclear.
- Visual and audio only: NO non-visual/auditory senses (smell, taste, touch).
- Restrained language: Avoid dramatic/exaggerated terms. Use mild, natural phrasing.
    - Colors: Use plain terms ("red dress"), not intensified ("vibrant blue," "bright red").
    - Lighting: Use neutral descriptions ("soft overhead light"), not harsh ("blinding light").
    - Facial features: Use delicate modifiers for subtle features (i.e., "subtle freckles").

#### Important notes:
- Analyze the user's raw input carefully. In cases of FPV or POV, exclude the description of the subject whose POV is requested.
- Camera motion: DO NOT invent camera motion unless requested by the user.
- Speech: DO NOT modify user-provided character dialogue unless it's a typo.
- No timestamps or cuts: DO NOT use timestamps or describe scene cuts unless explicitly requested.
- Format: DO NOT use phrases like "The scene opens with...". Start directly with Style (optional) and chronological scene description.
- Format: DO NOT start your response with special characters.
- DO NOT invent dialogue unless the user mentions speech/talking/singing/conversation.
- If the user's raw input prompt is highly detailed, chronological and in the requested format: DO NOT make major edits or introduce new elements. Add/enhance audio descriptions if missing.

#### Output Format (Strict):
- Single continuous paragraph in natural language (English).
- NO titles, headings, prefaces, code fences, or Markdown.
- If unsafe/invalid, return original user prompt. Never ask questions or clarifications.

Your output quality is CRITICAL. Generate visually rich, dynamic prompts with integrated audio for high-quality video generation.

#### Example
Input: "A woman at a coffee shop talking on the phone"
Output:
Style: realistic with cinematic lighting. In a medium close-up, a woman in her early 30s with shoulder-length brown hair sits at a small wooden table by the window. She wears a cream-colored turtleneck sweater, holding a white ceramic coffee cup in one hand and a smartphone to her ear with the other. Ambient cafe sounds fill the space—espresso machine hiss, quiet conversations, gentle clinking of cups. The woman listens intently, nodding slightly, then takes a sip of her coffee and sets it down with a soft clink. Her face brightens into a warm smile as she speaks in a clear, friendly voice, 'That sounds perfect! I'd love to meet up this weekend. How about Saturday afternoon?' She laughs softly—a genuine chuckle—and shifts in her chair. Behind her, other patrons move subtly in and out of focus. 'Great, I'll see you then,' she concludes cheerfully, lowering the phone.`;

            const response = await new Promise((resolve, reject) => {
                genericRequest('EnhanceTextPromptAsync', {
                    model: model,
                    backendType: backendType,
                    systemPrompt: systemPrompt,
                    prompt: inputPrompt,
                    temperature: parseFloat(localStorage.getItem('ollamaVision_temperature')) || 0.8,
                    maxTokens: parseInt(localStorage.getItem('ollamaVision_maxTokens')) || -1,
                    topP: parseFloat(localStorage.getItem('ollamaVision_topP')) || 0.7,
                    frequencyPenalty: parseFloat(localStorage.getItem('ollamaVision_frequencyPenalty')) || 0.0,
                    presencePenalty: parseFloat(localStorage.getItem('ollamaVision_presencePenalty')) || 0.0,
                    repeatPenalty: parseFloat(localStorage.getItem('ollamaVision_repeatPenalty')) || 1.1,
                    topK: parseInt(localStorage.getItem('ollamaVision_topK')) || 40,
                    seed: parseInt(localStorage.getItem('ollamaVision_seed')) || -1,
                    minP: parseFloat(localStorage.getItem('ollamaVision_minP')) || 0.0,
                    topA: parseFloat(localStorage.getItem('ollamaVision_topA')) || 0.0,
                    apiKey: localStorage.getItem(`ollamaVision_${backendType}Key`),
                    apiBaseUrl: normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL),
                    siteName: localStorage.getItem('ollamaVision_openrouterSite'),
                    ollamaUrl: `http://${localStorage.getItem('ollamaVision_host') || 'localhost'}:${localStorage.getItem('ollamaVision_port') || '11434'}`
                }, 
                (data) => resolve(data),
                (error) => reject(error));
            });

            if (response.success) {
                if (!response.response || response.response.trim().toLowerCase() === "null") {
                    throw new Error("The LLM has censored you or rate limited you. Try again or edit your prompt and check your image.");
                }

                document.getElementById('ltxv2-enhance-output-prompt').value = response.response;
                this.updateStatus('success', 'LTX 2.3 prompt enhanced successfully');
                await this.unloadModelIfEnabled(model);
            } else {
                if (backendType === 'openrouter') {
                    if (response.error?.toLowerCase().includes('rate') || 
                        response.error?.toLowerCase().includes('limit') ||
                        response.error?.toLowerCase().includes('quota')) {
                        throw new Error('OpenRouter rate limit reached. Please wait a few minutes and try again.');
                    } else if (response.error?.toLowerCase().includes('timeout')) {
                        throw new Error('Request timed out. This can happen with free tier usage. Please try again.');
                    } else if (!response.error && !response.response) {
                        throw new Error('No response from OpenRouter. This might be due to free tier limitations.');
                    }
                }
                throw new Error(response.error || 'Unknown error occurred');
            }
        } catch (error) {
            this.updateStatus('error', error.message || 'Failed to enhance LTX 2.3 prompt');
        }
    },

    enhanceMicrosoftLensPrompt: async function() {
        try {
            const inputPrompt = document.getElementById('microsoft-lens-enhance-input-prompt').value.trim();
            if (!inputPrompt) {
                this.updateStatus('error', 'Please enter a prompt to enhance');
                return;
            }

            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const model = document.getElementById('ollamavision-model').value;

            const disconnectBtn = document.getElementById('disconnect-btn');
            if (disconnectBtn.style.display === 'none') {
                this.updateStatus('error', 'Backend not connected!');
                return;
            }

            if (!model) {
                this.updateStatus('error', 'Missing required parameters (model)');
                return;
            }

            this.updateStatus('info', 'Enhancing Microsoft Lens prompt...', true);

            if (backendType === 'openrouter') {
                const apiKey = localStorage.getItem('ollamaVision_openrouterKey');
            }

            const systemPrompt = `You are a prompt rewriter for a text-to-image model.
Your task is to convert the user's input into a single, precise, descriptive image prompt suitable for a text-to-image model.
Follow these rules strictly:

1. The output must be a clear and accurate description of a single image scene, written in the style of a text-to-image prompt.
  - Do not include explanations, reasoning, commentary, or meta text.
  - Do not ask questions.
  - Do not output multiple options.
  - Do not use uncertain, speculative, or alternative wording such as "maybe", "possibly", "perhaps", "or", "might", or "could".

2. Preserve the user's intended scene faithfully.
  - Do not change the objects, entities, attributes, actions, relationships, or core setting explicitly described by the user.
  - You may add reasonable visual details only when they help make the image concrete and coherent.
  - Any added details must be consistent with the user's description and must not introduce new important objects or alter the meaning.

3. If the image contains many main subjects of the same kind, describe each subject in detail, including humans, animals, objects, and any other prominent elements.
  - For each subject, include its appearance, color, size, shape, material, pose, expression, and position if applicable in the scene.
  - Make sure every main subject is clearly distinguishable from the others, such as in a scene with "4 dogs," describing each dog separately.

4. The output must fully cover the scene implied by the user's input.
  - Include the main subjects, relevant attributes, actions, spatial relationships, environment, and visible details necessary to render the scene.
  - If the user input is already sufficiently detailed and already suitable for image generation, keep it unchanged or only make minimal edits for fluency and clarity.

5. Resolve content that requires simple inference into explicit visual results when the result is unambiguous and visually representable.
  - Example: if the user says "the answer to 2+2 is written on the blackboard", output should explicitly describe "the blackboard shows 2+2=4".
  - Use only direct, necessary inference that is clearly implied by the user input.
  - Do not invent hidden facts, backstory, or ambiguous details.

6. Language rule:
  - If the user input is not in English, output in the same language.
  - Otherwise, output in English.

7. Output format:
  - Output exactly one final rewritten prompt.
  - Do not use bullet points, numbering, JSON, XML, Markdown, or quotation marks unless they are part of the scene itself.

Your goal is to produce a prompt that is concrete, visual, faithful to the user intent, and directly usable as input to a text-to-image model.`;

            const response = await new Promise((resolve, reject) => {
                genericRequest('EnhanceTextPromptAsync', {
                    model: model,
                    backendType: backendType,
                    systemPrompt: systemPrompt,
                    prompt: inputPrompt,
                    temperature: parseFloat(localStorage.getItem('ollamaVision_temperature')) || 0.8,
                    maxTokens: parseInt(localStorage.getItem('ollamaVision_maxTokens')) || -1,
                    topP: parseFloat(localStorage.getItem('ollamaVision_topP')) || 0.7,
                    frequencyPenalty: parseFloat(localStorage.getItem('ollamaVision_frequencyPenalty')) || 0.0,
                    presencePenalty: parseFloat(localStorage.getItem('ollamaVision_presencePenalty')) || 0.0,
                    repeatPenalty: parseFloat(localStorage.getItem('ollamaVision_repeatPenalty')) || 1.1,
                    topK: parseInt(localStorage.getItem('ollamaVision_topK')) || 40,
                    seed: parseInt(localStorage.getItem('ollamaVision_seed')) || -1,
                    minP: parseFloat(localStorage.getItem('ollamaVision_minP')) || 0.0,
                    topA: parseFloat(localStorage.getItem('ollamaVision_topA')) || 0.0,
                    apiKey: localStorage.getItem(`ollamaVision_${backendType}Key`),
                    apiBaseUrl: normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL),
                    siteName: localStorage.getItem('ollamaVision_openrouterSite'),
                    ollamaUrl: `http://${localStorage.getItem('ollamaVision_host') || 'localhost'}:${localStorage.getItem('ollamaVision_port') || '11434'}`
                },
                (data) => resolve(data),
                (error) => reject(error));
            });

            if (response.success) {
                if (!response.response || response.response.trim().toLowerCase() === "null") {
                    throw new Error("The LLM has censored you or rate limited you. Try again or edit your prompt and check your image.");
                }

                document.getElementById('microsoft-lens-enhance-output-prompt').value = response.response;
                this.updateStatus('success', 'Microsoft Lens prompt enhanced successfully');
                await this.unloadModelIfEnabled(model);
            } else {
                if (backendType === 'openrouter') {
                    if (response.error?.toLowerCase().includes('rate') ||
                        response.error?.toLowerCase().includes('limit') ||
                        response.error?.toLowerCase().includes('quota')) {
                        throw new Error('OpenRouter rate limit reached. Please wait a few minutes and try again.');
                    } else if (response.error?.toLowerCase().includes('timeout')) {
                        throw new Error('Request timed out. This can happen with free tier usage. Please try again.');
                    } else if (!response.error && !response.response) {
                        throw new Error('No response from OpenRouter. This might be due to free tier limitations.');
                    }
                }
                throw new Error(response.error || 'Unknown error occurred');
            }
        } catch (error) {
            this.updateStatus('error', error.message || 'Failed to enhance Microsoft Lens prompt');
        }
    },

    copyMicrosoftLensEnhancedPrompt: function() {
        const enhancedPrompt = document.getElementById('microsoft-lens-enhance-output-prompt').value;
        if (!enhancedPrompt.trim()) {
            this.updateStatus('error', 'No enhanced Microsoft Lens prompt to copy');
            return;
        }

        navigator.clipboard.writeText(enhancedPrompt).then(() => {
            this.updateStatus('success', 'Enhanced Microsoft Lens prompt copied to clipboard');
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = enhancedPrompt;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.updateStatus('success', 'Enhanced Microsoft Lens prompt copied to clipboard');
        });
    },

    sendMicrosoftLensEnhancedToPrompt: function() {
        const enhancedPrompt = document.getElementById('microsoft-lens-enhance-output-prompt').value;
        if (!enhancedPrompt.trim()) {
            this.updateStatus('error', 'No enhanced Microsoft Lens prompt to send');
            return;
        }

        document.getElementById('text2imagetabbutton').click();
        const generatePromptTextarea = document.getElementById("input_prompt");
        if (generatePromptTextarea) {
            generatePromptTextarea.value = enhancedPrompt;
            generatePromptTextarea.dispatchEvent(new Event('input'));
            this.closeEnhanceModals();
            this.updateStatus('success', 'Enhanced Microsoft Lens prompt sent to main prompt area');
        } else {
            this.updateStatus('error', 'Could not find main prompt area');
        }
    },

    copyLtxv2EnhancedPrompt: function() {
        const enhancedPrompt = document.getElementById('ltxv2-enhance-output-prompt').value;
        if (!enhancedPrompt.trim()) {
            this.updateStatus('error', 'No enhanced LTX 2.3 prompt to copy');
            return;
        }

        navigator.clipboard.writeText(enhancedPrompt).then(() => {
            this.updateStatus('success', 'Enhanced LTX 2.3 prompt copied to clipboard');
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = enhancedPrompt;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.updateStatus('success', 'Enhanced LTX 2.3 prompt copied to clipboard');
        });
    },

    sendLtxv2EnhancedToPrompt: function() {
        const enhancedPrompt = document.getElementById('ltxv2-enhance-output-prompt').value;
        if (!enhancedPrompt.trim()) {
            this.updateStatus('error', 'No enhanced LTX 2.3 prompt to send');
            return;
        }

        document.getElementById('text2imagetabbutton').click();
        const generatePromptTextarea = document.getElementById("input_prompt");
        if (generatePromptTextarea) {
            generatePromptTextarea.value = enhancedPrompt;
            generatePromptTextarea.dispatchEvent(new Event('input'));
            this.closeEnhanceModals();
            this.updateStatus('success', 'Enhanced LTX 2.3 prompt sent to main prompt area');
        } else {
            this.updateStatus('error', 'Could not find main prompt area');
        }
    },

    generateStory: async function() {
        try {
            // Check backend connection first
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const model = document.getElementById('ollamavision-model').value;
            
            // Check if we're connected to a backend (fix the logic)
            const disconnectBtn = document.getElementById('disconnect-btn');
            if (disconnectBtn.style.display === 'none') {
                this.updateStatus('error', 'Backend not connected!');
                return;
            }

            // Check if a model is selected
            if (!model) {
                this.updateStatus('error', 'Missing required parameters (model)');
                return;
            }

            const preview = document.getElementById('story-preview');
            const imageData = preview.dataset.imageData;
            if (!imageData) {
                this.updateStatus('error', 'No image loaded');
                return;
            }

            this.updateStatus('info', 'Generating story...', true);
            
            // Add check for OpenRouter free tier issues
            if (backendType === 'openrouter') {
                const apiKey = localStorage.getItem('ollamaVision_openrouterKey');
            }

            // Get the story prompt from backend
            const promptResponse = await new Promise((resolve, reject) => {
                genericRequest('GetStoryPrompt', {}, 
                    (data) => resolve(data),
                    (error) => reject(error));
            });

            if (!promptResponse.success) {
                throw new Error('Failed to get story prompt');
            }

            // Make the actual request
            const response = await new Promise((resolve, reject) => {
                genericRequest('AnalyzeImageAsync', {
                    model: model,
                    backendType: backendType,
                    imageData: imageData,
                    prompt: promptResponse.prompt,
                    temperature: parseFloat(localStorage.getItem('ollamaVision_temperature')) || 0.8,
                    maxTokens: parseInt(localStorage.getItem('ollamaVision_maxTokens')) || -1,
                    topP: parseFloat(localStorage.getItem('ollamaVision_topP')) || 0.7,
                    frequencyPenalty: parseFloat(localStorage.getItem('ollamaVision_frequencyPenalty')) || 0.0,
                    presencePenalty: parseFloat(localStorage.getItem('ollamaVision_presencePenalty')) || 0.0,
                    repeatPenalty: parseFloat(localStorage.getItem('ollamaVision_repeatPenalty')) || 1.1,
                    topK: parseInt(localStorage.getItem('ollamaVision_topK')) || 40,
                    seed: parseInt(localStorage.getItem('ollamaVision_seed')) || -1,
                    minP: parseFloat(localStorage.getItem('ollamaVision_minP')) || 0.0,
                    topA: parseFloat(localStorage.getItem('ollamaVision_topA')) || 0.0,
                    apiKey: localStorage.getItem(`ollamaVision_${backendType}Key`),
                    siteName: localStorage.getItem('ollamaVision_openrouterSite'),
                    ollamaUrl: `http://${localStorage.getItem('ollamaVision_host') || 'localhost'}:${localStorage.getItem('ollamaVision_port') || '11434'}`
                }, 
                (data) => resolve(data),
                (error) => reject(error));
            });

            if (response.success) {
                if (!response.response || response.response.trim().toLowerCase() === "null") {
                    throw new Error("The LLM has censored you or rate limited you. Try again or edit your prompt and check your image.");
                }

                document.getElementById('story-text').value = response.response;
                this.updateStatus('success', 'Story generated successfully');
                await this.unloadModelIfEnabled(model);
            } else {
                // Enhanced error handling for OpenRouter
                if (backendType === 'openrouter') {
                    if (response.error?.toLowerCase().includes('rate') || 
                        response.error?.toLowerCase().includes('limit') ||
                        response.error?.toLowerCase().includes('quota')) {
                        throw new Error('OpenRouter rate limit reached. Please wait a few minutes and try again.');
                    } else if (response.error?.toLowerCase().includes('timeout')) {
                        throw new Error('Request timed out. This can happen with free tier usage. Please try again.');
                    } else if (!response.error && !response.response) {
                        throw new Error('No response from OpenRouter. This might be due to free tier limitations.');
                    }
                }
                throw new Error(response.error || 'Unknown error occurred');
            }
        } catch (error) {
            this.updateStatus('error', error.message);
        }
    },

    // Add this helper function at the top level of ollamaVision object
    unloadModelIfEnabled: async function(model) {
        const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
        const autoUnload = localStorage.getItem('ollamaVision_autoUnload') === 'true';
        const autoUnloadLMStudio = localStorage.getItem('ollamaVision_autoUnloadLMStudio') === 'true';
        
        if (autoUnload) {
            try {
                if (backendType === 'ollama') {
                    let host = localStorage.getItem('ollamaVision_host') || 'localhost';
                    const port = localStorage.getItem('ollamaVision_port') || '11434';
                    
                    // Add protocol if not present
                    if (!host.startsWith('http://') && !host.startsWith('https://')) {
                        host = `http://${host}`;
                    }
                    
                    // Remove any trailing slashes
                    host = host.replace(/\/+$/, '');
                    
                    const ollamaUrl = `${host}:${port}`;
                    
                    await new Promise((resolve, reject) => {
                        genericRequest('UnloadModelAsync', 
                            { 
                                model: model,
                                ollamaUrl: ollamaUrl,
                                keep_alive: 0
                            },
                            (data) => resolve(data),
                            (error) => reject(error)
                        );
                    });
                } else if (backendType === 'textgen') {
                    let textgenUrl = localStorage.getItem('ollamaVision_textgenUrl') || 'http://localhost:5000';
                    
                    // Add protocol if not present
                    if (!textgenUrl.startsWith('http://') && !textgenUrl.startsWith('https://')) {
                        textgenUrl = `http://${textgenUrl}`;
                    }
                    
                    // Remove any trailing slashes
                    textgenUrl = textgenUrl.replace(/\/+$/, '');
                    
                    await new Promise((resolve, reject) => {
                        genericRequest('LoadTextGenModelAsync', 
                            { 
                                textgenUrl: textgenUrl,
                                model: model
                            },
                            (data) => resolve(data),
                            (error) => reject(error)
                        );
                    });
                }
            } catch (error) {
                this.updateStatus('error', 'Failed to unload model: ' + error.message);
            }
        }

        if (backendType === 'openai' && autoUnloadLMStudio) {
            try {
                const baseUrl = normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL);
                const apiKey = localStorage.getItem('ollamaVision_openaiKey') || '';

                await new Promise((resolve, reject) => {
                    genericRequest('UnloadLMStudioModelAsync', 
                        { 
                            baseUrl: baseUrl,
                            instanceId: model,
                            apiKey: apiKey
                        },
                        (data) => resolve(data),
                        (error) => reject(error)
                    );
                });
            } catch (error) {
                this.updateStatus('error', 'Failed to unload LM Studio model: ' + error.message);
            }
        }
    },

    showImageFusion: function() {
        if (!document.getElementById('fusionModal')) {
            const fusionModalHtml = `
                <div class="modal fade" id="fusionModal" tabindex="-1">
                    <div class="modal-dialog modal-xl" style="max-width: min(95vw, 1400px);">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Image Fusion</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <!-- Style Analysis -->
                                    <div class="col-md-4">
                                        <div class="card" style="min-width: 400px;">
                                            <div class="card-header">
                                                <h6 class="mb-0">Style Analysis</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="preview-container" style="width: 100%; height: 250px; position: relative;">
                                                    <img id="style-preview" class="img-fluid" style="width: 100%; height: 100%; object-fit: contain; display: none;">
                                                </div>
                                                <div class="d-flex justify-content-center gap-2 mt-2">
                                                    <button class="basic-button" onclick="ollamaVision.uploadFusionImage('style')">
                                                        <i class="fas fa-upload"></i> Upload
                                                    </button>
                                                    <button class="basic-button" onclick="ollamaVision.pasteFusionImage('style')">
                                                        <i class="fas fa-paste"></i> Paste
                                                    </button>
                                                </div>
                                                <div class="mt-2">
                                                    <button class="basic-button w-100" onclick="ollamaVision.analyzeFusionImage('style')" id="analyze-style-btn" disabled>
                                                        Analyze Style
                                                    </button>
                                                </div>
                                                <textarea class="auto-text-block modal_text_extra mt-2" id="style-analysis" rows="4"></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Subject Analysis -->
                                    <div class="col-md-4">
                                        <div class="card" style="min-width: 400px;">
                                            <div class="card-header">
                                                <h6 class="mb-0">Subject Analysis</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="preview-container" style="width: 100%; height: 250px; position: relative;">
                                                    <img id="subject-preview" class="img-fluid" style="width: 100%; height: 100%; object-fit: contain; display: none;">
                                                </div>
                                                <div class="d-flex justify-content-center gap-2 mt-2">
                                                    <button class="basic-button" onclick="ollamaVision.uploadFusionImage('subject')">
                                                        <i class="fas fa-upload"></i> Upload
                                                    </button>
                                                    <button class="basic-button" onclick="ollamaVision.pasteFusionImage('subject')">
                                                        <i class="fas fa-paste"></i> Paste
                                                    </button>
                                                </div>
                                                <div class="mt-2">
                                                    <button class="basic-button w-100" onclick="ollamaVision.analyzeFusionImage('subject')" id="analyze-subject-btn" disabled>
                                                        Analyze Subject
                                                    </button>
                                                </div>
                                                <textarea class="auto-text-block modal_text_extra mt-2" id="subject-analysis" rows="4"></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Setting Analysis -->
                                    <div class="col-md-4">
                                        <div class="card" style="min-width: 400px;">
                                            <div class="card-header">
                                                <h6 class="mb-0">Setting Analysis</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="preview-container" style="width: 100%; height: 250px; position: relative;">
                                                    <img id="setting-preview" class="img-fluid" style="width: 100%; height: 100%; object-fit: contain; display: none;">
                                                </div>
                                                <div class="d-flex justify-content-center gap-2 mt-2">
                                                    <button class="basic-button" onclick="ollamaVision.uploadFusionImage('setting')">
                                                        <i class="fas fa-upload"></i> Upload
                                                    </button>
                                                    <button class="basic-button" onclick="ollamaVision.pasteFusionImage('setting')">
                                                        <i class="fas fa-paste"></i> Paste
                                                    </button>
                                                </div>
                                                <div class="mt-2">
                                                    <button class="basic-button w-100" onclick="ollamaVision.analyzeFusionImage('setting')" id="analyze-setting-btn" disabled>
                                                        Analyze Setting
                                                    </button>
                                                </div>
                                                <textarea class="auto-text-block modal_text_extra mt-2" id="setting-analysis" rows="4"></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-12">
                                        <button class="basic-button w-100" onclick="ollamaVision.combineFusionAnalyses()" id="combine-analyses-btn" disabled>
                                            Combine Analyses
                                        </button>
                                        <textarea class="auto-text-block modal_text_extra mt-2" id="combined-analysis" rows="6"></textarea>
                                    </div>
                                </div>
                            </div>
                            <!-- Add status bar -->
                            <div id="fusion-status" class="alert alert-info mt-3 text-center mx-3 mb-3" style="display: none;">
                                <div class="d-flex align-items-center justify-content-center">
                                    <div class="spinner-border spinner-border-sm me-2" role="status" id="fusion-spinner" style="display: none;">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <span id="fusion-status-text" style="font-size: 1.2rem;"></span>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="basic-button" onclick="ollamaVision.sendFusionToPrompt()" id="send-fusion-btn" disabled>
                                    Send to Prompt
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', fusionModalHtml);
        }

        new bootstrap.Modal(document.getElementById('fusionModal')).show();
    },

    showStoryTime: function() {
        if (!document.getElementById('storyTimeModal')) {
            const storyTimeModalHtml = `
                <div class="modal fade" id="storyTimeModal" tabindex="-1">
                    <div class="modal-dialog modal-xl" style="max-width: min(95vw, 1400px); min-width: 1400px;">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Story Time</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <!-- Existing content -->
                            </div>
                            <!-- Add status bar -->
                            <div id="story-status" class="alert alert-info mt-3 text-center mx-3 mb-3" style="display: none;">
                                <div class="d-flex align-items-center justify-content-center">
                                    <div class="spinner-border spinner-border-sm me-2" role="status" id="story-spinner" style="display: none;">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <span id="story-status-text" style="font-size: 1.2rem;"></span>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', storyTimeModalHtml);
        }
    },

    // Add the Character Creator modal and functions
    showCharacterCreatorModal: function() {
        if (!document.getElementById('characterCreatorModal')) {
            const characterCreatorModalHtml = `
                <div class="modal fade" id="characterCreatorModal" tabindex="-1">
                    <style>
                        #characterCreatorModal .character-field-group {
                            display: flex;
                            flex-wrap: wrap;
                            align-items: center;
                            gap: 0.5rem;
                            margin-bottom: 0.75rem;
                        }
                        #characterCreatorModal .character-field-group > label {
                            flex: 0 0 100%;
                            margin-bottom: 0;
                        }
                        #characterCreatorModal .character-field-group > .form-control {
                            flex: 1 1 auto;
                            min-width: 0;
                            min-height: 2.75rem;
                            font-size: 1.1rem;
                        }
                        #characterCreatorModal .character-field-group > .lock-btn {
                            flex: 0 0 50px;
                            height: 2.75rem;
                        }
                    </style>
                    <div class="modal-dialog modal-xl" style="max-width: min(95vw, 1600px); min-width: 1400px;">
                        <div class="modal-content modal_text_extra">
                            <div class="modal-header">
                                <h5 class="modal-title">Character Creator</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <!-- Left side: Character Output -->
                                    <div class="col-md-9">
                                        <div class="d-flex justify-content-end mb-2">
                                            <button class="basic-button" onclick="ollamaVision.saveCharacter()" 
                                                    style="font-size: 1.2rem;">
                                                💾 Save Character (Text Only)
                                            </button>
                                            <button class="basic-button" onclick="ollamaVision.showSaveCharacterImageModal()" 
                                                    style="font-size: 1.2rem;">
                                                🖼️ Create Image Card
                                            </button>
                                        </div>
                                        <div class="card modal_text_extra">
                                            <div class="card-body">
                                                <pre id="character-output" contenteditable="true" style="white-space: pre-wrap; font-size: 1.2rem; min-height: 600px;">
Customize your settings and click generate to create a character!
                                                </pre>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Right side: User Inputs -->
                                    <div class="col-md-3">
                                        <div class="d-flex flex-column gap-3">
                                            <!-- Clear button -->
                                            <div class="d-flex justify-content-end">
                                                <button class="basic-button" onclick="ollamaVision.clearAllInputs()" 
                                                        style="font-size: 1.2rem;">
                                                    🗑️ Clear All
                                                </button>
                                            </div>
                                            
                                            <!-- Name Input -->
                                            <div class="character-field-group">
                                                <label for="character-name" class="form-label mb-1">Name</label>
                                                <input type="text" class="form-control auto-text modal_text_extra" 
                                                       id="character-name" placeholder="Name (optional)">
                                                <button class="basic-button lock-btn" data-locked="false">
                                                    🎲
                                                </button>
                                            </div>

                                            <!-- Sex Dropdown -->
                                            <div class="character-field-group">
                                                <label for="character-sex" class="form-label mb-1">Sex</label>
                                                <input type="text" list="sex-options" class="form-control auto-text modal_text_extra" id="character-sex">
                                                <datalist id="sex-options">
                                                    <option value="Random"></option>
                                                    <option value="Male"></option>
                                                    <option value="Female"></option>
                                                </datalist>
                                                <button class="basic-button lock-btn" data-locked="false">
                                                    🎲
                                                </button>
                                            </div>

                                            <!-- Species Dropdown -->
                                            <div class="character-field-group">
                                                <label for="character-species" class="form-label mb-1">Species</label>
                                                <input type="text" list="species-options" class="form-control auto-text modal_text_extra" id="character-species">
                                                <datalist id="species-options">
                                                    <option value="Random"></option>
                                                    <option value="Alien"></option>
                                                    <option value="Android"></option>
                                                    <option value="Angel"></option>
                                                    <option value="Arachne"></option>
                                                    <option value="Automaton"></option>
                                                    <option value="Beastkin"></option>
                                                    <option value="Celestial"></option>
                                                    <option value="Chimera"></option>
                                                    <option value="Cyborg"></option>
                                                    <option value="Dark Elf"></option>
                                                    <option value="Demon"></option>
                                                    <option value="Djinn"></option>
                                                    <option value="Dragonborn"></option>
                                                    <option value="Dryad"></option>
                                                    <option value="Dwarf"></option>
                                                    <option value="Elf"></option>
                                                    <option value="Fairy"></option>
                                                    <option value="Feralfolk"></option>
                                                    <option value="Fungoid"></option>
                                                    <option value="Gargoyle"></option>
                                                    <option value="Genasi"></option>
                                                    <option value="Ghost"></option>
                                                    <option value="Ghoul"></option>
                                                    <option value="Goblin"></option>
                                                    <option value="Golem"></option>
                                                    <option value="Gorgon"></option>
                                                    <option value="Harpy"></option>
                                                    <option value="High Elf"></option>
                                                    <option value="Human"></option>
                                                    <option value="Krakenborn"></option>
                                                    <option value="Lizardfolk"></option>
                                                    <option value="Merfolk"></option>
                                                    <option value="Minotaur"></option>
                                                    <option value="Naga"></option>
                                                    <option value="Nephilim"></option>
                                                    <option value="Oni"></option>
                                                    <option value="Orc"></option>
                                                    <option value="Phoenixborn"></option>
                                                    <option value="Plantfolk"></option>
                                                    <option value="Shadowkin"></option>
                                                    <option value="Slimefolk"></option>
                                                    <option value="Tiefling"></option>
                                                    <option value="Troll"></option>
                                                    <option value="Undead"></option>
                                                    <option value="Vampire"></option>
                                                    <option value="Werewolf"></option>
                                                    <option value="Yokai"></option>
                                                </datalist>
                                                <button class="basic-button lock-btn" data-locked="false">
                                                    🎲
                                                </button>
                                            </div>

                                            <!-- Setting Dropdown -->
                                            <div class="character-field-group">
                                                <label for="character-setting" class="form-label mb-1">Setting</label>
                                                <input type="text" list="setting-options" class="form-control auto-text modal_text_extra" id="character-setting">
                                                <datalist id="setting-options">
                                                    <option value="Random"></option>
                                                    <option value="Ancient Egypt"></option>
                                                    <option value="Biopunk"></option>
                                                    <option value="Clockwork Empire"></option>
                                                    <option value="Cyberpunk"></option>
                                                    <option value="Cyberpunk Fantasy (Shadowrun)"></option>
                                                    <option value="Dark Cosmic Fantasy"></option>
                                                    <option value="Desert Wasteland"></option>
                                                    <option value="Digital/Cyberspace"></option>
                                                    <option value="Dimensional Rift"></option>
                                                    <option value="Dreamworld"></option>
                                                    <option value="Dying Earth"></option>
                                                    <option value="Dystopian"></option>
                                                    <option value="Eldritch Noir"></option>
                                                    <option value="Fantasy"></option>
                                                    <option value="Feudal Japan"></option>
                                                    <option value="Floating Islands"></option>
                                                    <option value="Haunted Realm"></option>
                                                    <option value="High Seas Adventure"></option>
                                                    <option value="Lovecraftian Horror"></option>
                                                    <option value="Magitech Society"></option>
                                                    <option value="Medieval"></option>
                                                    <option value="Megacity"></option>
                                                    <option value="Modern"></option>
                                                    <option value="Mythological"></option>
                                                    <option value="Necropolis"></option>
                                                    <option value="Noir Detective World"></option>
                                                    <option value="Pirate World"></option>
                                                    <option value="Post-Apocalyptic"></option>
                                                    <option value="Prehistoric Fantasy"></option>
                                                    <option value="Renaissance Kingdom"></option>
                                                    <option value="Samurai Era"></option>
                                                    <option value="Sci-Fi"></option>
                                                    <option value="Simulation"></option>
                                                    <option value="Space Opera"></option>
                                                    <option value="Steampunk"></option>
                                                    <option value="Superhero World"></option>
                                                    <option value="Surreal Dreamscape"></option>
                                                    <option value="Underwater Civilization"></option>
                                                    <option value="Underworld"></option>
                                                    <option value="Urban Fantasy"></option>
                                                    <option value="VR World"></option>
                                                    <option value="Volcanic Hellscape"></option>
                                                    <option value="Western"></option>
                                                </datalist>
                                                <button class="basic-button lock-btn" data-locked="false">
                                                    🎲
                                                </button>
                                            </div>

                                            <!-- Alignment Dropdown -->
                                            <div class="character-field-group">
                                                <label for="character-alignment" class="form-label mb-1">Alignment</label>
                                                <input type="text" list="alignment-options" class="form-control auto-text modal_text_extra" id="character-alignment">
                                                <datalist id="alignment-options">
                                                    <option value="Random"></option>
                                                    <option value="Lawful Good"></option>
                                                    <option value="Neutral Good"></option>
                                                    <option value="Chaotic Good"></option>
                                                    <option value="Lawful Neutral"></option>
                                                    <option value="True Neutral"></option>
                                                    <option value="Chaotic Neutral"></option>
                                                    <option value="Lawful Evil"></option>
                                                    <option value="Neutral Evil"></option>
                                                    <option value="Chaotic Evil"></option>
                                                </datalist>
                                                <button class="basic-button lock-btn" data-locked="false">
                                                    🎲
                                                </button>
                                            </div>

                                            <!-- Class/Role Dropdown -->
                                            <div class="character-field-group">
                                                <label for="character-class" class="form-label mb-1">Class/Role</label>
                                                <input type="text" list="class-options" class="form-control auto-text modal_text_extra" id="character-class">
                                                <datalist id="class-options">
                                                    <option value="Random"></option>
                                                    <option value="Alchemist"></option>
                                                    <option value="Air Mage"></option>
                                                    <option value="Arcane Gunslinger"></option>
                                                    <option value="Archer"></option>
                                                    <option value="Assassin"></option>
                                                    <option value="Barbarian"></option>
                                                    <option value="Bard"></option>
                                                    <option value="Beast Rider"></option>
                                                    <option value="Beastmaster"></option>
                                                    <option value="Bishop"></option>
                                                    <option value="Blood Mage"></option>
                                                    <option value="Brewmaster"></option>
                                                    <option value="Chronomancer"></option>
                                                    <option value="Cleric"></option>
                                                    <option value="Corsair"></option>
                                                    <option value="Cultist"></option>
                                                    <option value="Decker"></option>
                                                    <option value="Demon Hunter"></option>
                                                    <option value="Diplomat"></option>
                                                    <option value="Druid"></option>
                                                    <option value="Earth Mage"></option>
                                                    <option value="Elementalist"></option>
                                                    <option value="Engineer"></option>
                                                    <option value="Exorcist"></option>
                                                    <option value="Fence"></option>
                                                    <option value="Fire Mage"></option>
                                                    <option value="Gladiator"></option>
                                                    <option value="Gunslinger"></option>
                                                    <option value="Hacker"></option>
                                                    <option value="Healer"></option>
                                                    <option value="Hunter"></option>
                                                    <option value="Illusionist"></option>
                                                    <option value="Inquisitor"></option>
                                                    <option value="Knight"></option>
                                                    <option value="Lightning Mage"></option>
                                                    <option value="Mage"></option>
                                                    <option value="Magician"></option>
                                                    <option value="Martial Artist"></option>
                                                    <option value="Necromancer"></option>
                                                    <option value="Paladin"></option>
                                                    <option value="Performer"></option>
                                                    <option value="Priest"></option>
                                                    <option value="Psionicist"></option>
                                                    <option value="Ranger"></option>
                                                    <option value="Rigger"></option>
                                                    <option value="Rogue"></option>
                                                    <option value="Runesmith"></option>
                                                    <option value="Seer"></option>
                                                    <option value="Shaman"></option>
                                                    <option value="Shapeshifter"></option>
                                                    <option value="Sorcerer"></option>
                                                    <option value="Spy"></option>
                                                    <option value="Street Samurai"></option>
                                                    <option value="Summoner"></option>
                                                    <option value="Tactician"></option>
                                                    <option value="Technomancer"></option>
                                                    <option value="Thief"></option>
                                                    <option value="Wastelander"></option>
                                                    <option value="Warlock"></option>
                                                    <option value="Warrior"></option>
                                                    <option value="Witch"></option>
                                                    <option value="Witch Hunter"></option>
                                                    <option value="Wizard"></option>
                                                </datalist>
                                                <button class="basic-button lock-btn" data-locked="false">
                                                    🎲
                                                </button>
                                            </div>

                                            <!-- Action Buttons -->
                                            <div class="d-flex justify-content-between gap-2">
                                                <button class="basic-button" onclick="ollamaVision.randomizeAll()" 
                                                        style="font-size: 1.2rem;">
                                                    🎲 Random All
                                                </button>
                                                <button class="basic-button" onclick="ollamaVision.generateCharacter()" 
                                                        style="font-size: 1.2rem;">
                                                    ✨ Generate Character
                                                </button>
                                                <button class="basic-button" onclick="ollamaVision.extractImagePrompt()"
                                                        style="font-size: 1.2rem; float: right;">
                                                    🎨 Extract Prompt
                                                </button>
                                            </div>
                                            
                                            <!-- Add status bar -->
                                            <div id="character-status" class="alert alert-info" style="display: none;">
                                                <div class="d-flex align-items-center justify-content-center">
                                                    <div class="spinner-border spinner-border-sm me-2" role="status">
                                                        <span class="visually-hidden">Loading...</span>
                                                    </div>
                                                    <span id="character-status-text">Generating character...</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', characterCreatorModalHtml);

            // Add lock button functionality
            document.querySelectorAll('.lock-btn').forEach(btn => {
                btn.style.width = '50px';
                btn.style.height = '38px';
                btn.style.fontSize = '1.2rem';
                
                // Initialize the lock state to false (unlocked)
                btn.dataset.locked = 'false';
                btn.innerHTML = '🎲';
                
                btn.addEventListener('click', function() {
                    let input = this.parentElement.querySelector('input');
                    let isLocked = this.dataset.locked === 'true';
                    
                    // Toggle lock state
                    this.dataset.locked = isLocked ? 'false' : 'true';
                    // Store or clear the locked value
                    input.dataset.lockedValue = isLocked ? '' : input.value;
                    // Update button icon
                    this.innerHTML = isLocked ? '🎲' : '🔒';
                });
            });
        }

        new bootstrap.Modal(document.getElementById('characterCreatorModal')).show();
    },

    // Add these helper functions for the Character Creator
    randomizeAll: function() {
        const inputs = ['name', 'sex', 'species', 'setting', 'alignment', 'class'];
        
        // Create a shuffling function using Fisher-Yates algorithm
        const shuffle = array => {
            for (let i = array.length - 1; i > 0; i--) {
                // Generate a more random index using multiple sources of randomness
                const now = Date.now();
                const r1 = Math.random();
                const r2 = Math.random();
                const r3 = performance.now() % 1;
                const combinedRandom = (r1 + r2 + r3 + (now % 100) / 100) / 4;
                const j = Math.floor(combinedRandom * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        inputs.forEach(input => {
            const element = document.getElementById(`character-${input}`);
            const lockBtn = element.parentElement.querySelector('.lock-btn');
            
            if (!lockBtn || lockBtn.dataset.locked !== 'true') {
                if (input === 'name') {
                    element.value = '';
                } else {
                    const datalist = document.getElementById(`${input}-options`);
                    const options = Array.from(datalist.options).slice(1);
                    
                    const shuffledOptions = shuffle([...options]);
                    
                    const now = Date.now();
                    const r1 = Math.random();
                    const r2 = performance.now() % 1;
                    const combinedRandom = (r1 + r2 + (now % 100) / 100) / 3;
                    const randomIndex = Math.floor(combinedRandom * shuffledOptions.length);
                    
                    element.value = shuffledOptions[randomIndex].value;
                }
            } else if (element.dataset.lockedValue) {
                element.value = element.dataset.lockedValue;
            }
        });
    },

    generateCharacter: async function() {
        try {
            // Show status bar when starting generation
            const statusBar = document.getElementById('character-status');
            statusBar.style.display = 'block';

            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const model = document.getElementById('ollamavision-model').value;
            
            // Check if we're connected to a backend
            const disconnectBtn = document.getElementById('disconnect-btn');
            if (disconnectBtn.style.display === 'none') {
                this.updateStatus('error', 'Backend not connected!');
                return;
            }

            // Check if a model is selected
            if (!model) {
                this.updateStatus('error', 'Missing required parameters (model)');
                return;
            }

            this.updateCharacterStatus('info', 'Generating character...', true);

            // Get user inputs
            const name = document.getElementById('character-name').value;
            const sex = document.getElementById('character-sex').value;
            const species = document.getElementById('character-species').value;
            const setting = document.getElementById('character-setting').value;
            const alignment = document.getElementById('character-alignment').value;
            const characterClass = document.getElementById('character-class').value; // Added this line

            // Create the prompt for the LLM
            const prompt = `Generate a fully detailed character based on the provided user inputs.
RULES:

Name Generation Method:
Generate a unique character name based on the user's choices:

For Human or Realistic characters (e.g., Modern, Renaissance, Noir, Western settings):

Choose a first and last name from diverse real-world cultures.

Avoid the most common names (e.g., 'John Smith' or 'Emily Johnson').

Randomize the first letter of both names to ensure variation.

For other settings such as Fantasy, Sci-Fi, Space, or any other setting where human sounding names don't fit follow the name generation method below:

Step 1: If a species or setting is provided, start with a related seed word based on the species or setting (e.g., for "Elf" choose "Elven", for "Clockwork Empire" choose "Cog", etc.).

If no specific guidance is given, select a random seed word.

Step 2: Convert Seed Name to Alphabetical Values:

Convert the letters of the base name to numbers based on their position in the alphabet (e.g., A = 1, Z = 26).

Step 3: Randomize the Numbers:

Shuffle these numbers randomly.

Add random offsets to each number (between ±1 and ±5) to further break the pattern.

Optionally, insert random numbers between 1 and 26 into the sequence to introduce more unpredictability.

Step 4: Convert the Randomized Numbers Back to Letters:

Convert the new numbers back into letters (A-Z). If any number exceeds 26, loop back through the alphabet (e.g., 27 = A, 28 = B, etc.).

Step 5: Phonetic Structuring:

Now take the randomized string of letters and apply phonetic rules to make it sound like a name.

Ensure the resulting name flows phonetically, with proper consonant-vowel combinations, and sounds pronounceable while still retaining randomness. The name should not resemble anything too familiar or typical.

Do not try to form a regular name pattern—maintain a sense of unpredictability.

Step 6: Return the Name:
END OF NAMING METHOD

Output Format and Structure:
Output the final result as the name. Only reply with the name, nothing else. Do not tell me "here is your reply" or anything else except the name.
Strictly follow the provided structure using bold section titles and clear formatting.
Each character must feel entirely unique, with no reused details or repeated ideas. Always use randomization for each character.
Character Creation Rules:

Overview: Use randomization for each character. Each character must have a unique name, alignment, traits, and backstory tailored to the user's inputs. For randomly selected attributes, generate fresh and imaginative combinations each time.
Diversity: Do not restrict characters to stereotypes based on class, role, or species. For example:
A Warrior can be tall and wiry instead of large and muscular.
A Performer could be shy but charismatic when performing.
Beastkin must feel like true human-animal hybrids, with physical traits and personalities reflecting their animal side.
Beastkin-Specific Rules:

When the Species is Beastkin, always create a unique anthropomorphic character inspired by an animal.
Generate a specific sub-type (e.g., Wolf Beastkin, Owl Beastkin, Turtle Beastkin) dynamically, not limited to a predefined list.
Physical Traits: Ensure physical features reflect the animal inspiration, such as:
Fur, scales, or feathers with distinct patterns or colors.
Ears, tails, claws, or wings adapted to their hybrid form.
A mix of human-like and animal-like traits (e.g., an anthropomorphic tiger with a humanoid face and expressive golden eyes, or a sleek, feline build).
Abilities: Highlight abilities tied to their animal side, such as enhanced senses, agility, strength, or unique magical traits.
Physical Diversity:

Do not restrict characters to standard appearances. Explore varied body types, heights, and features. For instance:
Short and Stocky: A muscular Beastkin Performer with a bear-inspired physique.
Lean and Graceful: A slender Wolf Beastkin Ranger with lithe movements.
Unconventional Features: A Golem Mage with cracked stone skin glowing with magical runes.
Backstory Depth:

Ensure every character has a rich backstory integrating their species, role, and setting.
Highlight conflicts, motivations, and relationships that make the character engaging.
For Beastkin, include cultural or societal elements tied to their animal traits (e.g., tribal customs, connection to nature, or their role within their hybrid community).
AI Image Prompt Rules:

Always include a highly descriptive AI Image Prompt based on the character's physical traits, clothing, setting, and pose.
For Beastkin, ensure the description emphasizes the anthropomorphic design (e.g., "a humanoid fox with sleek red fur, wearing leather armor with intricate tribal patterns").
Use vivid details to reflect their backstory and role (e.g., "a Tiger Beastkin mage with glowing orange stripes, casting a spell in a jungle setting under moonlight").

If the user has selected "Random" as their option choose from the following options for each field that they have chosen "Random" in:

Sex Options: Male, Female

Species Options: Alien, Android, Angel, Arachne, Automaton, Beastkin, Celestial, Chimera, Cyborg, Dark Elf, Demon, Djinn, Dragonborn, Dryad, Dwarf, Elf, Fairy, Feralfolk, Fungoid, Gargoyle, Genasi, Ghost, Ghoul, Goblin, Golem, Gorgon, Harpy, High Elf, Human, Krakenborn, Lizardfolk, Merfolk, Minotaur, Naga, Nephilim, Oni, Orc, Phoenixborn, Plantfolk, Shadowkin, Slimefolk, Tiefling, Troll, Undead, Vampire, Werewolf, Yokai

Setting Options: Ancient Egypt, Biopunk, Clockwork Empire, Cyberpunk, Cyberpunk Fantasy (Shadowrun), Dark Cosmic Fantasy, Desert Wasteland, Digital/Cyberspace, Dimensional Rift, Dreamworld, Dying Earth, Dystopian, Eldritch Noir, Fantasy, Feudal Japan, Floating Islands, Haunted Realm, High Seas Adventure, Lovecraftian Horror, Magitech Society, Medieval, Megacity, Modern, Mythological, Necropolis, Noir Detective World, Pirate World, Post-Apocalyptic, Prehistoric Fantasy, Renaissance Kingdom, Samurai Era, Sci-Fi, Simulation, Space Opera, Steampunk, Superhero World, Surreal Dreamscape, Underwater Civilization, Underworld, Urban Fantasy, VR World, Volcanic Hellscape, Western

Alignment Options: Lawful Good, Neutral Good, Chaotic Good, Lawful Neutral, True Neutral, Chaotic Neutral, Lawful Evil, Neutral Evil, Chaotic Evil

Class/Role Options: Alchemist, Air Mage, Arcane Gunslinger, Archer, Assassin, Barbarian, Bard, Beast Rider, Beastmaster, Bishop, Blood Mage, Brewmaster, Chronomancer, Cleric, Corsair, Cultist, Decker, Demon Hunter, Diplomat, Druid, Earth Mage, Elementalist, Engineer, Exorcist, Fence, Fire Mage, Gladiator, Gunslinger, Hacker, Healer, Hunter, Illusionist, Inquisitor, Knight, Lightning Mage, Mage, Magician, Martial Artist, Necromancer, Paladin, Performer, Priest, Psionicist, Ranger, Rigger, Rogue, Runesmith, Seer, Shaman, Shapeshifter, Sorcerer, Spy, Street Samurai, Summoner, Tactician, Technomancer, Thief, Wastelander, Warlock, Warrior, Witch, Witch Hunter, Wizard

User Inputs:
Name: ${name || '[AI-generated]'}
Sex: ${sex === 'random' ? '[AI-generated]' : sex}
Species: ${species === 'random' ? '[AI-generated]' : species}
Setting: ${setting === 'random' ? '[AI-generated]' : setting}
Alignment: ${alignment === 'random' ? '[AI-generated]' : alignment}
Class/Role: ${characterClass === 'random' ? '[AI-generated]' : characterClass}

---

**Character Overview:**  
- Name: [User Input or AI-generated]  
- Sex: [Choose from Sex Options if random]  
- Species: [Choose from Species Options if random]  
- Setting: [Choose from Setting Options if random]  
- Alignment: [Choose from Alignment Options if random]  
- Class/Role: [Choose from Class/Role Options if random]  

**Personality & Traits:**  
- [List 3-4 defining personality traits]  
- [Describe key strengths and weaknesses]  

**Physical Description:**  
- Height & Build: [Tall, short, muscular, thin, etc. do not limit yourself to stereotypes]  
- Skin, Hair, and Eyes: [Describe colors, texture, or unique features]  
- Clothing & Accessories: [What the character wears and notable items]  
- Weapons or Tools: [If applicable, describe what they carry]  

**Abilities & Skills:**  
- [List 3-4 abilities that match their class/role]
- [If the user is trying to create a real world character such as a human then do not give them special powers or abilities make their skills real world skills]
- [Ensure abilities fit the setting, species, and role]
- [Add unique or signature abilities]

**Backstory:**  
- [Write a short but fully detailed backstory that integrates the character's setting, role, and alignment]  
- [Include motivations, conflicts, relationships, and major life events]  
- [Explain how they came to their class/role and what they do now]

**AI Image Prompt:**  
*"[A vivid, highly detailed description of the character's physical appearance, clothing, setting, pose, lighting, and artistic style for AI image generation. Ensure it is unique each time, incorporating elements from the AI-generated backstory. Each one should be a character portrait.]"*`;

            // Make the request using GenerateCharacterAsync
            const response = await new Promise((resolve, reject) => {
                genericRequest('GenerateCharacterAsync', {
                    model: model,
                    backendType: backendType,
                    prompt: prompt,
                    temperature: parseFloat(localStorage.getItem('ollamaVision_temperature')) || 0.8,
                    maxTokens: parseInt(localStorage.getItem('ollamaVision_maxTokens')) || -1,
                    topP: parseFloat(localStorage.getItem('ollamaVision_topP')) || 0.7,
                    frequencyPenalty: parseFloat(localStorage.getItem('ollamaVision_frequencyPenalty')) || 0.0,
                    presencePenalty: parseFloat(localStorage.getItem('ollamaVision_presencePenalty')) || 0.0,
                    repeatPenalty: parseFloat(localStorage.getItem('ollamaVision_repeatPenalty')) || 1.1,
                    topK: parseInt(localStorage.getItem('ollamaVision_topK')) || 40,
                    seed: parseInt(localStorage.getItem('ollamaVision_seed')) || -1,
                    minP: parseFloat(localStorage.getItem('ollamaVision_minP')) || 0.0,
                    topA: parseFloat(localStorage.getItem('ollamaVision_topA')) || 0.0,
                    apiKey: localStorage.getItem(`ollamaVision_${backendType}Key`),
                    apiBaseUrl: normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL),
                    siteName: localStorage.getItem('ollamaVision_openrouterSite') || 'SwarmUI',
                    ollamaUrl: `http://${localStorage.getItem('ollamaVision_host') || 'localhost'}:${localStorage.getItem('ollamaVision_port') || '11434'}`
                }, 
                (data) => resolve(data),
                (error) => reject(error));
            });

            if (response.success) {
                if (!response.response || response.response.trim().toLowerCase() === "null") {
                    throw new Error("The LLM has censored you or rate limited you. Try again or edit your prompt and check your image.");
                }

                document.getElementById('character-output').textContent = response.response;
                this.updateCharacterStatus('success', 'Character generated successfully');
                await this.unloadModelIfEnabled(model);
            } else {
                throw new Error(response.error || 'Unknown error occurred');
            }
        } catch (error) {
            this.updateCharacterStatus('error', error.message);
        } finally {
            // Hide status bar when generation is complete
            document.getElementById('character-status').style.display = 'none';
        }
    },

    showCharacterCreator: function() {
        if (!document.getElementById('characterCreatorModal')) {
            const modalHtml = `
                <div class="modal fade" id="characterCreatorModal" tabindex="-1">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            // ... existing modal header and body content ...
                            
                            <div class="text-center mb-3">
                                <button type="button" class="basic-button" onclick="ollamaVision.generateCharacter()">Generate Character</button>
                                <!-- Update status bar to match other modals -->
                                <div id="character-status" class="alert alert-info mt-2 mx-3" style="display: none;">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <div class="spinner-border spinner-border-sm me-2" role="status" id="character-spinner" style="display: none;">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                        <span id="character-status-text" style="font-size: 1.2rem;"></span>
                                    </div>
                                </div>
                            </div>

                            <div class="modal-footer">
                                <button type="button" class="basic-button" onclick="ollamaVision.saveCharacter()">Save Character</button>
                                <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>`;

            // ... rest of existing showCharacterCreator code ...
        }
    },

    // Add new function to save character to file
    saveCharacter: async function() {
        const characterText = document.getElementById('character-output').textContent;
        if (!characterText) {
            this.updateStatus('error', 'No character to save');
            return;
        }

        try {
            // Create a blob with just the character text
            const blob = new Blob([characterText], { type: 'text/plain' });
            
            // Create a temporary link element
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            
            // Generate filename with timestamp
            const nameMatch = characterText.match(/Name:\s*([^\n\r]*)/);
            const name = nameMatch ? nameMatch[1].trim() : 'Unknown Character';
            const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            a.download = `${safeName}_${timestamp}.txt`;
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            
            this.updateStatus('success', 'Character saved successfully');
        } catch (error) {
            this.updateStatus('error', 'Failed to save character');
        }
    },

    updateCharacterStatus: function(type, message, showSpinner = false) {
        const statusBar = document.getElementById('character-status');
        const statusText = document.getElementById('character-status-text');
        const spinner = document.getElementById('character-spinner');
        
        if (statusBar && statusText) {
            statusBar.style.display = 'block';
            // Map type to Bootstrap alert classes
            const alertClass = type === 'error' ? 'alert-danger' : 
                             type === 'success' ? 'alert-success' : 
                             'alert-info';
            statusBar.className = `alert ${alertClass} mt-2 mx-3`;
            statusText.textContent = message;
            
            // Only show spinner for info messages and when explicitly requested
            if (spinner) {
                spinner.style.display = (type === 'info' && showSpinner) ? 'inline-block' : 'none';
            }

            // Auto-hide success messages after 2 seconds
            if (type === 'success') {
                setTimeout(() => {
                    statusBar.style.display = 'none';
                }, 2000);
            }
        }
    },

    clearAllInputs: function() {
        const inputs = ['name', 'sex', 'species', 'setting', 'alignment', 'class'];
        inputs.forEach(input => {
            const element = document.getElementById(`character-${input}`);
            const lockBtn = element.parentElement.querySelector('.lock-btn');
            
            // Only clear if not locked
            if (element && (!lockBtn || lockBtn.dataset.locked !== 'true')) {
                element.value = '';
            }
        });
        
        // Show success message without spinner
        this.updateCharacterStatus('success', 'Fields cleared successfully', false);
        
        // Hide status after 2 seconds
        setTimeout(() => {
            const statusBar = document.getElementById('character-status');
            if (statusBar) {
                statusBar.style.display = 'none';
            }
        }, 2000);
    },

    extractImagePrompt: function() {
        const characterText = document.getElementById('character-output').textContent;
        if (!characterText) {
            this.updateCharacterStatus('error', 'No character description found');
            return;
        }

        // Look for everything after "AI Image Prompt:" until a double newline or end of text
        const promptMatch = characterText.match(/(?:AI Image Prompt:?|(?:##\s)?AI Image Prompt)[\s\n]*([^]*?)(?:\n\n|$)/i);
        if (promptMatch && promptMatch[1]) {
            // Clean up the extracted prompt - remove asterisks, quotes, and extra whitespace
            let imagePrompt = promptMatch[1].trim()
                .replace(/^[\s\*"\[\]]+|[\s\*"\[\]]+$/g, ''); // Remove wrapping asterisks/quotes/brackets
            
            // Additional validation
            if (imagePrompt === '*' || imagePrompt.length < 2) {
                this.updateCharacterStatus('error', 'Invalid image prompt found');
                return;
            }
            
            // Close the character modal
            bootstrap.Modal.getInstance(document.getElementById('characterCreatorModal')).hide();
            
            // Send to the text2image tab
            document.getElementById('text2imagetabbutton').click();
            setTimeout(() => {
                const generatePromptTextarea = document.getElementById("input_prompt");
                if (generatePromptTextarea) {
                    generatePromptTextarea.value = imagePrompt;
                    generatePromptTextarea.dispatchEvent(new Event('input'));
                    this.updateStatus('success', 'Image prompt extracted and sent to prompt');
                }
            }, 100);
        } else {
            this.updateCharacterStatus('error', 'No image prompt found in character description');
        }
    },

    analyzeImage: async function(imageData, modelName) {
        try {
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const displayName = this.getBackendDisplayName(backendType);
            this.updateStatus('info', `Analyzing image with ${displayName}...`, true);

            // ... existing code ...
        } catch (error) {
            // ... existing code ...
        }
    },

    // Add the new modal HTML and functions for character image saving
    showSaveCharacterImageModal: function() {
        if (!document.getElementById('saveCharacterImageModal')) {
            const modalHtml = `
                <div class="modal fade" id="saveCharacterImageModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Create Character Image Card</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="text-center mb-3" style="border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                                    <p class="mb-0" style="font-size: 1.1rem; color: var(--text-color-secondary);">When you press "Save", the LLM will create a SillyTavern character card using the character information.</p>
                                </div>
                                <div class="preview-container text-center" style="max-width: 100%; height: 400px; position: relative; margin: 0 auto;">
                                    <img id="character-image-preview" class="img-fluid" 
                                         src="${PLACEHOLDER_IMAGE}"
                                         style="height: 100%; object-fit: contain; max-width: 100%; margin: 0 auto;">
                                </div>
                                <div class="d-flex justify-content-center gap-3 mt-4">
                                    <button class="basic-button" onclick="ollamaVision.uploadCharacterImage()" 
                                            style="font-size: 1.2rem; padding: 10px 20px;">
                                        Upload Image
                                    </button>
                                    <button class="basic-button" onclick="ollamaVision.pasteCharacterImage()" 
                                            style="font-size: 1.2rem; padding: 10px 20px;">
                                        Paste Image
                                    </button>
                                </div>
                                
                                <!-- Add scenario section -->
                                <div class="mt-4">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <label for="character-scenario" class="form-label mb-0" style="font-size: 1.2rem;">Scenario (Optional)</label>
                                    </div>
                                    <textarea id="character-scenario" class="auto-text-block modal_text_extra" 
                                              rows="4" placeholder="Enter a scenario for your character or leave blank"
                                              style="font-size: 1.1rem;"></textarea>
                                    <div class="d-flex justify-content-end mt-2">
                                        <button class="basic-button" onclick="ollamaVision.generateScenario()" style="font-size: 1.1rem; padding: 5px 15px;">
                                            Generate Scenario
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div id="character-image-status" class="alert alert-info mt-3 text-center mx-3 mb-3" style="display: none;">
                                <div class="d-flex align-items-center justify-content-center">
                                    <div class="spinner-border spinner-border-sm me-2" role="status" id="character-image-spinner" style="display: none;">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <span id="character-image-status-text" style="font-size: 1.2rem;"></span>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="basic-button" onclick="ollamaVision.saveCharacterImageWithMetadata()" 
                                        id="save-character-image-btn" disabled>
                                    Save Image
                                </button>
                                <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Add generateScenario function for the new button
            this.generateScenario = async function() {
                try {
                    // Get the character data to use for scenario generation
                    const characterText = document.getElementById('character-output').textContent;
                    if (!characterText) {
                        this.updateCharacterImageStatus('error', 'No character data found');
                        return;
                    }
                    
                    this.updateCharacterImageStatus('info', 'Generating scenario...', true);
                    
                    // Extract character info for the prompt
                    const nameMatch = characterText.match(/Name:\s*([^\n\r]*)/);
                    const speciesMatch = characterText.match(/Species:\s*([^\n\r]*)/);
                    const classMatch = characterText.match(/Class\/Role:\s*([^\n\r]*)/);
                    const alignmentMatch = characterText.match(/Alignment:\s*([^\n\r]*)/);
                    const personalityMatch = characterText.match(/Personality & Traits:([^]*?)(?=Physical Description:|$)/s);
                    const abilitiesMatch = characterText.match(/Abilities & Skills:([^]*?)(?=Backstory:|$)/s);
                    const backstoryMatch = characterText.match(/Backstory:([^]*?)(?=AI Image Prompt:|$)/s);
                    
                    const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
                    const species = speciesMatch ? speciesMatch[1].trim() : '';
                    const classRole = classMatch ? classMatch[1].trim() : '';
                    const alignment = alignmentMatch ? alignmentMatch[1].trim() : '';
                    const personality = personalityMatch ? personalityMatch[1].trim() : '';
                    const abilities = abilitiesMatch ? abilitiesMatch[1].trim() : '';
                    const backstory = backstoryMatch ? backstoryMatch[1].trim() : '';
                    
                    // Create the scenario prompt with more complete character information
                    const scenarioPrompt = `Generate a short roleplay scenario for this character:

Name: ${name}
Species: ${species}
Class/Role: ${classRole}
${alignment ? `Alignment: ${alignment}` : ''}
Personality: ${personality}
${abilities ? `Abilities: ${abilities}` : ''}
${backstory ? `Background: ${backstory}` : ''}

Create a brief, engaging scenario (2-4 sentences) that this character would typically be found in, based on their traits, abilities, alignment, and backstory. The scenario should establish a compelling starting point for roleplay with this character and be appropriate for their moral alignment.

Scenario:`;
                    
                    // Get the current model and backend type
                    const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
                    const model = document.getElementById('ollamavision-model').value;
                    
                    // Call the API to generate the scenario
                    const response = await new Promise((resolve, reject) => {
                        genericRequest('GenerateCharacterAsync', {
                            model: model,
                            backendType: backendType,
                            prompt: scenarioPrompt,
                            temperature: 0.7,
                            maxTokens: -1,
                            topP: 0.7,
                            frequencyPenalty: 0.3,
                            presencePenalty: 0.3,
                            repeatPenalty: 1.1,
                            topK: 40,
                            seed: -1,
                            apiKey: localStorage.getItem(`ollamaVision_${backendType}Key`),
                            apiBaseUrl: normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL),
                            siteName: localStorage.getItem('ollamaVision_openrouterSite') || 'SwarmUI',
                            ollamaUrl: `http://${localStorage.getItem('ollamaVision_host') || 'localhost'}:${localStorage.getItem('ollamaVision_port') || '11434'}`
                        },
                        (data) => resolve(data),
                        (error) => reject(error));
                    });
                    
                    if (response.success && response.response) {
                        // Update the scenario field with the generated text
                        document.getElementById('character-scenario').value = response.response.trim();
                        this.updateCharacterImageStatus('success', 'Scenario generated successfully');
                    } else {
                        throw new Error(response.error || 'Failed to generate scenario');
                    }
                } catch (error) {
                    this.updateCharacterImageStatus('error', 'Failed to generate scenario: ' + error.message);
                }
            };

            // Add drag and drop functionality
            const previewContainer = document.getElementById('character-image-preview').parentElement;
            
            previewContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                previewContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            });

            previewContainer.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                previewContainer.style.backgroundColor = '';
            });

            previewContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                previewContainer.style.backgroundColor = '';

                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    this.handleCharacterImageUpload(file);
                } else {
                    this.updateCharacterImageStatus('error', 'Please drop an image file');
                }
            });
        }

        new bootstrap.Modal(document.getElementById('saveCharacterImageModal')).show();
    },

    uploadCharacterImage: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleCharacterImageUpload(file);
            }
        };
        input.click();
    },

    pasteCharacterImage: function() {
        // Enable paste handler
        this.characterImagePasteHandler = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    this.handleCharacterImageUpload(file);
                    break;
                }
            }
        };

        document.addEventListener('paste', this.characterImagePasteHandler);
        this.updateCharacterImageStatus('info', 'Press Ctrl+V to paste an image');
    },

    handleCharacterImageUpload: function(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('character-image-preview');
            preview.src = e.target.result;
            preview.dataset.imageData = e.target.result;
            
            // Enable the save button
            document.getElementById('save-character-image-btn').disabled = false;

            // Remove paste handler if it exists
            if (this.characterImagePasteHandler) {
                document.removeEventListener('paste', this.characterImagePasteHandler);
                this.characterImagePasteHandler = null;
            }
        };
        reader.readAsDataURL(file);
    },

    updateCharacterImageStatus: function(type, message, showSpinner = false) {
        const statusBar = document.getElementById('character-image-status');
        const statusText = document.getElementById('character-image-status-text');
        const spinner = document.getElementById('character-image-spinner');
        
        if (statusBar && statusText) {
            statusBar.style.display = 'block';
            const alertClass = type === 'error' ? 'alert-danger' : 
                             type === 'success' ? 'alert-success' : 
                             'alert-info';
            statusBar.className = `alert ${alertClass} mt-3 text-center mx-3 mb-3`;
            statusText.textContent = message;
            
            if (spinner) {
                spinner.style.display = (type === 'info' && showSpinner) ? 'inline-block' : 'none';
            }

            if (type === 'success') {
                setTimeout(() => {
                    statusBar.style.display = 'none';
                }, 2000);
            }
        }
    },

    saveCharacterImageWithMetadata: async function() {
        try {
            const characterText = document.getElementById('character-output').textContent;
            if (!characterText) {
                this.updateCharacterImageStatus('error', 'No character data to save');
                return;
            }

            const preview = document.getElementById('character-image-preview');
            const imageData = preview.dataset.imageData;
            if (!imageData) {
                this.updateCharacterImageStatus('error', 'No image selected');
                return;
            }

            this.updateCharacterImageStatus('info', 'Generating character details...', true);

            // Get the SillyTavern data using the new function
            const sillyTavernResult = await this.getSillyTavernData();
            if (!sillyTavernResult.success) {
                throw new Error('Failed to generate character data: ' + sillyTavernResult.error);
            }

            // Simply use whatever is in the scenario field (might be blank)
            sillyTavernResult.data.scenario = document.getElementById('character-scenario').value.trim();

            this.updateCharacterImageStatus('info', 'Processing image...', true);

            // Get the original image data
            const imgResponse = await fetch(imageData);
            const arrayBuffer = await imgResponse.arrayBuffer();
            const originalImageData = new Uint8Array(arrayBuffer);

            // Find the IEND chunk in the original PNG
            let pos = 8; // Skip PNG signature
            const chunks = [];
            
            // Read all chunks from the original PNG
            while (pos < originalImageData.length) {
                const length = (originalImageData[pos] << 24) | (originalImageData[pos + 1] << 16) | 
                             (originalImageData[pos + 2] << 8) | originalImageData[pos + 3];
                const type = String.fromCharCode(...originalImageData.slice(pos + 4, pos + 8));
                
                // Skip any existing chara chunks
                if (type !== 'IEND' && type !== 'tEXt') {
                    // Copy non-IEND chunks
                    chunks.push(originalImageData.slice(pos, pos + length + 12));
                }
                pos += length + 12;
            }

            // Create tEXt chunk with character data
            const keyword = 'chara';
            const encoder = new TextEncoder();
            const keywordBytes = encoder.encode(keyword);

            // Convert sillyTavernData to base64
            const base64CharacterData = safeBase64Encode(JSON.stringify({
                spec: "chara_card_v3",
                spec_version: "3.0",
                data: sillyTavernResult.data,
                avatar: "none",
                chat: null,
                create_date: new Date().toISOString(),
                creatorcomment: "\nThis card was created using OllamaVision."
            }));
            const characterBytes = encoder.encode(base64CharacterData);

            // Use existing chunk handling code
            const textChunkData = new Uint8Array(keywordBytes.length + 1 + characterBytes.length);
            textChunkData.set(keywordBytes, 0);
            textChunkData[keywordBytes.length] = 0; // null separator
            textChunkData.set(characterBytes, keywordBytes.length + 1);

            // Calculate CRC32 for tEXt chunk
            const textChunkType = encoder.encode('tEXt');
            const crcData = new Uint8Array(textChunkType.length + textChunkData.length);
            crcData.set(textChunkType);
            crcData.set(textChunkData, textChunkType.length);
            const crc = this.calculateCRC32(crcData);

            // Create complete tEXt chunk
            const textChunk = new Uint8Array(12 + textChunkData.length);
            // Length
            textChunk[0] = (textChunkData.length >> 24) & 0xff;
            textChunk[1] = (textChunkData.length >> 16) & 0xff;
            textChunk[2] = (textChunkData.length >> 8) & 0xff;
            textChunk[3] = textChunkData.length & 0xff;
            // Type
            textChunk.set(textChunkType, 4);
            // Data
            textChunk.set(textChunkData, 8);
            // CRC
            textChunk[textChunk.length - 4] = (crc >> 24) & 0xff;
            textChunk[textChunk.length - 3] = (crc >> 16) & 0xff;
            textChunk[textChunk.length - 2] = (crc >> 8) & 0xff;
            textChunk[textChunk.length - 1] = crc & 0xff;

            // Add tEXt chunk to chunks array
            chunks.push(textChunk);

            // Add IEND chunk
            const iendChunk = new Uint8Array([
                0, 0, 0, 0,             // Length (0)
                0x49, 0x45, 0x4E, 0x44, // "IEND"
                0xAE, 0x42, 0x60, 0x82  // CRC
            ]);
            chunks.push(iendChunk);

            // Calculate total size and create final PNG
            const totalSize = 8 + chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const finalPNG = new Uint8Array(totalSize);
            
            // Add PNG signature
            finalPNG.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
            
            // Add all chunks
            let offset = 8;
            for (const chunk of chunks) {
                finalPNG.set(chunk, offset);
                offset += chunk.length;
            }

            // Create blob and download
            const blob = new Blob([finalPNG], { type: 'image/png' });
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const safeName = sillyTavernResult.data.name.replace(/[^a-zA-Z0-9]/g, '_');
            downloadLink.download = `${safeName}_${timestamp}.png`;
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(downloadLink.href);

            this.updateCharacterImageStatus('success', 'Character image saved successfully!');
            
            // Close the modal after a short delay
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('saveCharacterImageModal')).hide();
            }, 1500);
        } catch (error) {
            this.updateCharacterImageStatus('error', 'Failed to save character image: ' + error.message);
        }
    },

    // Helper function to create PNG chunks
    createPNGChunk: function(type, data) {
        const encoder = new TextEncoder();
        const typeBytes = encoder.encode(type);
        
        // Calculate CRC32
        const crcData = new Uint8Array(typeBytes.length + data.length);
        crcData.set(typeBytes);
        crcData.set(data, typeBytes.length);
        const crc = this.calculateCRC32(crcData);

        // Create chunk
        const chunk = new Uint8Array(data.length + 12);
        // Length
        chunk[0] = (data.length >> 24) & 0xff;
        chunk[1] = (data.length >> 16) & 0xff;
        chunk[2] = (data.length >> 8) & 0xff;
        chunk[3] = data.length & 0xff;
        // Type
        chunk.set(typeBytes, 4);
        // Data
        chunk.set(data, 8);
        // CRC
        chunk[chunk.length - 4] = (crc >> 24) & 0xff;
        chunk[chunk.length - 3] = (crc >> 16) & 0xff;
        chunk[chunk.length - 2] = (crc >> 8) & 0xff;
        chunk[chunk.length - 1] = crc & 0xff;

        return chunk;
    },

    // CRC32 calculation for PNG chunks
    calculateCRC32: function(data) {
        // Create CRC32 table
        const CRC32_TABLE = new Int32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
            }
            CRC32_TABLE[i] = c;
        }

        let crc = -1;
        for (let i = 0; i < data.length; i++) {
            crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ data[i]) & 0xFF];
        }
        return ~crc;
    },

    // Add new function to get SillyTavern data without downloading
    getSillyTavernData: async function() {
        const characterText = document.getElementById('character-output').textContent;
        if (!characterText) {
            return {
                success: false,
                error: 'No character to export'
            };
        }

        try {
            // Extract basic character information
            const nameMatch = characterText.match(/Name:\s*([^\n\r]*)/);
            const sexMatch = characterText.match(/Sex:\s*([^\n\r]*)/);
            const speciesMatch = characterText.match(/Species:\s*([^\n\r]*)/);
            const alignmentMatch = characterText.match(/Alignment:\s*([^\n\r]*)/);
            const classMatch = characterText.match(/Class\/Role:\s*([^\n\r]*)/);
            
            // Extract detailed sections and clean them up
            const personalityMatch = characterText.match(/Personality & Traits:([^]*?)(?=Physical Description:|$)/s);
            const physicalMatch = characterText.match(/Physical Description:([^]*?)(?=Abilities & Skills:|$)/s);
            const abilitiesMatch = characterText.match(/Abilities & Skills:([^]*?)(?=Backstory:|$)/s);
            const backstoryMatch = characterText.match(/Backstory:([^]*?)(?=AI Image Prompt:|$)/s);

            // Function to clean up text sections
            const cleanTextSection = (text) => {
                if (!text) return '';
                return text
                    .replace(/^\s*[-•]\s*/gm, '') // Remove bullet points (excluding asterisks)
                    .replace(/\*\*/g, '') // Remove bold markers
                    // Don't remove trailing asterisks as they might be part of actions
                    .replace(/([^:\n]*):\s*([^\n]*)/g, '$1: $2\n') // Ensure categories are on new lines
                    .trim();
            };

            // Function to format example messages
            const formatExampleMessages = (text) => {
                if (!text) return '';
                const examples = text.split('\n\n');
                return examples.map(example => {
                    // Add START tag if not present
                    if (!example.startsWith('<START>')) {
                        example = `<START>\n${example}`;
                    }
                    // Replace character name with {{char}} if not already present
                    if (nameMatch) {
                        example = example.replace(new RegExp(nameMatch[1], 'g'), '{{char}}');
                    }
                    return example;
                }).join('\n\n');
            };

            // Generate tags based on character attributes
            const generateTags = (data, personality) => {
                const tags = new Set();
                
                // Add basic attributes
                if (data.species) {
                    // Handle compound species (like "High Elf" -> both "high elf", "high", and "elf")
                    const species = data.species.toLowerCase();
                    tags.add(species);
                    
                    // Add individual parts of compound species
                    const speciesParts = species.split(/\s+/);
                    if (speciesParts.length > 1) {
                        speciesParts.forEach(part => {
                            if (part.length > 2) tags.add(part); // Only add parts with 3+ chars
                        });
                    }
                }
                
                if (data.sex) tags.add(data.sex.toLowerCase());
                
                if (data.class_role) {
                    // Handle both predefined and custom roles
                    const roles = data.class_role.toLowerCase().split(/[\/,;&+]/);
                    roles.forEach(role => {
                        const trimmedRole = role.trim();
                        if (trimmedRole) {
                            tags.add(trimmedRole);
                            
                            // For compound roles like "Blood Mage", add both "blood mage" and "mage"
                            const roleParts = trimmedRole.split(/\s+/);
                            if (roleParts.length > 1) {
                                // Always add the last part as it's often the core class (e.g., "Blood Mage" -> "Mage")
                                tags.add(roleParts[roleParts.length - 1]);
                            }
                        }
                    });
                }
                
                if (data.alignment) {
                    const alignment = data.alignment.toLowerCase();
                    tags.add(alignment);
                    
                    // Add individual parts of alignment (e.g., "Chaotic Good" -> "chaotic" and "good")
                    const alignmentParts = alignment.split(/\s+/);
                    if (alignmentParts.length > 1) {
                        alignmentParts.forEach(part => tags.add(part));
                    }
                }

                // Add personality-based tags
                if (personality) {
                    const personalityLower = personality.toLowerCase();
                    
                    // Expanded personality traits
                    const personalityTraits = [
                        // Basic traits
                        'friendly', 'shy', 'brave', 'curious', 'playful', 'serious', 'mysterious', 'loyal', 'mischievous',
                        // Emotional traits
                        'cheerful', 'gloomy', 'calm', 'anxious', 'passionate', 'stoic', 'emotional', 'detached',
                        // Social traits
                        'charismatic', 'awkward', 'charming', 'reserved', 'outgoing', 'introverted', 'extroverted',
                        // Intellectual traits
                        'intelligent', 'wise', 'analytical', 'creative', 'logical', 'intuitive', 'thoughtful',
                        // Moral traits
                        'kind', 'cruel', 'honorable', 'dishonest', 'just', 'devious', 'selfless', 'selfish'
                    ];
                    
                    personalityTraits.forEach(trait => {
                        if (personalityLower.includes(trait)) tags.add(trait);
                    });
                    
                }
                
                // Extract profession-related tags from description and abilities
                if (data.description) {
                    const descriptionLower = data.description.toLowerCase();
                    const professions = [
                        'warrior', 'mage', 'wizard', 'witch', 'hunter', 'assassin', 'thief', 'rogue', 
                        'knight', 'healer', 'priest', 'cleric', 'monk', 'druid', 'ranger', 'bard',
                        'necromancer', 'paladin', 'sorcerer', 'fighter', 'barbarian', 'pirate',
                        'noble', 'royal', 'merchant', 'craftsman', 'scholar', 'scientist', 'engineer',
                        'samurai', 'ninja', 'gunslinger', 'shaman', 'warlock', 'artificer', 'inquisitor'
                    ];
                    
                    professions.forEach(profession => {
                        if (descriptionLower.includes(profession)) tags.add(profession);
                    });
                }
                
                // Add abilities-based tags
                if (data.abilities) {
                    const abilitiesLower = data.abilities.toLowerCase();
                    const powerTypes = [
                        'magic', 'elemental', 'fire', 'water', 'earth', 'air', 'lightning',
                        'telekinesis', 'telepathy', 'psychic', 'healing', 'illusion', 'shapeshifting',
                        'summoning', 'necromancy', 'divination', 'enchantment', 'alchemy', 
                        'martial arts', 'swordsmanship', 'archery', 'stealth', 'leadership',
                        'ice', 'shadow', 'light', 'darkness', 'time', 'space', 'gravity',
                        'blood', 'poison', 'nature', 'spirit', 'mind'
                    ];
                    
                    powerTypes.forEach(power => {
                        if (abilitiesLower.includes(power)) tags.add(power);
                    });
                    
                }

                return Array.from(tags);
            };

            // Create prompt for additional character elements
            let prompt = SILLYTAVERN_PROMPT.replace('${characterText}', characterText);
            
            // Get the scenario text if available
            const scenarioText = document.getElementById('character-scenario').value.trim();
            
            // Set up scenario sections for the prompt
            let scenarioSection = '';
            let firstMessageInstructions = '';
            
            if (scenarioText) {
                // Scenario exists - provide scenario-specific instructions
                scenarioSection = `Scenario:\n${scenarioText}\n\nIMPORTANT: This scenario will be used as the context for the character's first message.`;
                
                firstMessageInstructions = `1. First Message (first_mes):
- MUST be a direct continuation of the exact scenario above
- The character should be responding as if they are already in the middle of the scene described
- DO NOT address the user directly or start a new interaction
- Continue the scene exactly from where the scenario left off
- Include appropriate actions and dialogue that would naturally follow in that moment
- Make sure to maintain the tone and atmosphere established in the scenario
- If you use an action, it begins with * and ends with *
- Speech goes in quotes EXAMPLE: "What's happening to the river?", action has asterisks EXAMPLE: *reaches out with his tentacles to steady himself*`;
            } else {
                // No scenario - provide standard greeting instructions
                scenarioSection = '';
                
                firstMessageInstructions = `1. First Message (first_mes):
- A natural, in-character greeting that introduces the character
- Should reflect their personality and background
- Give a mix of actions and speech
- This greeting will be used as the first message in a new chat if the character has not already met the user
- Make this prompt in a style as if the character has never met the user before
- If you use an action at the beginning of a greeting make sure it begins with * and ends with *
- Speech goes in quotes EXAMPLE: "Hello, how are you?", action has an * at the beginning and at the end of the action EXAMPLE: *sets phone down*, narration gets nothing. Structure your responses accordingly. EXAMPLE MESSAGE: *I set my phone down and wave* "Hey, how are you!"`;
            }
            
            // Replace the placeholders
            prompt = prompt.replace('${scenarioSection}', scenarioSection);
            prompt = prompt.replace('${firstMessageInstructions}', firstMessageInstructions);

            // Get the current model and backend type
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const model = document.getElementById('ollamavision-model').value;

            // Generate the additional elements
            const response = await new Promise((resolve, reject) => {
                genericRequest('GenerateCharacterAsync', {
                    model: model,
                    backendType: backendType,
                    prompt: prompt,
                    temperature: 0.8,
                    maxTokens: -1,
                    topP: 0.7,
                    frequencyPenalty: 0.3,
                    presencePenalty: 0.3,
                    repeatPenalty: 1.1,
                    topK: 40,
                    seed: -1,
                    apiKey: localStorage.getItem(`ollamaVision_${backendType}Key`),
                    apiBaseUrl: normalizeOpenAIBaseUrl(localStorage.getItem('ollamaVision_openaiBaseUrl') || DEFAULT_OPENAI_BASE_URL),
                    siteName: localStorage.getItem('ollamaVision_openrouterSite') || 'SwarmUI',
                    ollamaUrl: `http://${localStorage.getItem('ollamaVision_host') || 'localhost'}:${localStorage.getItem('ollamaVision_port') || '11434'}`
                },
                (data) => resolve(data),
                (error) => reject(error));
            });

            if (!response.success) {
                throw new Error(response.error || 'Failed to generate additional character details');
            }

            // Extract and clean the generated elements
            const generatedText = response.response;
            
            
            const firstMesMatch = generatedText.match(/<first_mes>\n?([\s\S]*?)\n?<\/first_mes>/);
            const mesExampleMatch = generatedText.match(/<mes_example>\n?([\s\S]*?)\n?<\/mes_example>/);
            const systemPromptMatch = generatedText.match(/<system_prompt>\n?([\s\S]*?)\n?<\/system_prompt>/);
            const postHistoryMatch = generatedText.match(/<post_history_instructions>\n?([\s\S]*?)\n?<\/post_history_instructions>/);
            
            // Use only the XML-style pattern for alternate greetings
            const alternateGreetingsMatch = generatedText.match(/<alternate_greetings>\n?([\s\S]*?)\n?<\/alternate_greetings>/);
            
            // Create the base character data
            const characterData = {
                name: nameMatch ? nameMatch[1].trim() : 'Unknown',
                description: cleanTextSection((physicalMatch ? physicalMatch[1] : '') + 
                    (backstoryMatch ? '\n' + backstoryMatch[1] : '') + 
                    (abilitiesMatch ? '\n\nAbilities & Skills:\n\n\n' + abilitiesMatch[1] : '')),
                personality: cleanTextSection(personalityMatch ? personalityMatch[1] : ''),
                first_mes: firstMesMatch ? formatExampleMessages(cleanTextSection(firstMesMatch[1])) : '',
                mes_example: mesExampleMatch ? formatExampleMessages(cleanTextSection(mesExampleMatch[1])) : '',
                system_prompt: `You are ${nameMatch ? nameMatch[1].trim() : 'Unknown'}. ${cleanTextSection(personalityMatch ? personalityMatch[1] : '')}${systemPromptMatch ? '\n\n' + cleanTextSection(systemPromptMatch[1]) : ''}`,
                post_history_instructions: postHistoryMatch ? cleanTextSection(postHistoryMatch[1]) : '',
                alternate_greetings: alternateGreetingsMatch ? 
                    cleanTextSection(alternateGreetingsMatch[1])
                        .split('\n')
                        .filter(line => line.trim())
                        .map(greeting => formatExampleMessages(greeting)) : [],
                creator_notes: 'Created using OllamaVision Character Creator',
                character_book: '',
                scenario: '',
                creator: 'OllamaVision',
                character_version: '1.0',
                extensions: {
                    species: speciesMatch ? speciesMatch[1].trim() : '',
                    sex: sexMatch ? sexMatch[1].trim() : '',
                    alignment: alignmentMatch ? alignmentMatch[1].trim() : '',
                    class_role: classMatch ? classMatch[1].trim() : '',
                    abilities: cleanTextSection(abilitiesMatch ? abilitiesMatch[1] : ''),
                    backstory: cleanTextSection(backstoryMatch ? backstoryMatch[1] : ''),
                    world: '',
                    depth_prompt: {
                        prompt: '',
                        depth: 4,
                        role: 'system'
                    }
                }
            };

            // Generate tags based on character data
            characterData.tags = generateTags(characterData.extensions, characterData.personality);

            return {
                success: true,
                data: characterData
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
};

// Add this event listener after initialization
document.getElementById('user-prompt').addEventListener('change', function(e) {
    const value = e.target.value;
    localStorage.setItem('ollamaVision_currentUserPrompt', value);
    
    if (value.startsWith('custom_')) {
        const presetName = value.replace('custom_', '');
        const presets = JSON.parse(localStorage.getItem('ollamaVision_presets') || '[]');
        const preset = presets.find(p => p.name === presetName);
        if (preset) {
            // Load the original preset text
            document.getElementById('responsePrompt').value = preset.prompt;
            localStorage.removeItem('ollamaVision_editedResponseText');
        }
    }
});

// Example function to create a new preset
function createNewPreset(presetName) {
    const userPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
    
    // Add "USER:" prefix to the preset name
    const newPreset = {
        name: `USER: ${presetName}`, // Add the prefix here
        prompt: "Your preset prompt text here" // Replace with actual prompt
    };
    
    userPresets.push(newPreset);
    localStorage.setItem('ollamaVision_customPresets', JSON.stringify(userPresets));
    
    // Update the dropdown to reflect the new preset
    updatePresetsDropdown();
}

// Add this helper function
function filterBackendParams(params, backendType) {
    const commonParams = {
        model: params.model,
        backendType: params.backendType,
        imageData: backendType === 'ollama' ? 
            cleanBase64Data(params.imageData) : // Clean base64 for Ollama
            params.imageData,                   // Keep original for other backends
        prompt: params.prompt,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        topP: params.topP,
        systemPrompt: params.systemPrompt
    };

    switch(backendType) {
        case 'textgen':
            return {
                model: params.model,
                backendType: params.backendType,
                imageData: params.imageData,
                prompt: params.prompt
            };
        case 'openai':
            return {
                ...commonParams,
                apiKey: params.apiKey,
                apiBaseUrl: params.apiBaseUrl,
                frequencyPenalty: params.frequencyPenalty,
                presencePenalty: params.presencePenalty
            };
        case 'openrouter':
            return {
                ...commonParams,
                apiKey: params.apiKey,
                siteName: params.siteName,
                topK: params.topK,
                repeatPenalty: params.repeatPenalty,
                frequencyPenalty: params.frequencyPenalty,
                presencePenalty: params.presencePenalty,
                minP: params.minP,
                topA: params.topA,
                seed: params.seed
            };
        default: // ollama
            return {
                ...commonParams,
                ollamaUrl: params.ollamaUrl,
                topK: params.topK,
                repeatPenalty: params.repeatPenalty,
                seed: params.seed,
                autoUnload: params.autoUnload
            };
    }
}

// Add this helper function to clean base64 data
function cleanBase64Data(imageData) {
    // If it's a data URL, extract just the base64 part
    if (imageData.startsWith('data:')) {
        const base64Start = imageData.indexOf(',');
        if (base64Start !== -1) {
            return imageData.slice(base64Start + 1);
        }
    }
    return imageData;
}

function normalizeOpenAIBaseUrl(url) {
    if (!url || typeof url !== 'string') {
        return DEFAULT_OPENAI_BASE_URL;
    }

    let normalized = url.trim();
    if (!normalized) {
        return DEFAULT_OPENAI_BASE_URL;
    }

    if (!/^https?:\/\//i.test(normalized)) {
        normalized = `http://${normalized}`;
    }

    return normalized.replace(/\/+$/, '');
}

function requiresOpenAIApiKey(baseUrl) {
    if (!baseUrl) {
        return true;
    }
    return /openai\.com/i.test(baseUrl);
}

// Add model change event listener after model dropdown is populated
modelSelect.addEventListener('change', async function() {
    const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
    if (backendType === 'textgen') {
        const selectedModel = this.value;
        if (selectedModel) {
            try {
                ollamaVision.updateStatus('info', `Loading model ${selectedModel}...`, true);
                const textgenUrl = localStorage.getItem('ollamaVision_textgenUrl') || 'http://localhost:5000';
                
                const response = await new Promise((resolve, reject) => {
                    genericRequest('LoadTextGenModelAsync', 
                        { 
                            textgenUrl: textgenUrl,
                            model: selectedModel
                        },
                        (data) => resolve(data),
                        (error) => reject(error)
                    );
                });

                if (!response.success) {
                    throw new Error(response.error || 'Failed to load model');
                }

                ollamaVision.updateStatus('success', `Model ${selectedModel} loaded successfully`);
            } catch (error) {
                ollamaVision.updateStatus('error', `Failed to load model: ${error.message}`);
                this.value = '';
            }
        }
    }
});

// Add this helper function to properly encode strings to base64
function safeBase64Encode(str) {
    // First convert the string to UTF-8
    const utf8Bytes = new TextEncoder().encode(str);
    // Convert UTF-8 bytes to base64
    let base64 = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
        base64 += String.fromCharCode(utf8Bytes[i]);
    }
    return btoa(base64);
}
            