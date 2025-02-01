// Add at the top of the file
const dbName = 'OllamaVision';
const dbVersion = 1;

// Add this constant at the top of the file
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDY0MCA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0MCIgaGVpZ2h0PSI1MTIiIGZpbGw9IiMyQTJBMkEiLz48dGV4dCB4PSIzMjAiIHk9IjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNTYiIGZvbnQtd2VpZ2h0PSI2MDAiIGZpbGw9IiNDRjVCMkIiPk9sbGFtYVZpc2lvbjwvdGV4dD48cGF0aCBkPSJNMzIwIDEzOEM0OTUgMTM4IDQ5NSAzNzQgMzIwIDM3NEMxNDUgMzc0IDE0NSAxMzggMzIwIDEzOFoiIGZpbGw9IiM0MDQwNDAiLz48Y2lyY2xlIGN4PSIzMjAiIGN5PSIyNTYiIHI9IjY4IiBmaWxsPSIjNEE0QTRBIi8+PGNpcmNsZSBjeD0iMzIwIiBjeT0iMjU2IiByPSIzOCIgZmlsbD0iIzNCM0IzQiIvPjxjaXJjbGUgY3g9IjM0MCIgY3k9IjIzNiIgcj0iMTIiIGZpbGw9IiM1QTVBNUEiLz48dGV4dCB4PSIzMjAiIHk9IjQyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM4MDgwODAiPkRyYWcgYW5kIGRyb3Agb3IgdXNlIHRoZSBidXR0b25zIHRvIGFkZCBhbiBpbWFnZTwvdGV4dD48L3N2Zz4=';

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

// Add this function to handle loading the initial prepend
async function loadInitialPrepend() {
    // First check if prepends are enabled
    const prependsEnabled = localStorage.getItem('ollamaVision_prependsEnabled') !== 'false';
    if (!prependsEnabled) {
        return '';  // Return empty string if prepends are disabled
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
            // Get the edited text if it exists, otherwise use the original prepend text
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
                    connectBtn.innerHTML = `Connect to ${backendType === 'openai' ? 'OpenAI' : backendType === 'openrouter' ? 'OpenRouter' : 'Ollama'}`;
                }

                // Restore last selected preset in the dropdown
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
            
            console.log('Utilities tab found, OllamaVision tab added');
            return;
        }
        console.log('Utilities tab not found, something has gone very wrong!');
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
                            <div style="height: 100%;">
                                <button class="basic-button d-flex align-items-center justify-content-center" 
                                        onclick="ollamaVision.showLLMToysModal()" 
                                        id="llm-toys-btn" 
                                        style="font-size: 1.2rem; height: 5.5rem; margin: 0.35rem 0 -1.75rem 0;">
                                    LLM Toys
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
                                    style="width: auto; background-color: inherit; color: inherit; font-size: 1.2rem; float: right;" disabled>
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
                                            style="width: auto; min-width: 200px; padding: 6px 12px; border: 2px solid var(--border-color); background-color: var(--input-background-color);" 
                                            onchange="ollamaVision.toggleBackendSettings()">
                                        <option value="ollama">Ollama</option>
                                        <option value="openai">OpenAI</option>
                                        <option value="openrouter">OpenRouter</option>
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
    
    // Initialize the preview area after adding the content
    ollamaVision.initializePreviewArea();
    
    // Initialize presets after the tab content is added
    setTimeout(() => {
        const select = document.getElementById('promptPresets');
        if (select) {
            // Clear current options
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

    // After the tab content is added, restore the last selected response type
    const lastSelectedPreset = localStorage.getItem('ollamaVision_currentPreset') || 'Default';
    const promptPresets = document.getElementById('promptPresets');
    if (promptPresets) {
        promptPresets.value = lastSelectedPreset;
    }
}

window.ollamaVision = {
    connect: async function() {
        try {
            const connectBtn = document.getElementById('connect-btn');
            const disconnectBtn = document.getElementById('disconnect-btn');
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            
            connectBtn.innerHTML = `Connect to ${backendType === 'openai' ? 'OpenAI' : backendType === 'openrouter' ? 'OpenRouter' : 'Ollama'}`;
            connectBtn.disabled = true;
            connectBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Connecting to ${backendType === 'openai' ? 'OpenAI' : backendType === 'openrouter' ? 'OpenRouter' : 'Ollama'}...`;
            
            if (backendType === 'openai') {
                const apiKey = localStorage.getItem('ollamaVision_openaiKey');
                if (!apiKey) {
                    throw new Error('OpenAI API key not found. Please add it in settings.');
                }
                
                // Fetch all available models from OpenAI
                const response = await fetch('https://api.openai.com/v1/models', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                });

                if (!localStorage.getItem('ollamaVision_host')) {
                    localStorage.setItem('ollamaVision_host', 'localhost');
                }
                if (!localStorage.getItem('ollamaVision_port')) {
                    localStorage.setItem('ollamaVision_port', '11434');
                }

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'Failed to fetch models from OpenAI');
                }
    
                const data = await response.json();
                const modelSelect = document.getElementById('ollamavision-model');
                modelSelect.innerHTML = '<option value="">Select a model...</option>';
                
                // Sort models alphabetically by their ID
                const sortedModels = data.data.sort((a, b) => a.id.localeCompare(b.id));
                
                sortedModels.forEach(model => {
                    modelSelect.innerHTML += `<option value="${model.id}">${model.id}</option>`;
                });
    
                connectBtn.innerHTML = 'Connect to OpenAI';
                connectBtn.classList.add('connected');
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'inline-block';
                
                document.getElementById('ollamavision-model').disabled = false;
                document.getElementById('paste-btn').disabled = false;
                document.getElementById('upload-btn').disabled = false;
                
                this.updateStatus('success', 'Connected to OpenAI successfully');
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
                    modelSelect.innerHTML += `<option value="${model.id}">${model.id}</option>`;
                });
    
                connectBtn.innerHTML = 'Connect to OpenRouter';
                connectBtn.classList.add('connected');
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'inline-block';
                
                document.getElementById('ollamavision-model').disabled = false;
                document.getElementById('paste-btn').disabled = false;
                document.getElementById('upload-btn').disabled = false;
                
                this.updateStatus('success', 'Connected to OpenRouter successfully');
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
                
                console.log('Attempting to connect to Ollama at:', ollamaUrl); // Debug log
                
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
                        modelSelect.innerHTML += `<option value="${model}">${model}</option>`;
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
        // Get the current response type and prompt before showing modal
        const currentUserPrompt = localStorage.getItem('ollamaVision_currentUserPrompt') || 'Default';
        const userPromptSelect = document.getElementById('user-prompt');
        
        // Set the dropdown to the last selected value
        if (userPromptSelect) {
            userPromptSelect.value = currentUserPrompt;
        }

        // Load the edited text if it exists, otherwise load the preset text
        const editedText = localStorage.getItem('ollamaVision_editedResponseText');
        if (editedText) {
            document.getElementById('responsePrompt').value = editedText;
        }
        
        $('#responseSettingsModal').modal('show');
    },

    loadPresetPrompt: function() {
        const preset = document.getElementById('promptPresets').value;
        if (!preset) return;
        
        // Save the current selection
        localStorage.setItem('ollamaVision_currentPreset', preset);
        
        // Check if it's a custom preset first
        const customPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
        const customPreset = customPresets.find(p => p.name === preset);
        
        if (customPreset) {
            // If it's a custom preset, use its prompt directly
            document.getElementById('responsePrompt').value = customPreset.prompt;
        } else {
            // If it's not a custom preset, it must be a default preset
            genericRequest('GetPresetPrompt', { preset: preset }, (response) => {
                if (response.success) {
                    document.getElementById('responsePrompt').value = response.prompt;
                } else {
                    console.error('Failed to load preset prompt:', response.error);
                    this.updateStatus('error', 'Failed to load preset prompt');
                }
            });
        }
    },

    saveResponseSettings: function() {
        // Store the current edited text
        const editedText = document.getElementById('responsePrompt').value;
        localStorage.setItem('ollamaVision_editedResponseText', editedText);
        
        // Just close the modal
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

            this.updateStatus('info', `Analyzing image with ${backendType}...`, true);

            // Get and process prompt
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
                    siteName: localStorage.getItem('ollamaVision_openrouterSite') || 'SwarmUI',
                    ollamaUrl: backendType === 'ollama' ? 
                        `http://${localStorage.getItem('ollamaVision_host') || 'localhost'}:${localStorage.getItem('ollamaVision_port') || '11434'}` : ''
                }, backendType);
                genericRequest('StreamAnalyzeImageAsync', filteredParams, (data) => resolve(data), (error) => reject(error));
            });

            if (response.success) {
                if (!response.response || response.response.trim().toLowerCase() === "null") {
                    this.updateStatus('error', "The LLM has censored you or rate limited you. Try again or edit your prompt and check your image.");
                    return;
                }

                // Update response display
                responseText.value = response.response;
                this.storeOriginalResponse(response.response);
                responseText.style.display = 'block';
                streamingResponse.style.display = 'none';
                
                // Enable send to prompt button and update history
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

    updateStatus: function(type, message, showSpinner = false) {
        // Determine which status bar to update based on active modal
        let statusElement, spinnerElement, statusTextElement;
        
        if (document.getElementById('storyTimeModal')?.classList.contains('show')) {
            statusElement = document.getElementById('story-status');
            spinnerElement = document.getElementById('story-spinner');
            statusTextElement = document.getElementById('story-status-text');
        } else if (document.getElementById('fusionModal')?.classList.contains('show')) {
            statusElement = document.getElementById('fusion-status');
            spinnerElement = document.getElementById('fusion-spinner');
            statusTextElement = document.getElementById('fusion-status-text');
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

        // Only auto-hide success messages after 5 seconds
        // Keep error messages visible until next action
        // Keep info/loading messages visible until explicitly changed
        if (type === 'success') {
            setTimeout(() => {
                if (statusElement.classList.contains('alert-success')) {
                    statusElement.style.display = 'none';
                }
            }, 5000);
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
                                                style="width: auto; min-width: 200px; padding: 6px 12px; border: 2px solid var(--border-color); background-color: var(--input-background-color);" 
                                                onchange="ollamaVision.toggleBackendSettings()">
                                            <option value="ollama">Ollama</option>
                                            <option value="openai">OpenAI</option>
                                            <option value="openrouter">OpenRouter</option>
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
        const showDefaultPresets = localStorage.getItem('ollamaVision_showDefaultPresets') !== 'false';
        const compressImages = localStorage.getItem('ollamaVision_compressImages') === 'true';
                
        document.getElementById('autoUnloadModel').checked = autoUnload;
        document.getElementById('showAllModels').checked = showAllModels;
        document.getElementById('ollamaHost').value = host;
        document.getElementById('ollamaPort').value = port;
        document.getElementById('backend-type').value = backendType;
        document.getElementById('openai-key').value = openaiKey;
        document.getElementById('showDefaultPresets').checked = showDefaultPresets;
        document.getElementById('openrouter-key').value = localStorage.getItem('ollamaVision_openrouterKey') || '';
        document.getElementById('openrouter-site').value = localStorage.getItem('ollamaVision_openrouterSite') || '';
        document.getElementById('compressImages').checked = compressImages;

        // Show/hide appropriate settings
        this.toggleBackendSettings();
        
        modal.show();
    },

    toggleBackendSettings: function() {
        const backendType = document.getElementById('backend-type').value;
        const ollamaConnectionSettings = document.getElementById('ollama-connection-settings');
        const openaiSettings = document.getElementById('openai-settings');
        const openrouterSettings = document.getElementById('openrouter-settings');
        const connectBtn = document.getElementById('connect-btn');
        
        if (backendType === 'ollama') {
            ollamaConnectionSettings.style.display = 'block';
            openaiSettings.style.display = 'none';
            openrouterSettings.style.display = 'none';
        } else if (backendType === 'openai') {
            ollamaConnectionSettings.style.display = 'none';
            openaiSettings.style.display = 'block';
            openrouterSettings.style.display = 'none';
        } else if (backendType === 'openrouter') {
            ollamaConnectionSettings.style.display = 'none';
            openaiSettings.style.display = 'none';
            openrouterSettings.style.display = 'block';
        }
        
        // Update connect button text
        connectBtn.innerHTML = `Connect to ${backendType === 'openai' ? 'OpenAI' : backendType === 'openrouter' ? 'OpenRouter' : 'Ollama'}`;
    },

    saveSettings: function() {
        const autoUnload = document.getElementById('autoUnloadModel').checked;
        const showAllModels = document.getElementById('showAllModels').checked;
        const showDefaultPresets = document.getElementById('showDefaultPresets').checked;
        const host = document.getElementById('ollamaHost').value.trim();
        const port = document.getElementById('ollamaPort').value.trim();
        const backendType = document.getElementById('backend-type').value;
        const openaiKey = document.getElementById('openai-key').value.trim();
        const openrouterKey = document.getElementById('openrouter-key').value.trim();
        const openrouterSite = document.getElementById('openrouter-site').value.trim();
        const compressImages = document.getElementById('compressImages').checked;
        
        // Validate required fields based on backend type
        if (backendType === 'openai' && !openaiKey) {
            this.updateStatus('error', 'OpenAI API key is required');
            return;
        } else if (backendType === 'openrouter' && !openrouterKey) {
            this.updateStatus('error', 'OpenRouter API key is required');
            return;
        } else if (backendType === 'ollama' && (!host || !port)) {
            this.updateStatus('error', 'Ollama host and port are required');
            return;
        }
        
        localStorage.setItem('ollamaVision_autoUnload', autoUnload);
        localStorage.setItem('ollamaVision_showAllModels', showAllModels);
        localStorage.setItem('ollamaVision_showDefaultPresets', showDefaultPresets);
        localStorage.setItem('ollamaVision_host', host);
        localStorage.setItem('ollamaVision_port', port);
        localStorage.setItem('ollamaVision_backendType', backendType);
        localStorage.setItem('ollamaVision_openaiKey', openaiKey);
        localStorage.setItem('ollamaVision_openrouterKey', openrouterKey);
        localStorage.setItem('ollamaVision_openrouterSite', openrouterSite);
        localStorage.setItem('ollamaVision_compressImages', compressImages);
        
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
            this.updateStatus('error', 'Error unloading model: ' + error);
            console.error('Unload model error:', error);
        }
    },

    getTemplate: function() {
        return `
            <style>
                /* Remove explicit colors and inherit from SwarmUI theme */
                .form-control, .form-select {
                    background-color: inherit;
                    border-color: inherit;
                    color: inherit;
                }

                .form-control:focus, .form-select:focus {
                    background-color: inherit;
                    color: inherit;
                }

                /* For dropdowns */
                .form-select option {
                    background-color: inherit;
                    color: inherit;
                }

                .form-select optgroup {
                    background-color: inherit;
                    color: inherit;
                }

                .basic-button {
                    font-size: 1.2rem !important;
                }
            </style>
            <!-- ... rest of template ... -->
        `;
    },

    initialize: function() {
        const container = document.createElement('div');
        container.innerHTML = this.getTemplate();
        document.getElementById('ollamavision-container').appendChild(container);
        
        // Update presets dropdown
        this.updatePresetsDropdown();
        
        // Set the default preset and load its prompt
        setTimeout(() => {
            const promptPresets = document.getElementById('promptPresets');
            if (promptPresets) {
                promptPresets.value = 'Default';
                // Trigger the preset load to populate the prompt text
                this.loadPresetPrompt();
            }
        }, 100); // Small delay to ensure DOM is ready
    },

    loadExistingPresets: function() {
        const select = document.getElementById('promptPresets');
        if (!select) {
            console.error('Presets select element not found');
            return;
        }

        // Find or create the User Presets optgroup
        let userPresetsGroup = select.querySelector('optgroup[label="User Presets"]');
        if (!userPresetsGroup) {
            userPresetsGroup = document.createElement('optgroup');
            userPresetsGroup.label = 'User Presets';
            select.appendChild(userPresetsGroup);
        }

        // Clear existing user presets
        userPresetsGroup.innerHTML = '';

        // Load and add all saved presets
        const customPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
        console.log('Found custom presets:', customPresets); // Debug log

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
        
        // Copy current prompt to the new preset modal and set placeholders
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

        // Get existing presets or initialize empty array
        let customPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
        
        // Check for duplicate names
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
        
        // Close the create preset modal and show success message
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

        // Clear existing user presets
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
        // Remove debug logs
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
            console.error('Preset manager modal not found');
            return;
        }
        
        // Add event listener for when preset manager modal is hidden
        presetManagerModal.addEventListener('hidden.bs.modal', () => {
            // Show the response settings modal again
            new bootstrap.Modal(responseModal).show();
        }, { once: true }); // Use once: true so the event listener is removed after it fires
        
        // Load the presets before showing the modal
        this.loadPresetManager();
        
        // Show the preset manager modal
        setTimeout(() => {
            const modal = new bootstrap.Modal(presetManagerModal);
            modal.show();
        }, 250);
    },

    loadPresetManager: function() {
        console.log('Loading preset manager...'); // Debug log
        
        const userList = document.getElementById('user-presets-list');
        
        if (!userList) {
            console.error('User preset list not found');
            return;
        }
        
        // Clear the list
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
                 data-preset="${preset.name}">
                <div class="d-flex align-items-center">
                    <span class="basic-button me-2" 
                          style="cursor: grab; padding: 4px 8px; min-width: 30px; text-align: center;"
                          title="Drag to reorder">
                        <i class="fas fa-grip-lines"></i>
                    </span>
                    <div class="auto-text">
                        <div class="fw-bold">${preset.name}</div>
                        <div class="small text-muted">${preset.prompt.substring(0, 100)}${preset.prompt.length > 100 ? '...' : ''}</div>
                    </div>
                </div>
                <button class="basic-button" 
                        onclick="ollamaVision.deleteUserPreset('${preset.name}')" 
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
        
        // Clear current options
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

        // Reset UI state
        connectBtn.disabled = false;
        connectBtn.innerHTML = `Connect to ${backendType === 'openai' ? 'OpenAI' : backendType === 'openrouter' ? 'OpenRouter' : 'Ollama'}`;
        connectBtn.classList.remove('connected');
        connectBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'none';
        
        // Disable controls
        modelSelect.disabled = true;
        modelSelect.innerHTML = '<option value="">Select a model...</option>';
        pasteBtn.disabled = true;
        uploadBtn.disabled = true;

        this.cleanup();
        this.updateStatus('info', `Disconnected from ${backendType === 'openai' ? 'OpenAI' : backendType === 'openrouter' ? 'OpenRouter' : 'Ollama'}`);
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
            
            // Clean up the paste listener and hidden input
            const ollamaVisionTab = document.getElementById('Utilities-OllamaVision-Tab');
            if (ollamaVisionTab && this.pasteHandler) {
                ollamaVisionTab.removeEventListener('paste', this.pasteHandler);
                // Remove the hidden input
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
        if (!document.getElementById('modelSettingsModal')) {
            document.body.insertAdjacentHTML('beforeend', modelSettingsModal);
        }

        const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
        
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

        // Load existing system prompt if it exists, but don't clear it if it doesn't
        const existingPrompt = localStorage.getItem('ollamaVision_systemPrompt');
        const systemPromptField = document.getElementById('modelSystemPrompt');
        if (existingPrompt) {
            systemPromptField.value = existingPrompt;
        }
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

            // Handle system prompt - only save if changed
            const systemPrompt = document.getElementById('modelSystemPrompt').value;
            if (systemPrompt && systemPrompt.trim()) {
                localStorage.setItem('ollamaVision_systemPrompt', systemPrompt.trim());
            } else if (systemPrompt === '') {  // Only remove if explicitly cleared by user
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

            // Clear system prompt
            document.getElementById('modelSystemPrompt').value = null;
            localStorage.removeItem('ollamaVision_systemPrompt');

            // Save common defaults to localStorage
            localStorage.setItem('ollamaVision_temperature', '0.8');
            localStorage.setItem('ollamaVision_maxTokens', '-1');
            localStorage.setItem('ollamaVision_topP', '0.7');

            // Save backend-specific defaults
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
            else { // ollama
                localStorage.setItem('ollamaVision_seed', '-1');
                localStorage.setItem('ollamaVision_topK', '40');
                localStorage.setItem('ollamaVision_repeatPenalty', '1.1');
            }

            this.updateStatus('success', 'Settings reset to defaults');
        } catch (error) {
            this.updateStatus('error', 'Failed to reset settings: ' + error.message);
        }
    },

    // Add this new function to initialize the preview area
    initializePreviewArea: function() {
        const previewArea = document.getElementById('image-preview-area');
        const previewImage = document.getElementById('preview-image');
        const imageInfo = document.getElementById('image-info');
        
        // Set up placeholder image using base64 data
        previewImage.src = PLACEHOLDER_IMAGE;
        previewImage.style.display = 'block';
        imageInfo.textContent = '';  // Remove the text since it's in the SVG now
        
        // Add drag and drop event listeners
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

        // Initialize history
        this.updateHistoryUI();
    },

    // Add these new methods to the ollamaVision object
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
            console.error('Error adding to history:', error);
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
                        <p class="card-text" style="max-height: 80px; overflow-y: auto; font-size: 1.2rem;">${item.response}</p>
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
                console.error('Error loading image:', error);
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
                    element.remove();  // Just remove the element instead of updating entire history UI
                }, 300);
            }
        } catch (error) {
            console.error('Error deleting history item:', error);
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
                console.error('Error clearing history:', error);
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
            console.error('Error using history item:', error);
            this.updateStatus('error', 'Error restoring history item: ' + error.message);
        }
    },

    // Add this function to the ollamaVision object
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
        
        // Set the dropdown to the last selected value
        if (prependSelect && lastSelectedPrepend) {
            prependSelect.value = lastSelectedPrepend;
            // Load either edited text or original prepend text
            const editedPrependText = localStorage.getItem('ollamaVision_editedPrependText');
            if (editedPrependText) {
                document.getElementById('prependText').value = editedPrependText;
                // Initialize counter with edited text
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
            console.error('User prepends list not found');
            return;
        }
        
        // Clear the list
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
                 data-prepend="${prepend.name}">
                <div class="d-flex align-items-center">
                    <span class="basic-button me-2" 
                          style="cursor: grab; padding: 4px 8px; min-width: 30px; text-align: center;"
                          title="Drag to reorder">
                        <i class="fas fa-grip-lines"></i>
                    </span>
                    <div class="auto-text">
                        <div class="fw-bold">${prepend.name}</div>
                        <div class="small text-muted">${prepend.text.substring(0, 100)}${prepend.text.length > 100 ? '...' : ''}</div>
                    </div>
                </div>
                <button class="basic-button" 
                        onclick="ollamaVision.deletePrepend('${prepend.name}')" 
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
            // Clear any edited text
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

    // Add this function to handle showing the Prepends Manager modal
    showPrependsManager: function() {
        $('#prependManagerModal').modal('hide');
        
        // Get the last selected prepend
        const lastSelectedPrepend = localStorage.getItem('ollamaVision_currentPrepend');
        
        // Load the prepends before showing the modal
        this.loadPrependsManager();
        
        setTimeout(() => {
            const modal = new bootstrap.Modal(document.getElementById('managePrependsModal'));
            modal.show();
        }, 250);
    },

    // Add this function to handle closing the manage prepends modal
    closePrependsManager: function() {
        $('#managePrependsModal').modal('hide');
        setTimeout(() => {
            $('#prependManagerModal').modal('show');
        }, 250);
    },

    // Add this function to handle character counting
    updateCharacterCount: function(textareaId, counterId, maxLength = 1000) {
        const textarea = document.getElementById(textareaId);
        const counter = document.getElementById(counterId);
        const remaining = maxLength - textarea.value.length;
        counter.textContent = `${remaining} characters remaining`;
        
        // Add warning color if close to limit
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

    // Reset the response to the original
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
                                                style="width: auto; min-width: 300px; background-color: inherit; color: inherit; font-size: 1.2rem; border: 2px solid var(--border-color); padding: 8px 12px;" 
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

        // Reset the combine button
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
                    Logs.Debug("Response parsing failed, using original text");
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
                                            onclick="ollamaVision.showFusionModal(); $('#llmToysModal').modal('hide');" 
                                            style="font-size: 1.2rem;">
                                        Image Fusion
                                    </button>
                                    <button class="basic-button" 
                                            onclick="ollamaVision.showStoryTimeModal(); $('#llmToysModal').modal('hide');" 
                                            style="font-size: 1.2rem;">
                                        Story Time
                                    </button>
                                    <button class="basic-button" 
                                            onclick="ollamaVision.showCharacterCreatorModal(); $('#llmToysModal').modal('hide');" 
                                            style="font-size: 1.2rem;">
                                        Character Creator
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
                if (apiKey?.startsWith('sk-or-v1-free')) {
                    console.warn('Using OpenRouter free tier - may experience rate limits and inconsistent responses');
                }
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
        
        if (backendType === 'ollama' && autoUnload) {
            try {
                await new Promise((resolve, reject) => {
                    genericRequest('UnloadModelAsync', 
                        { 
                            model: model,
                            ollamaUrl: `http://${localStorage.getItem('ollamaVision_host') || 'localhost'}:${localStorage.getItem('ollamaVision_port') || '11434'}`,
                            keep_alive: 0  // Add this to ensure immediate unloading
                        },
                        (data) => resolve(data),
                        (error) => reject(error)
                    );
                });
                console.log(`Model ${model} unloaded successfully`);
            } catch (error) {
                console.error(`Failed to unload model: ${error}`);
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
                                                💾 Save Character
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
                                            <div class="form-floating">
                                                <label for="character-name" style="color: var(--bs-light); z-index: 3; top: -12px; transform: scale(1.00);">Name</label>
                                                <input type="text" class="form-control bg-dark modal_text_extra" 
                                                       id="character-name" placeholder="Name (optional)" 
                                                       style="background: inherit; color: inherit;">
                                                <button class="basic-button lock-btn" data-locked="false" style="width: 50px; height: 38px;">
                                                    🎲
                                                </button>
                                            </div>

                                            <!-- Sex Dropdown -->
                                            <div class="form-floating">
                                                <label for="character-sex" style="color: var(--bs-light); z-index: 3; top: -12px; transform: scale(1.00);">Sex</label>
                                                <input type="text" list="sex-options" class="form-select bg-dark modal_text_extra" id="character-sex" style="background: inherit; color: inherit;">
                                                <datalist id="sex-options">
                                                    <option value="Random"></option>
                                                    <option value="Male"></option>
                                                    <option value="Female"></option>
                                                </datalist>
                                                <button class="basic-button lock-btn" data-locked="false" style="width: 50px; height: 38px;">
                                                    🎲
                                                </button>
                                            </div>

                                            <!-- Species Dropdown -->
                                            <div class="form-floating">
                                                <label for="character-species" style="color: var(--bs-light); z-index: 3; top: -12px; transform: scale(1.00);">Species</label>
                                                <input type="text" list="species-options" class="form-select bg-dark modal_text_extra" id="character-species" style="background: inherit; color: inherit;">
                                                <datalist id="species-options">
                                                    <option value="Random"></option>
                                                    <option value="Alien"></option>
                                                    <option value="Android"></option>
                                                    <option value="Angel"></option>
                                                    <option value="Beastkin"></option>
                                                    <option value="Cyborg"></option>
                                                    <option value="Dark Elf"></option>
                                                    <option value="Demon"></option>
                                                    <option value="Djinn"></option>
                                                    <option value="Dragonborn"></option>
                                                    <option value="Dwarf"></option>
                                                    <option value="Elf"></option>
                                                    <option value="Fairy"></option>
                                                    <option value="Ghost"></option>
                                                    <option value="Ghoul"></option>
                                                    <option value="Goblin"></option>
                                                    <option value="Golem"></option>
                                                    <option value="High Elf"></option>
                                                    <option value="Human"></option>
                                                    <option value="Lizardfolk"></option>
                                                    <option value="Merfolk"></option>
                                                    <option value="Naga"></option>
                                                    <option value="Orc"></option>
                                                    <option value="Slimefolk"></option>
                                                    <option value="Undead"></option>
                                                    <option value="Vampire"></option>
                                                    <option value="Werewolf"></option>
                                                </datalist>
                                                <button class="basic-button lock-btn" data-locked="false" style="width: 50px; height: 38px;">
                                                    🎲
                                                </button>
                                            </div>

                                            <!-- Setting Dropdown -->
                                            <div class="form-floating">
                                                <label for="character-setting" style="color: var(--bs-light); z-index: 3; top: -12px; transform: scale(1.00);">Setting</label>
                                                <input type="text" list="setting-options" class="form-select bg-dark modal_text_extra" id="character-setting" style="background: inherit; color: inherit;">
                                                <datalist id="setting-options">
                                                    <option value="Random"></option>
                                                    <option value="Cyberpunk"></option>
                                                    <option value="Digital/Cyberspace"></option>
                                                    <option value="Dreamworld"></option>
                                                    <option value="Dystopian"></option>
                                                    <option value="Fantasy"></option>
                                                    <option value="Feudal Japan"></option>
                                                    <option value="Lovecraftian Horror"></option>
                                                    <option value="Medieval"></option>
                                                    <option value="Megacity"></option>
                                                    <option value="Modern"></option>
                                                    <option value="Mythological"></option>
                                                    <option value="Pirate World"></option>
                                                    <option value="Post-Apocalyptic"></option>
                                                    <option value="Sci-Fi"></option>
                                                    <option value="Space Opera"></option>
                                                    <option value="Steampunk"></option>
                                                    <option value="Superhero World"></option>
                                                    <option value="Underwater Civilization"></option>
                                                    <option value="Urban Fantasy"></option>
                                                    <option value="Western"></option>
                                                    <option value="Feudal Japan"></option>
                                                    <option value="Space Opera"></option>
                                                </datalist>
                                                <button class="basic-button lock-btn" data-locked="false" style="width: 50px; height: 38px;">
                                                    🎲
                                                </button>
                                            </div>

                                            <!-- Alignment Dropdown -->
                                            <div class="form-floating">
                                                <label for="character-alignment" style="color: var(--bs-light); z-index: 3; top: -12px; transform: scale(1.00);">Alignment</label>
                                                <input type="text" list="alignment-options" class="form-select bg-dark modal_text_extra" id="character-alignment" style="background: inherit; color: inherit;">
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
                                                <button class="basic-button lock-btn" data-locked="false" style="width: 50px; height: 38px;">
                                                    🎲
                                                </button>
                                            </div>

                                            <!-- Class/Role Dropdown -->
                                            <div class="form-floating">
                                                <label for="character-class" style="color: var(--bs-light); z-index: 3; top: -12px; transform: scale(1.00);">Class/Role</label>
                                                <input type="text" list="class-options" class="form-select bg-dark modal_text_extra" id="character-class" style="background: inherit; color: inherit;">
                                                <datalist id="class-options">
                                                    <option value="Random"></option>
                                                    <option value="Archer"></option>
                                                    <option value="Assassin"></option>
                                                    <option value="Barbarian"></option>
                                                    <option value="Bard"></option>
                                                    <option value="Beastmaster"></option>
                                                    <option value="Brewmaster"></option>
                                                    <option value="Cleric"></option>
                                                    <option value="Diplomat"></option>
                                                    <option value="Druid"></option>
                                                    <option value="Healer"></option>
                                                    <option value="Hunter"></option>
                                                    <option value="Knight"></option>
                                                    <option value="Mage"></option>
                                                    <option value="Paladin"></option>
                                                    <option value="Performer"></option>
                                                    <option value="Ranger"></option>
                                                    <option value="Rogue"></option>
                                                    <option value="Shaman"></option>
                                                    <option value="Sorcerer"></option>
                                                    <option value="Spy"></option>
                                                    <option value="Thief"></option>
                                                    <option value="Warlock"></option>
                                                    <option value="Warrior"></option>
                                                    <option value="Wizard"></option>
                                                </datalist>
                                                <button class="basic-button lock-btn" data-locked="false" style="width: 50px; height: 38px;">
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
        inputs.forEach(input => {
            const element = document.getElementById(`character-${input}`);
            const lockBtn = element.parentElement.querySelector('.lock-btn');
            
            if (!lockBtn || lockBtn.dataset.locked !== 'true') {
                if (input === 'name') {
                    element.value = ''; // Clear name for random generation
                } else {
                    // Get all options from the corresponding datalist
                    const datalist = document.getElementById(`${input}-options`);
                    const options = Array.from(datalist.options);
                    // Select a random option (excluding the first "Random" option)
                    const randomOption = options[Math.floor(Math.random() * (options.length - 1)) + 1];
                    element.value = randomOption.value;
                }
            } else if (element.dataset.lockedValue) {
                // Restore the locked value
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
Output Format and Structure:

Strictly follow the provided structure using bold section titles and clear formatting.
Each character must feel entirely unique, with no reused details or repeated ideas.
Character Creation Rules:

Overview: Each character must have a unique name, alignment, traits, and backstory tailored to the user's inputs. For randomly selected attributes, generate fresh and imaginative combinations each time.
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

When generating random selections, only choose from these valid options:

Sex Options: Male, Female

Species Options: Human, Elf, Dwarf, Goblin, Golem, Android, Alien

Setting Options: Fantasy, Urban Fantasy, Sci-Fi, Cyberpunk, Post-Apocalyptic, Modern

Alignment Options: Lawful Good, Neutral Good, Chaotic Good, Lawful Neutral, True Neutral, Chaotic Neutral, Lawful Evil, Neutral Evil, Chaotic Evil

Class/Role Options: Warrior, Paladin, Barbarian, Knight, Mage, Wizard, Sorcerer, Warlock, Rogue, Thief, Assassin, Spy, Healer, Cleric, Druid, Shaman, Ranger, Hunter, Beastmaster, Archer, Bard, Performer, Diplomat

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
- Height & Build: [Tall, short, muscular, thin, etc.]  
- Skin, Hair, and Eyes: [Describe colors, texture, or unique features]  
- Clothing & Accessories: [What the character wears and notable items]  
- Weapons or Tools: [If applicable, describe what they carry]  

**Abilities & Skills:**  
- [List 3-4 abilities that match their class/role]
- [Include both combat and non-combat abilities]
- [Ensure abilities fit the setting and species]
- [Add unique or signature abilities]

**Backstory:**  
[Write a rich, engaging history that integrates the character's setting, role, and alignment]  
[Include motivations, conflicts, relationships, and major life events]  
[Explain how they came to their class/role]  
[The backstory should feel natural and immersive]  

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
    saveCharacter: function() {
        const characterText = document.getElementById('character-output').textContent;
        if (!characterText) {
            this.updateStatus('error', 'No character to save');
            return;
        }

        // Extract character name from the response
        let characterName = 'character'; // default fallback
        const nameMatch = characterText.match(/Name:\s*([^\n\r]*)/);
        if (nameMatch && nameMatch[1]) {
            // Clean the name to be filesystem-friendly
            characterName = nameMatch[1].trim()
                .replace(/[^a-zA-Z0-9]/g, '_') // Replace non-alphanumeric chars with underscore
                .replace(/_+/g, '_')           // Replace multiple underscores with single
                .replace(/^_|_$/g, '');        // Remove leading/trailing underscores
        }
        
        // Create a blob with the character text
        const blob = new Blob([characterText], { type: 'text/plain' });
        
        // Create a temporary link element
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        
        // Generate filename with character name and timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `${characterName}_${timestamp}.txt`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        
        this.updateStatus('success', 'Character saved successfully');
    },

    updateCharacterStatus: function(type, message, showSpinner = false) {
        const statusBar = document.getElementById('character-status');
        const statusText = document.getElementById('character-status-text');
        const spinner = document.getElementById('character-spinner');
        
        if (statusBar && statusText) {
            statusBar.style.display = 'block';
            statusBar.className = `alert alert-${type} mt-2 mx-3`;
            statusText.textContent = message;
            
            // Only show spinner for info messages
            if (spinner) {
                spinner.style.display = (type === 'info' && showSpinner) ? 'inline-block' : 'none';
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
            this.updateStatus('error', 'No character description found');
            return;
        }

        // Look for the AI Image Prompt section
        const promptMatch = characterText.match(/AI Image Prompt:[\s\n]*["\*]*([^"]*)["\*]*/i);
        if (promptMatch && promptMatch[1]) {
            // Clean up the extracted prompt
            let imagePrompt = promptMatch[1].trim();
            
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
            this.updateStatus('error', 'No image prompt found in character description');
        }
    }
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
            // Clear any edited text
            localStorage.removeItem('ollamaVision_editedResponseText');
        }
    }
});

// Add model validation
const validOpenAIModels = [
    'gpt-4-vision-preview',
    'gpt-4-1106-vision-preview',
    'gpt-4-turbo-preview'
];

// In your analyze function
if (backendType === 'openai' && !validOpenAIModels.includes(model)) {
    throw new Error('Invalid OpenAI model selected');
}

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
        case 'openai':
            return {
                ...commonParams,
                apiKey: params.apiKey,
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
