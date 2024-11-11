document.addEventListener("DOMContentLoaded", function () {
    function checkForOllamaVision() {
        const utilities = document.getElementById('utilities_tab');
        if (utilities) {
            addOllamaVisionTab(utilities);
        } else {
            console.log('Utilities tab not found, something has gone very wrong!');
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
                    <span class="translate">Ollama Vision Analysis</span>
                    <div class="connection-status">
                        <div class="d-flex align-items-center gap-2">
                            <button class="basic-button" onclick="ollamaVision.connect()" id="connect-btn">
                                Connect to Ollama
                            </button>
                            <button class="basic-button" onclick="ollamaVision.showSettings()" id="settings-btn">
                                <i class="fas fa-cog"></i> Settings
                            </button>
                        </div>
                        <div class="mt-2">
                            <select id="ollamavision-model" class="form-select" 
                                    style="width: auto; background-color: inherit; color: inherit;" disabled>
                                <option value="">Select a model...</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="container-fluid">
                        <div class="row justify-content-center">
                            <div class="col-10">
                                <div class="row mb-3">
                                    <div class="col-md-6 mx-auto text-center">
                                        <div id="image-preview-area" style="display: none;">
                                            <div class="card">
                                                <div class="card-body">
                                                    <img id="preview-image" class="img-fluid" src="" alt="Preview" style="max-width: 512px; max-height: 512px; object-fit: contain;">
                                                    <div id="image-info" class="mt-2 text-muted"></div>
                                                    <button class="basic-button mt-3" 
                                                            onclick="ollamaVision.analyze()" 
                                                            id="analyze-btn" 
                                                            disabled>
                                                        <span>ANALYZE IMAGE</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <label class="form-label translate">Image Source</label>
                                                <button class="basic-button" 
                                                        onclick="ollamaVision.showResponseSettings()" 
                                                        id="response-settings-btn">
                                                    <i class="fas fa-cog"></i> Configure Response Type
                                                </button>
                                            </div>
                                            <div class="d-grid gap-2">
                                                <button class="basic-button d-flex align-items-center justify-content-center" 
                                                        onclick="ollamaVision.takeScreenshot()" 
                                                        disabled 
                                                        id="screenshot-btn"
                                                        style="transition: all 0.3s ease;">
                                                    <i class="fas fa-camera me-2"></i>
                                                    Click to paste with CTRL+V
                                                </button>
                                                <button class="basic-button d-flex align-items-center justify-content-center" 
                                                        onclick="ollamaVision.uploadImage()" 
                                                        disabled 
                                                        id="upload-btn"
                                                        style="transition: all 0.3s ease;">
                                                    <i class="fas fa-upload me-2"></i>
                                                    Upload Image File
                                                </button>
                                            </div>
                                        </div>
                                        <div id="analysis-response" style="display: none;">
                                            <div class="card">
                                                <div class="card-header">
                                                    Analysis Result
                                                </div>
                                                <div class="card-body">
                                                    <p id="response-text" class="mb-0"></p>
                                                </div>
                                            </div>
                                            <div class="d-flex justify-content-end mt-3">
                                                <button class="basic-button" 
                                                        onclick="ollamaVision.sendToPrompt()" 
                                                        id="send-to-prompt-btn" 
                                                        disabled>
                                                    Send to Prompt
                                                </button>
                                            </div>
                                        </div>
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
                            <span id="status-text" style="font-size: 1.2em;"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Response Settings Modal -->
        <div class="modal fade" id="responseSettingsModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Response Type Settings</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <label for="promptPresets" class="form-label">Preset Prompts</label>
                                <div class="btn-group">
                                    <button class="basic-button" onclick="ollamaVision.showCreatePreset()">
                                        Create Custom Preset
                                    </button>
                                    <button class="basic-button" onclick="ollamaVision.showPresetManager()">
                                        Manage Presets
                                    </button>
                                </div>
                            </div>
                            <select class="form-select" id="promptPresets" onchange="ollamaVision.loadPresetPrompt()">
                                <optgroup label="Default Presets">
                                    <option value="">Select a preset...</option>
                                    <option value="Default">Default</option>
                                    <option value="Detailed Analysis">Detailed Analysis</option>
                                    <option value="Simple Description">Simple Description</option>
                                    <option value="Artistic Style">Artistic Style</option>
                                    <option value="Technical Details">Technical Details</option>
                                    <option value="Facial Features">Facial Features</option>
                                    <option value="Color Palette">Color Palette</option>
                                </optgroup>
                                <optgroup label="User Presets" id="user-presets">
                                    <!-- User presets will be loaded here -->
                                </optgroup>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="responsePrompt" class="form-label">Custom Response Prompt</label>
                            <textarea class="form-control" id="responsePrompt" rows="3"></textarea>
                            <small class="form-text text-muted">Enter the prompt that will be used to generate image descriptions.</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="basic-button" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="basic-button" onclick="ollamaVision.saveResponseSettings()">Save</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add new Create Preset Modal -->
        <div class="modal fade" id="createPresetModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Create Custom Preset</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="presetName" class="form-label">Preset Name</label>
                            <input type="text" class="form-control" id="presetName" placeholder="Enter preset name">
                        </div>
                        <div class="mb-3">
                            <label for="presetPrompt" class="form-label">Preset Prompt</label>
                            <textarea class="form-control" id="presetPrompt" rows="3" placeholder="Enter the prompt for this preset"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="basic-button" 
                                onclick="$('#createPresetModal').modal('hide'); ollamaVision.showResponseSettings()">
                            Cancel
                        </button>
                        <button type="button" class="basic-button" onclick="ollamaVision.saveNewPreset()">Save Preset</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Preset Manager Modal -->
        <div class="modal fade" id="presetManagerModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Manage Presets</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Default Presets</label>
                            <div class="list-group" id="default-presets-list">
                                <!-- Default presets will be loaded here -->
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">User Presets</label>
                            <div class="list-group" id="user-presets-list">
                                <!-- User presets will be loaded here -->
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    tabContentContainer.insertAdjacentHTML('beforeend', ollamaVisionTabContent);
    
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

            // Set default preset and load its prompt
            select.value = 'Default';
            window.ollamaVision.loadPresetPrompt();
        }
    }, 100); // Small delay to ensure DOM is ready
}

window.ollamaVision = {
    connect: async function() {
        try {
            const connectBtn = document.getElementById('connect-btn');
            connectBtn.disabled = true;
            connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
            
            const showAllModels = localStorage.getItem('ollamaVision_showAllModels') === 'true';
            
            const response = await new Promise((resolve, reject) => {
                genericRequest('ConnectToOllamaAsync', 
                    { showAllModels: showAllModels },
                    (data) => resolve(data),
                    (error) => reject(error)
                );
            });

            if (response.success) {
                connectBtn.innerHTML = 'Connected';
                connectBtn.classList.add('connected');
                
                document.getElementById('ollamavision-model').disabled = false;
                document.getElementById('screenshot-btn').disabled = false;
                document.getElementById('upload-btn').disabled = false;
                
                const modelSelect = document.getElementById('ollamavision-model');
                modelSelect.innerHTML = '<option value="">Select a model...</option>';
                response.models.forEach(model => {
                    modelSelect.innerHTML += `<option value="${model}">${model}</option>`;
                });
                
                this.updateStatus('success', 'Connected to Ollama successfully');
            } else {
                connectBtn.disabled = false;
                connectBtn.innerHTML = 'Connect to Ollama';
                connectBtn.classList.remove('connected');
                this.updateStatus('error', 'Failed to connect: ' + response.error);
            }
        } catch (error) {
            this.updateStatus('error', 'Error connecting to Ollama: ' + error);
        }
    },

    showResponseSettings: function() {
        try {
            genericRequest('GetResponsePrompt', {}, 
                data => {
                    if (data.success) {
                        document.getElementById('responsePrompt').value = data.prompt;
                        new bootstrap.Modal(document.getElementById('responseSettingsModal')).show();
                    } else {
                        console.error('Failed to load response settings:', data.error);
                        this.updateStatus('error', 'Failed to load response settings: ' + data.error);
                    }
                },
                error => {
                    console.error('Request failed:', error);
                    this.updateStatus('error', 'Failed to load response settings: ' + error);
                }
            );
        } catch (error) {
            console.error('Error in showResponseSettings:', error);
            this.updateStatus('error', 'Error showing settings: ' + error);
        }
    },

    loadPresetPrompt: function() {
        const preset = document.getElementById('promptPresets').value;
        if (!preset) return;
        
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
        const prompt = document.getElementById('responsePrompt').value;
        genericRequest('SaveResponsePrompt', { prompt: prompt }, data => {
            if (data.success) {
                this.updateStatus('success', 'Response settings saved successfully');
                bootstrap.Modal.getInstance(document.getElementById('responseSettingsModal')).hide();
            } else {
                this.updateStatus('error', 'Failed to save response settings');
            }
        });
    },

    takeScreenshot: async function() {
        try {
            this.updateStatus('info', 'Opening Snip Tool...');
            
            // Set up paste event listener first
            const handlePaste = (e) => {
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
                    document.removeEventListener('paste', handlePaste);
                    this.updateStatus('success', 'Screenshot captured successfully');
                } else {
                    this.updateStatus('error', 'No image found in clipboard');
                }
            };

            document.addEventListener('paste', handlePaste.bind(this));

            // Create a hidden input to focus
            const input = document.createElement('input');
            input.style.position = 'fixed';
            input.style.top = '-100px';
            document.body.appendChild(input);
            input.focus();

            // Trigger Win+Shift+S using keyboard events
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Meta',
                code: 'MetaLeft',
                metaKey: true,
                bubbles: true
            }));
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Shift',
                code: 'ShiftLeft',
                shiftKey: true,
                bubbles: true
            }));
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 's',
                code: 'KeyS',
                bubbles: true
            }));

            // Clean up the hidden input
            setTimeout(() => {
                document.body.removeChild(input);
            }, 100);
            
            this.updateStatus('info', 'Now press CTRL+V to paste your image for analyzing...');
            
        } catch (error) {
            this.updateStatus('error', 'Error handling screenshot: ' + error);
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
            this.displayImagePreview(file.name || 'screenshot.png', dataUrl);
            this.updateStatus('success', 'Image loaded successfully');
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
        
        previewArea.style.display = 'block';
        previewImage.src = dataUrl;
        imageInfo.textContent = `Image: ${imageName}`;
        previewImage.dataset.imageData = dataUrl;
        analyzeBtn.disabled = false;
        sendToPromptBtn.disabled = true;
        
        // Clear previous response when new image is loaded
        responseArea.style.display = 'none';
    },

    sendToPrompt: function() {
        const responseText = document.getElementById('response-text');
        if (responseText && responseText.textContent) {
            document.getElementById('text2imagetabbutton').click();
            const generatePromptTextarea = document.getElementById("input_prompt");
            if (generatePromptTextarea) {
                generatePromptTextarea.value = responseText.textContent;
                generatePromptTextarea.dispatchEvent(new Event('input'));
            }
        }
    },

    analyze: async function() {
        const analyzeBtn = document.getElementById('analyze-btn');
        const model = document.getElementById('ollamavision-model').value;
        const previewImage = document.getElementById('preview-image');
        const imageData = previewImage.dataset.imageData;
        const responseArea = document.getElementById('analysis-response');
        const responseText = document.getElementById('response-text');
        const sendToPromptBtn = document.getElementById('send-to-prompt-btn');
        
        if (!model || !imageData) {
            this.updateStatus('error', !model ? 'Please select a model first' : 'No image data available');
            return;
        }

        try {
            analyzeBtn.disabled = true;
            this.updateStatus('info', 'Image sent, waiting for response from Ollama...', true);
            sendToPromptBtn.disabled = true;

            // Use a Promise with genericRequest
            const response = await new Promise((resolve, reject) => {
                genericRequest('AnalyzeImageAsync', 
                    {
                        imageData: imageData,
                        model: model
                    },
                    (data) => resolve(data),
                    (error) => reject(error)
                );
            });

            if (response.success) {
                this.updateStatus('success', 'Image description complete!');
                responseArea.style.display = 'block';
                responseText.textContent = response.response;
                sendToPromptBtn.disabled = false;

                // Check if auto-unload is enabled
                const autoUnload = localStorage.getItem('ollamaVision_autoUnload') === 'true';
                if (autoUnload) {
                    await this.unloadModel(model);
                }
            } else {
                this.updateStatus('error', 'Analysis failed: ' + response.error);
                responseArea.style.display = 'none';
                sendToPromptBtn.disabled = true;
            }
        } catch (error) {
            this.updateStatus('error', 'Error analyzing image: ' + error);
            responseArea.style.display = 'none';
            sendToPromptBtn.disabled = true;
        } finally {
            analyzeBtn.disabled = false;
        }
    },

    updateStatus: function(type, message, showSpinner = false) {
        const statusArea = document.getElementById('analysis-status');
        const statusText = document.getElementById('status-text');
        const spinner = document.getElementById('analysis-spinner');
        
        statusArea.style.display = 'block';
        statusText.textContent = message;
        spinner.style.display = showSpinner ? 'block' : 'none';
        
        statusArea.className = 'alert mt-3 text-center ';
        switch(type) {
            case 'error':
                statusArea.className += 'alert-danger';
                break;
            case 'success':
                statusArea.className += 'alert-success';
                break;
            default:
                statusArea.className += 'alert-info';
        }
    },

    showSettings: function() {
        const settingsHtml = `
            <div class="modal fade" id="ollamaSettingsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">OllamaVision Settings</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" id="autoUnloadModel">
                                <label class="form-check-label" for="autoUnloadModel">
                                    Automatically unload model after analysis
                                </label>
                                <small class="form-text text-muted d-block mt-1">
                                    This will free up memory but may increase load time for the next analysis
                                </small>
                            </div>
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" id="showAllModels">
                                <label class="form-check-label" for="showAllModels">
                                    Show all Ollama models
                                </label>
                                <small class="form-text text-muted d-block mt-1">
                                    By default, only models with 'vision' or 'llava' in their names are shown. 
                                    Enable this to show all available models.
                                </small>
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
        const autoUnload = localStorage.getItem('ollamaVision_autoUnload') === 'true';
        const showAllModels = localStorage.getItem('ollamaVision_showAllModels') === 'true';
        
        document.getElementById('autoUnloadModel').checked = autoUnload;
        document.getElementById('showAllModels').checked = showAllModels;
        modal.show();
    },

    saveSettings: function() {
        const autoUnload = document.getElementById('autoUnloadModel').checked;
        const showAllModels = document.getElementById('showAllModels').checked;
        
        localStorage.setItem('ollamaVision_autoUnload', autoUnload);
        localStorage.setItem('ollamaVision_showAllModels', showAllModels);
        
        bootstrap.Modal.getInstance(document.getElementById('ollamaSettingsModal')).hide();
        this.updateStatus('success', 'Settings saved successfully');
        
        // Refresh model list if connected
        const connectBtn = document.getElementById('connect-btn');
        if (connectBtn.classList.contains('connected')) {
            this.connect();
        }
    },

    unloadModel: async function(model) {
        try {
            // Send a generate request with keep_alive set to 0 to unload immediately
            const response = await new Promise((resolve, reject) => {
                genericRequest('UnloadModelWithKeepAliveAsync', 
                    { 
                        model: model,
                        keep_alive: 0  // This will make the model unload immediately
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

    configureResponse: function() {
        const configHtml = `
            <div class="modal fade" id="responseConfigModal">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Configure Response</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Custom Prompt</label>
                                <textarea id="custom-prompt" class="form-control" rows="4"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Save as Preset</label>
                                <div class="input-group">
                                    <input type="text" id="preset-name" class="form-control" placeholder="Preset name">
                                    <button class="btn btn-outline-primary" onclick="ollamaVision.savePreset()">
                                        Save Preset
                                    </button>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Saved Presets</label>
                                <div id="saved-presets" class="list-group">
                                    <!-- Presets will be loaded here -->
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="basic-button" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="basic-button" onclick="ollamaVision.saveResponseConfig()">Save</button>
                        </div>
                    </div>
                </div>
            </div>`;

        if (!document.getElementById('responseConfigModal')) {
            document.body.insertAdjacentHTML('beforeend', configHtml);
        }

        // Load current prompt and saved presets
        this.loadResponseConfig();
        new bootstrap.Modal(document.getElementById('responseConfigModal')).show();
    },

    loadResponseConfig: function() {
        genericRequest('GetResponsePrompt', {}, (response) => {
            if (response.success) {
                document.getElementById('custom-prompt').value = response.prompt;
            }
        });

        // Load saved presets
        const presets = JSON.parse(localStorage.getItem('ollamaVision_presets') || '[]');
        const presetsContainer = document.getElementById('saved-presets');
        
        if (presets.length === 0) {
            presetsContainer.innerHTML = '<div class="text-muted p-2">No saved presets</div>';
            return;
        }

        presetsContainer.innerHTML = presets.map(preset => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${preset.name}</strong>
                    <small class="d-block text-muted">${preset.prompt.substring(0, 50)}...</small>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="ollamaVision.usePreset('${preset.name}')">
                        Use
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="ollamaVision.deletePreset('${preset.name}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    savePreset: function() {
        const name = document.getElementById('preset-name').value.trim();
        const prompt = document.getElementById('custom-prompt').value.trim();
        
        if (!name || !prompt) {
            this.updateStatus('error', 'Please enter both name and prompt');
            return;
        }

        let presets = JSON.parse(localStorage.getItem('ollamaVision_presets') || '[]');
        
        // Check for duplicate names
        if (presets.some(p => p.name === name)) {
            if (!confirm('A preset with this name already exists. Do you want to replace it?')) {
                return;
            }
            presets = presets.filter(p => p.name !== name);
        }

        presets.push({ name, prompt });
        localStorage.setItem('ollamaVision_presets', JSON.stringify(presets));
        
        // Clear input and reload presets
        document.getElementById('preset-name').value = '';
        this.loadResponseConfig();
        this.updateStatus('success', 'Preset saved successfully');
    },

    usePreset: function(name) {
        const presets = JSON.parse(localStorage.getItem('ollamaVision_presets') || '[]');
        const preset = presets.find(p => p.name === name);
        
        if (preset) {
            document.getElementById('custom-prompt').value = preset.prompt;
        }
    },

    deletePreset: function(name) {
        if (!confirm('Are you sure you want to delete this preset?')) {
            return;
        }

        let presets = JSON.parse(localStorage.getItem('ollamaVision_presets') || '[]');
        presets = presets.filter(p => p.name !== name);
        localStorage.setItem('ollamaVision_presets', JSON.stringify(presets));
        
        this.loadResponseConfig();
        this.updateStatus('success', 'Preset deleted successfully');
    },

    getTemplate: function() {
        return `
            <style>
                #screenshot-btn:hover, #upload-btn:hover {
                    background-color: #17b890;
                }
            </style>
            <!-- rest of your template -->
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
        
        // Copy current prompt to the new preset modal
        const currentPrompt = document.getElementById('responsePrompt').value;
        document.getElementById('presetPrompt').value = currentPrompt;
        
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
        console.log('Opening preset manager...'); // Debug log
        
        // First properly close the response settings modal
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
        
        const defaultList = document.getElementById('default-presets-list');
        const userList = document.getElementById('user-presets-list');
        
        if (!defaultList || !userList) {
            console.error('Preset lists not found:', {defaultList, userList});
            return;
        }
        
        // Load default presets (these stay fixed)
        defaultList.innerHTML = [
            "Default",
            "Detailed Analysis",
            "Simple Description",
            "Artistic Style",
            "Technical Details",
            "Color Palette",
            "Facial Features"
        ].map(preset => `
            <div class="list-group-item">
                <i class="fas fa-grip-lines me-2"></i>
                ${preset}
            </div>
        `).join('');

        // Load user presets
        const customPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
        console.log('Custom presets loaded:', customPresets);
        
        userList.innerHTML = customPresets.map(preset => `
            <div class="list-group-item d-flex justify-content-between align-items-center" data-preset="${preset.name}">
                <div class="d-flex align-items-center">
                    <i class="fas fa-grip-lines me-2" style="cursor: grab;"></i>
                    ${preset.name}
                </div>
                <button class="btn btn-sm btn-danger" onclick="ollamaVision.deleteUserPreset('${preset.name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // Initialize Sortable with a check and retry
        const initSortable = () => {
            if (typeof Sortable !== 'undefined') {
                console.log('Initializing Sortable...'); // Debug log
                new Sortable(userList, {
                    animation: 150,
                    handle: '.fa-grip-lines',
                    ghostClass: 'sortable-ghost',
                    dragClass: 'sortable-drag',
                    onEnd: (evt) => {
                        console.log('Drag ended, saving new order...');
                        this.savePresetOrder();
                    }
                });
            } else {
                console.log('Sortable not loaded yet, retrying...'); // Debug log
                setTimeout(initSortable, 100);
            }
        };

        initSortable();
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
        this.loadPresetManager();
    },

    updatePresetsDropdown: function() {
        const select = document.getElementById('promptPresets');
        if (!select) return;
        
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
    }
};

// Add this event listener after initialization
document.getElementById('response-type').addEventListener('change', function(e) {
    const value = e.target.value;
    if (value.startsWith('custom_')) {
        const presetName = value.replace('custom_', '');
        const presets = JSON.parse(localStorage.getItem('ollamaVision_presets') || '[]');
        const preset = presets.find(p => p.name === presetName);
        if (preset) {
            // Use the custom preset prompt
            localStorage.setItem('ollamaVision_currentPrompt', preset.prompt);
        }
    }
});
