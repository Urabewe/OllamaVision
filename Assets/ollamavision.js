document.addEventListener("DOMContentLoaded", function () {
    function checkForOllamaVision() {
        const utilities = document.getElementById('utilities_tab');
        if (utilities) {
            addOllamaVisionTab(utilities);
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            const connectBtn = document.getElementById('connect-btn');
            connectBtn.innerHTML = `Connect to ${backendType === 'openai' ? 'OpenAI' : 'Ollama'}`;
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
                            <button class="basic-button" onclick="ollamaVision.disconnect()" id="disconnect-btn" 
                                    style="display: none; background-color: var(--bs-danger);">
                                Disconnect
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
                                                    <img id="preview-image" 
                                                         class="img-fluid" 
                                                         src="" 
                                                         alt="Preview" 
                                                         style="max-width: 512px; max-height: 512px; object-fit: contain;">
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
            const disconnectBtn = document.getElementById('disconnect-btn');
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            
            connectBtn.disabled = true;
            connectBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Connecting to ${backendType === 'openai' ? 'OpenAI' : 'Ollama'}...`;
            
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
                document.getElementById('screenshot-btn').disabled = false;
                document.getElementById('upload-btn').disabled = false;
                
                this.updateStatus('success', 'Connected to OpenAI successfully');
            } else {
                // Existing Ollama connection logic
                const showAllModels = localStorage.getItem('ollamaVision_showAllModels') === 'true';
                const host = localStorage.getItem('ollamaVision_host') || 'localhost';
                const port = localStorage.getItem('ollamaVision_port') || '11434';
                
                const response = await new Promise((resolve, reject) => {
                    genericRequest('ConnectToOllamaAsync', 
                        { 
                            showAllModels: showAllModels,
                            ollamaUrl: `http://${host}:${port}`
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
                    document.getElementById('screenshot-btn').disabled = false;
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
            
            // Remove any existing paste event listener first
            if (this.pasteHandler) {
                document.removeEventListener('paste', this.pasteHandler);
            }
            
            // Create and store the bound handler
            this.pasteHandler = this.handlePaste.bind(this);
            
            // Enable paste and set up the paste event listener
            this.pasteEnabled = true;
            
            // Add the paste listener only to the OllamaVision tab
            const ollamaVisionTab = document.getElementById('Utilities-OllamaVision-Tab');
            if (ollamaVisionTab) {
                ollamaVisionTab.addEventListener('paste', this.pasteHandler);
                
                // Create a hidden input field within the OllamaVision tab
                const hiddenInput = document.createElement('input');
                hiddenInput.style.position = 'absolute';
                hiddenInput.style.opacity = '0';
                hiddenInput.style.pointerEvents = 'none';
                hiddenInput.id = 'ollamavision-hidden-input';
                ollamaVisionTab.appendChild(hiddenInput);
                
                // Focus the hidden input
                hiddenInput.focus();
                
                // Keep focus in the tab area
                ollamaVisionTab.addEventListener('blur', () => {
                    if (this.pasteEnabled) {
                        hiddenInput.focus();
                    }
                });
            }

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
            sendToPromptBtn.disabled = true;
            
            const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
            
            if (backendType === 'openai') {
                this.updateStatus('info', 'Image sent, waiting for response from OpenAI...', true);
                
                const apiKey = localStorage.getItem('ollamaVision_openaiKey');
                if (!apiKey) {
                    throw new Error('OpenAI API key not found');
                }
                
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: document.getElementById('responsePrompt').value || 'Describe this image in detail.' },
                                    { type: 'image_url', image_url: { url: imageData } }
                                ]
                            }
                        ],
                        max_tokens: 500
                    })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'OpenAI API request failed');
                }
                
                const data = await response.json();
                const analysisResult = data.choices[0].message.content;
                
                this.updateStatus('success', 'Image description complete!');
                responseArea.style.display = 'block';
                responseText.textContent = analysisResult;
                sendToPromptBtn.disabled = false;
                
            } else {
                // Existing Ollama analysis logic
                this.updateStatus('info', 'Image sent, waiting for response from Ollama...', true);
                
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

                    const autoUnload = localStorage.getItem('ollamaVision_autoUnload') === 'true';
                    if (autoUnload) {
                        await this.unloadModel(model);
                    }
                } else {
                    throw new Error('Analysis failed: ' + response.error);
                }
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
                            <div class="mb-3">
                                <label class="form-label">Backend Selection</label>
                                <select id="backend-type" class="form-select" onchange="ollamaVision.toggleBackendSettings()">
                                    <option value="ollama">Ollama</option>
                                    <option value="openai">OpenAI</option>
                                </select>
                            </div>

                            <!-- Common Settings -->
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
                                <input class="form-check-input" type="checkbox" id="showDefaultPresets">
                                <label class="form-check-label" for="showDefaultPresets">
                                    Show default presets
                                </label>
                                <small class="form-text text-muted d-block mt-1">
                                    Toggle visibility of default response presets
                                </small>
                            </div>

                            <!-- Ollama-specific Settings -->
                            <div id="ollama-connection-settings">
                                <div class="form-check form-switch mb-3">
                                    <input class="form-check-input" type="checkbox" id="showAllModels">
                                    <label class="form-check-label" for="showAllModels">
                                        Show all Ollama models
                                    </label>
                                    <small class="form-text text-muted d-block mt-1">
                                        By default, only models with 'vision' or 'llava' in their names are shown
                                    </small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Remote Ollama Connection (Optional)</label>
                                    <input type="text" class="form-control mb-2" id="ollamaHost" 
                                           placeholder="Host (e.g., 192.168.1.100)" 
                                           value="">
                                    <input type="number" class="form-control" id="ollamaPort" 
                                           placeholder="Port (default: 11434)" 
                                           value="11434">
                                    <small class="form-text text-muted d-block mt-1">
                                        Leave empty to use local Ollama installation
                                    </small>
                                </div>
                            </div>

                            <!-- OpenAI Settings -->
                            <div id="openai-settings" style="display: none;">
                                <div class="mb-3">
                                    <label class="form-label">OpenAI API Key</label>
                                    <input type="password" class="form-control" id="openai-key" 
                                           placeholder="Enter your OpenAI API key">
                                    <small class="form-text text-muted">Your API key will be stored locally</small>
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
        const host = localStorage.getItem('ollamaVision_host') || '';
        const port = localStorage.getItem('ollamaVision_port') || '11434';
        const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';
        const openaiKey = localStorage.getItem('ollamaVision_openaiKey') || '';
        const showDefaultPresets = localStorage.getItem('ollamaVision_showDefaultPresets') !== 'false';
        
        document.getElementById('autoUnloadModel').checked = autoUnload;
        document.getElementById('showAllModels').checked = showAllModels;
        document.getElementById('ollamaHost').value = host;
        document.getElementById('ollamaPort').value = port;
        document.getElementById('backend-type').value = backendType;
        document.getElementById('openai-key').value = openaiKey;
        document.getElementById('showDefaultPresets').checked = showDefaultPresets;
        
        // Show/hide appropriate settings
        this.toggleBackendSettings();
        
        modal.show();
    },

    toggleBackendSettings: function() {
        const backendType = document.getElementById('backend-type').value;
        const ollamaConnectionSettings = document.getElementById('ollama-connection-settings');
        const openaiSettings = document.getElementById('openai-settings');
        const connectBtn = document.getElementById('connect-btn');
        
        if (backendType === 'ollama') {
            ollamaConnectionSettings.style.display = 'block';
            openaiSettings.style.display = 'none';
            connectBtn.innerHTML = 'Connect to Ollama';
        } else {
            ollamaConnectionSettings.style.display = 'none';
            openaiSettings.style.display = 'block';
            connectBtn.innerHTML = 'Connect to OpenAI';
        }
    },

    saveSettings: function() {
        const autoUnload = document.getElementById('autoUnloadModel').checked;
        const showAllModels = document.getElementById('showAllModels').checked;
        const showDefaultPresets = document.getElementById('showDefaultPresets').checked;
        const host = document.getElementById('ollamaHost').value.trim();
        const port = document.getElementById('ollamaPort').value.trim();
        const backendType = document.getElementById('backend-type').value;
        const openaiKey = document.getElementById('openai-key').value.trim();
        
        localStorage.setItem('ollamaVision_autoUnload', autoUnload);
        localStorage.setItem('ollamaVision_showAllModels', showAllModels);
        localStorage.setItem('ollamaVision_showDefaultPresets', showDefaultPresets);
        localStorage.setItem('ollamaVision_host', host);
        localStorage.setItem('ollamaVision_port', port);
        localStorage.setItem('ollamaVision_backendType', backendType);
        localStorage.setItem('ollamaVision_openaiKey', openaiKey);
        
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
        const presetName = document.getElementById('newPresetName').value.trim();
        const presetPrompt = document.getElementById('newPresetPrompt').value.trim();
        
        if (!presetName || !presetPrompt) {
            alert('Please enter both a name and prompt for the preset.');
            return;
        }
        
        // Add USER: prefix when saving the preset
        const fullPresetName = presetName.startsWith('USER: ') ? presetName : `USER: ${presetName}`;
        
        const customPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
        
        // Check if a preset with this name already exists
        if (customPresets.some(p => p.name === fullPresetName)) {
            alert('A preset with this name already exists.');
            return;
        }
        
        // Save the preset with the USER: prefix included in the name
        customPresets.push({
            name: fullPresetName,
            prompt: presetPrompt
        });
        
        localStorage.setItem('ollamaVision_customPresets', JSON.stringify(customPresets));
        
        // Update UI
        this.updatePresetsDropdown();
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createPresetModal'));
        if (modal) modal.hide();
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
        
        // Remove the default presets section entirely
        defaultList.parentElement.style.display = 'none';  // Hide the entire default presets section
    
        // Add help text for user presets
        userList.innerHTML = '';  // Remove the header completely
            
        // Load user presets
        const customPresets = JSON.parse(localStorage.getItem('ollamaVision_customPresets') || '[]');
        
        userList.innerHTML += customPresets.map(preset => `
            <div class="list-group-item d-flex justify-content-between align-items-center" data-preset="${preset.name}">
                <div class="d-flex align-items-center">
                    <span class="basic-button me-2" 
                          style="cursor: grab; padding: 8px 12px; min-width: 40px; text-align: center;"
                          title="Drag to reorder">
                        <i class="fas fa-grip-lines"></i>
                    </span>
                    ${preset.name}
                </div>
                <button class="basic-button" 
                        onclick="ollamaVision.deleteUserPreset('${preset.name}')" 
                        style="background-color: #dc3545 !important; padding: 6px 10px;"
                        title="Delete this preset">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');
    
        // Initialize Sortable from CDN if not already loaded
        if (typeof Sortable === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js';
            script.onload = () => {
                this.initializeSortable(userList);
            };
            document.head.appendChild(script);
        } else {
            this.initializeSortable(userList);
        }
    },
    
    initializeSortable: function(userList) {
        new Sortable(userList, {
            animation: 150,
            handle: '.basic-button',
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: (evt) => {
                console.log('Drag ended, saving new order...');
                this.savePresetOrder();
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
        const connectBtn = document.getElementById('connect-btn');
        const disconnectBtn = document.getElementById('disconnect-btn');
        const modelSelect = document.getElementById('ollamavision-model');
        const screenshotBtn = document.getElementById('screenshot-btn');
        const uploadBtn = document.getElementById('upload-btn');
        const backendType = localStorage.getItem('ollamaVision_backendType') || 'ollama';

        // Reset UI state
        connectBtn.disabled = false;
        connectBtn.innerHTML = `Connect to ${backendType === 'openai' ? 'OpenAI' : 'Ollama'}`;
        connectBtn.classList.remove('connected');
        connectBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'none';
        
        // Disable controls
        modelSelect.disabled = true;
        modelSelect.innerHTML = '<option value="">Select a model...</option>';
        screenshotBtn.disabled = true;
        uploadBtn.disabled = true;

        this.cleanup();

        this.updateStatus('info', `Disconnected from ${backendType === 'openai' ? 'OpenAI' : 'Ollama'}`);
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
