// BATHALA Intelligence - Main Application Script
class BathalaApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.uploadedFiles = [];
        this.analysisResults = [];
        this.contractors = [];
        this.aiAgents = {
            agent1: { name: 'Agent 1', type: 'deepseek', active: true },
            agent2: { name: 'Agent 2', type: 'grok', active: true }
        };
        
        this.init();
    }

    init() {
        // Initialize event listeners
        this.initNavigation();
        this.initForms();
        this.initUpload();
        this.initAIAgents();
        this.initConsole();
        
        // Load initial data
        this.loadDashboardData();
        
        // Show initial section
        this.showSection('dashboard');
        
        console.log('BATHALA Intelligence System initialized');
    }

    initNavigation() {
        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        const mobileNav = document.getElementById('mobileNav');
        
        menuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
        });

        // Mobile nav links
        document.querySelectorAll('.mobile-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                this.showSection(sectionId);
                mobileNav.classList.remove('active');
            });
        });

        // Close mobile nav when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileNav.contains(e.target) && !menuToggle.contains(e.target)) {
                mobileNav.classList.remove('active');
            }
        });
    }

    initForms() {
        // Contractor vetting form
        const contractorForm = document.getElementById('contractorForm');
        if (contractorForm) {
            contractorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processContractorVetting();
            });
        }

        // Document type buttons
        document.querySelectorAll('.doc-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docType = e.currentTarget.dataset.type;
                this.handleDocTypeSelection(docType);
            });
        });

        // Document analysis button
        const analyzeBtn = document.getElementById('analyzeDocsBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.analyzeDocuments();
            });
        }
    }

    initUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('documentUpload');

        if (!uploadArea || !fileInput) return;

        // Click on upload area
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Handle file selection
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary-color)';
            uploadArea.style.backgroundColor = 'rgba(25, 118, 210, 0.05)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.backgroundColor = '';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.backgroundColor = '';
            
            if (e.dataTransfer.files.length) {
                this.handleFileUpload(e.dataTransfer.files);
            }
        });
    }

    initAIAgents() {
        // Agent action buttons
        document.querySelectorAll('.agent-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const agent = e.currentTarget.dataset.agent;
                this.runAIAgent(agent);
            });
        });
    }

    initConsole() {
        const sendCommand = document.getElementById('sendCommand');
        const agentCommand = document.getElementById('agentCommand');
        const clearConsole = document.getElementById('clearConsole');
        const testAgents = document.getElementById('testAgents');
        const exportLogs = document.getElementById('exportLogs');

        if (sendCommand && agentCommand) {
            sendCommand.addEventListener('click', () => {
                const command = agentCommand.value.trim();
                if (command) {
                    this.sendAgentCommand(command);
                    agentCommand.value = '';
                }
            });

            agentCommand.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const command = agentCommand.value.trim();
                    if (command) {
                        this.sendAgentCommand(command);
                        agentCommand.value = '';
                    }
                }
            });
        }

        if (clearConsole) {
            clearConsole.addEventListener('click', () => {
                this.clearConsole();
            });
        }

        if (testAgents) {
            testAgents.addEventListener('click', () => {
                this.testBothAgents();
            });
        }

        if (exportLogs) {
            exportLogs.addEventListener('click', () => {
                this.exportConsoleLogs();
            });
        }
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Update URL hash
            window.location.hash = sectionId;
        }
    }

    async processContractorVetting() {
        this.showLoading(true);
        
        try {
            const contractorName = document.getElementById('contractorName').value;
            const secNumber = document.getElementById('secNumber').value;
            const pcabLicense = document.getElementById('pcabLicense').value;
            
            const sources = Array.from(document.querySelectorAll('input[name="sources"]:checked'))
                .map(cb => cb.value);

            // Simulate API call to backend
            const vettingResult = await this.apiCall('/api/contractor/vet', {
                contractorName,
                secNumber,
                pcabLicense,
                sources
            });

            this.displayVettingResults(vettingResult);
            this.showToast('Contractor vetting completed successfully!', 'success');
            
        } catch (error) {
            console.error('Vetting error:', error);
            this.showToast('Error processing contractor vetting', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleFileUpload(files) {
        this.showLoading(true);
        
        try {
            const formData = new FormData();
            Array.from(files).forEach(file => {
                formData.append('documents', file);
                this.uploadedFiles.push(file);
            });

            // Upload files to server
            const uploadResult = await this.apiCall('/api/documents/upload', formData, true);
            
            this.displayUploadedFiles(this.uploadedFiles);
            this.showToast(`Uploaded ${files.length} file(s) successfully`, 'success');
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast('Error uploading files', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async analyzeDocuments() {
        if (this.uploadedFiles.length === 0) {
            this.showToast('Please upload documents first', 'warning');
            return;
        }

        this.showLoading(true);
        
        try {
            const options = {
                extractText: document.getElementById('extractText').checked,
                verifyAuthenticity: document.getElementById('verifyAuthenticity').checked,
                checkAnomalies: document.getElementById('checkAnomalies').checked,
                compareDatabase: document.getElementById('compareDatabase').checked,
                aiAgent: document.getElementById('aiAgent').value
            };

            // Analyze with AI agents
            const analysisResult = await this.apiCall('/api/documents/analyze', {
                files: this.uploadedFiles.map(f => f.name),
                options
            });

            this.displayAnalysisResults(analysisResult);
            this.showToast('AI analysis completed successfully!', 'success');
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showToast('Error analyzing documents', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async runAIAgent(agentId) {
        this.showLoading(true);
        
        try {
            // Get current context based on active section
            const context = this.getCurrentContext();
            
            const result = await this.apiCall('/api/ai/run', {
                agent: agentId,
                context: context,
                timestamp: new Date().toISOString()
            });

            this.addConsoleMessage(agentId, `Analysis completed: ${result.summary}`);
            this.showToast(`${this.aiAgents[agentId].name} analysis completed`, 'success');
            
        } catch (error) {
            console.error('AI Agent error:', error);
            this.addConsoleMessage(agentId, 'Error: Analysis failed');
            this.showToast('AI Agent error', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    sendAgentCommand(command) {
        const timestamp = new Date().toLocaleTimeString();
        const userMessage = `<span class="console-time">[${timestamp}]</span>
                           <span class="console-agent">User:</span>
                           <span>${command}</span>`;
        
        this.addToConsole(userMessage);
        
        // Process command through AI agents
        this.processAgentCommand(command);
    }

    async processAgentCommand(command) {
        // Determine which agent(s) to use based on command
        const useAgent1 = command.toLowerCase().includes('analyze') || 
                         command.toLowerCase().includes('pattern');
        const useAgent2 = command.toLowerCase().includes('verify') || 
                         command.toLowerCase().includes('check');
        
        if (useAgent1) {
            await this.processWithAgent('agent1', command);
        }
        
        if (useAgent2) {
            await this.processWithAgent('agent2', command);
        }
        
        if (!useAgent1 && !useAgent2) {
            // Use both agents for general commands
            await this.processWithAgent('agent1', command);
            await this.processWithAgent('agent2', command);
        }
    }

    async processWithAgent(agentId, command) {
        try {
            const response = await this.apiCall('/api/ai/command', {
                agent: agentId,
                command: command
            });

            this.addConsoleMessage(agentId, response.message);
            
        } catch (error) {
            console.error('Agent command error:', error);
            this.addConsoleMessage(agentId, 'Error processing command');
        }
    }

    async testBothAgents() {
        this.showLoading(true);
        
        try {
            // Test Agent 1
            this.addConsoleMessage('agent1', 'Running deep analysis test...');
            const result1 = await this.apiCall('/api/ai/test', { agent: 'agent1' });
            this.addConsoleMessage('agent1', result1.message);
            
            // Test Agent 2
            this.addConsoleMessage('agent2', 'Running verification test...');
            const result2 = await this.apiCall('/api/ai/test', { agent: 'agent2' });
            this.addConsoleMessage('agent2', result2.message);
            
            this.showToast('Both AI agents tested successfully!', 'success');
            
        } catch (error) {
            console.error('Test error:', error);
            this.showToast('Error testing AI agents', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Display Methods
    displayVettingResults(results) {
        const resultsContainer = document.getElementById('vettingResults');
        if (!resultsContainer) return;

        let html = `
            <div class="vetting-result">
                <div class="result-header">
                    <h4>${results.contractorName}</h4>
                    <span class="risk-badge ${results.riskLevel.toLowerCase()}">
                        ${results.riskLevel} RISK
                    </span>
                </div>
                
                <div class="result-details">
                    <div class="detail-item">
                        <span class="detail-label">SEC Registration:</span>
                        <span class="detail-value ${results.secStatus === 'Valid' ? 'valid' : 'invalid'}">
                            ${results.secStatus}
                        </span>
                    </div>
                    
                    <div class="detail-item">
                        <span class="detail-label">PCAB License:</span>
                        <span class="detail-value ${results.pcabStatus === 'Active' ? 'valid' : 'invalid'}">
                            ${results.pcabStatus}
                        </span>
                    </div>
                    
                    <div class="detail-item">
                        <span class="detail-label">PhilGEPS Registration:</span>
                        <span class="detail-value ${results.philgepsStatus === 'Registered' ? 'valid' : 'invalid'}">
                            ${results.philgepsStatus}
                        </span>
                    </div>
                    
                    ${results.familyNetwork ? `
                    <div class="detail-item">
                        <span class="detail-label">Family Network:</span>
                        <span class="detail-value warning">
                            ${results.familyNetwork.length} related companies detected
                        </span>
                    </div>
                    ` : ''}
                    
                    ${results.anomalies && results.anomalies.length > 0 ? `
                    <div class="anomalies">
                        <h5>Anomalies Detected:</h5>
                        <ul>
                            ${results.anomalies.map(anomaly => `<li>${anomaly}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    <div class="recommendation">
                        <h5>Recommendation:</h5>
                        <p class="${results.recommendation.includes('DISQUALIFY') ? 'danger' : 'success'}">
                            ${results.recommendation}
                        </p>
                    </div>
                </div>
            </div>
        `;

        resultsContainer.innerHTML = html;
    }

    displayUploadedFiles(files) {
        // Update UI to show uploaded files
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.innerHTML = `
                <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                <h4>${files.length} file(s) uploaded</h4>
                <p>Ready for AI analysis</p>
                <div class="file-list">
                    ${files.map(file => `
                        <div class="file-item">
                            <i class="fas fa-file"></i>
                            <span>${file.name}</span>
                            <span class="file-size">(${this.formatFileSize(file.size)})</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    displayAnalysisResults(results) {
        const resultsContainer = document.getElementById('analysisResults');
        if (!resultsContainer) return;

        let html = `
            <div class="analysis-result">
                <div class="result-header">
                    <h4>Document Analysis Complete</h4>
                    <span class="ai-agent">Using ${results.agentUsed}</span>
                </div>
                
                <div class="analysis-summary">
                    <div class="summary-item">
                        <span class="summary-label">Documents Analyzed:</span>
                        <span class="summary-value">${results.documentsAnalyzed}</span>
                    </div>
                    
                    <div class="summary-item">
                        <span class="summary-label">Text Extraction:</span>
                        <span class="summary-value ${results.textExtraction.success ? 'success' : 'warning'}">
                            ${results.textExtraction.success ? 'Successful' : 'Partial'}
                        </span>
                    </div>
                    
                    <div class="summary-item">
                        <span class="summary-label">Authenticity:</span>
                        <span class="summary-value ${results.authenticity.verified ? 'success' : 'danger'}">
                            ${results.authenticity.verified ? 'Verified' : 'Suspicious'}
                        </span>
                    </div>
                    
                    <div class="summary-item">
                        <span class="summary-label">Anomalies Found:</span>
                        <span class="summary-value ${results.anomalies.count === 0 ? 'success' : 'danger'}">
                            ${results.anomalies.count}
                        </span>
                    </div>
                </div>
                
                ${results.findings && results.findings.length > 0 ? `
                <div class="findings">
                    <h5>Key Findings:</h5>
                    <ul>
                        ${results.findings.map(finding => `
                            <li class="${finding.type}">
                                <i class="fas fa-${finding.type === 'warning' ? 'exclamation-triangle' : 
                                                finding.type === 'error' ? 'times-circle' : 
                                                'check-circle'}"></i>
                                ${finding.message}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}
                
                <div class="analysis-actions">
                    <button class="btn btn-secondary" onclick="app.downloadAnalysisReport()">
                        <i class="fas fa-download"></i> Download Report
                    </button>
                    <button class="btn btn-primary" onclick="app.shareAnalysisResults()">
                        <i class="fas fa-share"></i> Share Results
                    </button>
                </div>
            </div>
        `;

        resultsContainer.innerHTML = html;
    }

    addConsoleMessage(agentId, message) {
        const consoleOutput = document.getElementById('agentConsole');
        if (!consoleOutput) return;

        const timestamp = new Date().toLocaleTimeString();
        const html = `
            <div class="console-message ${agentId}">
                <span class="console-time">[${timestamp}]</span>
                <span class="console-agent">${this.aiAgents[agentId].name}:</span>
                <span>${message}</span>
            </div>
        `;

        consoleOutput.innerHTML += html;
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    addToConsole(html) {
        const consoleOutput = document.getElementById('agentConsole');
        if (!consoleOutput) return;

        consoleOutput.innerHTML += `<div class="console-message">${html}</div>`;
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    clearConsole() {
        const consoleOutput = document.getElementById('agentConsole');
        if (consoleOutput) {
            consoleOutput.innerHTML = '';
        }
    }

    async exportConsoleLogs() {
        const consoleOutput = document.getElementById('agentConsole');
        if (!consoleOutput) return;

        const logs = consoleOutput.innerText;
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `bathala-console-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.showToast('Console logs exported', 'success');
    }

    // Utility Methods
    async apiCall(endpoint, data, isFormData = false) {
        // In production, this would call your actual API
        // For now, simulate API responses
        
        await this.delay(1000); // Simulate network delay
        
        // Mock responses based on endpoint
        switch (endpoint) {
            case '/api/contractor/vet':
                return this.mockContractorVetting(data);
                
            case '/api/documents/upload':
                return this.mockDocumentUpload(data);
                
            case '/api/documents/analyze':
                return this.mockDocumentAnalysis(data);
                
            case '/api/ai/run':
                return this.mockAIAnalysis(data);
                
            case '/api/ai/command':
                return this.mockAICommand(data);
                
            case '/api/ai/test':
                return this.mockAITest(data);
                
            default:
                throw new Error('API endpoint not found');
        }
    }

    mockContractorVetting(data) {
        // Simulate vetting results
        const riskLevels = ['LOW', 'MEDIUM', 'HIGH'];
        const randomRisk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
        
        return {
            contractorName: data.contractorName,
            secStatus: Math.random() > 0.2 ? 'Valid' : 'Invalid',
            pcabStatus: Math.random() > 0.3 ? 'Active' : 'Expired',
            philgepsStatus: Math.random() > 0.1 ? 'Registered' : 'Not Found',
            riskLevel: randomRisk,
            familyNetwork: Math.random() > 0.7 ? ['Company A', 'Company B', 'Company C'] : null,
            anomalies: Math.random() > 0.8 ? ['Multiple bids on same project', 'Family network detected'] : [],
            recommendation: randomRisk === 'HIGH' ? 'DISQUALIFY - Further investigation required' :
                           randomRisk === 'MEDIUM' ? 'PROCEED WITH CAUTION - Additional verification needed' :
                           'PROCEED - Contractor cleared'
        };
    }

    mockDocumentUpload(data) {
        return {
            success: true,
            files: Array.from(data.getAll('documents')).map(f => f.name),
            message: 'Files uploaded successfully'
        };
    }

    mockDocumentAnalysis(data) {
        const agents = {
            'agent1': 'Agent 1 (Deep Analysis)',
            'agent2': 'Agent 2 (Fast Verification)',
            'both': 'Both Agents'
        };
        
        return {
            agentUsed: agents[data.options.aiAgent],
            documentsAnalyzed: data.files.length,
            textExtraction: {
                success: Math.random() > 0.1,
                confidence: Math.random() * 100
            },
            authenticity: {
                verified: Math.random() > 0.3,
                confidence: Math.random() * 100
            },
            anomalies: {
                count: Math.floor(Math.random() * 5),
                details: []
            },
            findings: [
                {
                    type: Math.random() > 0.7 ? 'warning' : 'success',
                    message: 'Document appears authentic and complete'
                },
                {
                    type: Math.random() > 0.8 ? 'error' : 'success',
                    message: 'All required signatures present'
                }
            ]
        };
    }

    mockAIAnalysis(data) {
        const responses = {
            agent1: [
                'Deep analysis completed. Pattern detected in bidding history.',
                'Family network analysis shows multiple related entities.',
                'Historical data suggests consistent performance.'
            ],
            agent2: [
                'Real-time verification completed. All documents authentic.',
                'Quick check shows no immediate red flags.',
                'Verification passed with 98% confidence.'
            ]
        };
        
        const agentResponses = responses[data.agent];
        const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)];
        
        return {
            success: true,
            summary: randomResponse,
            details: 'Detailed analysis available in full report.',
            timestamp: data.timestamp
        };
    }

    mockAICommand(data) {
        return {
            success: true,
            message: `Command processed successfully: "${data.command}"`,
            agent: data.agent
        };
    }

    mockAITest(data) {
        const messages = {
            agent1: 'Deep analysis systems functioning optimally.',
            agent2: 'Verification systems ready and responsive.'
        };
        
        return {
            success: true,
            message: messages[data.agent],
            status: 'operational'
        };
    }

    getCurrentContext() {
        switch (this.currentSection) {
            case 'contractor-vetting':
                return {
                    type: 'contractor_vetting',
                    data: {
                        contractorName: document.getElementById('contractorName')?.value || '',
                        files: this.uploadedFiles.map(f => f.name)
                    }
                };
                
            case 'document-analysis':
                return {
                    type: 'document_analysis',
                    data: {
                        files: this.uploadedFiles.map(f => f.name),
                        options: {
                            extractText: document.getElementById('extractText')?.checked,
                            verifyAuthenticity: document.getElementById('verifyAuthenticity')?.checked
                        }
                    }
                };
                
            default:
                return { type: 'general', data: {} };
        }
    }

    handleDocTypeSelection(docType) {
        const templates = {
            sec: 'SEC Articles of Incorporation',
            pcab: 'PCAB License Certificate',
            financial: 'Audited Financial Statements',
            bid: 'Bid Documents and Proposals'
        };
        
        this.showToast(`Preparing for ${templates[docType]} upload`, 'info');
        
        // In a real app, you might pre-fill forms or set validation rules
        document.getElementById('contractorName')?.focus();
    }

    async loadDashboardData() {
        // Load initial dashboard data
        try {
            // Simulate API calls for dashboard data
            await this.delay(500);
            
            // Update stats or other dashboard elements
            console.log('Dashboard data loaded');
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    // UI Helper Methods
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('active', show);
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                            type === 'error' ? 'times-circle' : 
                            type === 'warning' ? 'exclamation-triangle' : 
                            'info-circle'}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Public methods for UI callbacks
    downloadAnalysisReport() {
        this.showToast('Downloading analysis report...', 'info');
        // Implement actual download logic
    }

    shareAnalysisResults() {
        this.showToast('Sharing results with DPWH team...', 'info');
        // Implement share logic
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BathalaApp();
});

// Handle hash changes for section navigation
window.addEventListener('hashchange', () => {
    const sectionId = window.location.hash.substring(1) || 'dashboard';
    if (window.app) {
        window.app.showSection(sectionId);
    }
});

// Add service worker for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}

// Handle offline/online status
window.addEventListener('online', () => {
    if (window.app) {
        window.app.showToast('Back online. Syncing data...', 'success');
    }
});

window.addEventListener('offline', () => {
    if (window.app) {
        window.app.showToast('You are offline. Some features may be limited.', 'warning');
    }
});
