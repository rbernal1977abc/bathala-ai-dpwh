const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/jpg'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOCX, JPG, PNG are allowed.'));
        }
    }
});

// Create uploads directory if it doesn't exist
const createUploadsDir = async () => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
        await fs.access(uploadDir);
    } catch {
        await fs.mkdir(uploadDir, { recursive: true });
    }
};

createUploadsDir();

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'BATHALA AI Governance',
        timestamp: new Date().toISOString()
    });
});

// Contractor vetting
app.post('/api/contractor/vet', async (req, res) => {
    try {
        const { contractorName, secNumber, pcabLicense, sources } = req.body;
        
        // In production, this would connect to actual government APIs
        // For now, simulate data integration
        
        const vettingResult = await simulateContractorVetting({
            contractorName,
            secNumber,
            pcabLicense,
            sources
        });
        
        res.json({
            success: true,
            ...vettingResult,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Contractor vetting error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process contractor vetting'
        });
    }
});

// Document upload
app.post('/api/documents/upload', upload.array('documents', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files uploaded'
            });
        }
        
        const fileDetails = req.files.map(file => ({
            originalName: file.originalname,
            savedName: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
        }));
        
        // Log the upload
        await logDocumentUpload(fileDetails);
        
        res.json({
            success: true,
            files: fileDetails,
            message: `Successfully uploaded ${fileDetails.length} file(s)`
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to upload files'
        });
    }
});

// Document analysis
app.post('/api/documents/analyze', async (req, res) => {
    try {
        const { files, options } = req.body;
        
        // In production, this would use actual AI services
        const analysisResult = await analyzeDocumentsWithAI(files, options);
        
        res.json({
            success: true,
            ...analysisResult,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze documents'
        });
    }
});

// AI Agent execution
app.post('/api/ai/run', async (req, res) => {
    try {
        const { agent, context } = req.body;
        
        let result;
        if (agent === 'agent1') {
            result = await runAgent1(context);
        } else if (agent === 'agent2') {
            result = await runAgent2(context);
        } else {
            throw new Error('Invalid agent specified');
        }
        
        res.json({
            success: true,
            agent,
            ...result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('AI Agent error:', error);
        res.status(500).json({
            success: false,
            error: `Failed to run AI agent: ${error.message}`
        });
    }
});

// AI Agent command processing
app.post('/api/ai/command', async (req, res) => {
    try {
        const { agent, command } = req.body;
        
        const response = await processAICommand(agent, command);
        
        res.json({
            success: true,
            agent,
            ...response,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('AI Command error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process AI command'
        });
    }
});

// AI Agent testing
app.post('/api/ai/test', async (req, res) => {
    try {
        const { agent } = req.body;
        
        const testResult = await testAIAgent(agent);
        
        res.json({
            success: true,
            agent,
            ...testResult,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('AI Test error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to test AI agent'
        });
    }
});

// Get DPWH project data
app.get('/api/projects', async (req, res) => {
    try {
        // In production, this would connect to DPWH database
        const projects = await getDPWHProjects();
        
        res.json({
            success: true,
            projects,
            count: projects.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Projects error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch projects'
        });
    }
});

// Get contractor database
app.get('/api/contractors', async (req, res) => {
    try {
        const contractors = await getContractorDatabase();
        
        res.json({
            success: true,
            contractors,
            count: contractors.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Contractors error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch contractors'
        });
    }
});

// Simulation functions (replace with actual implementations)

async function simulateContractorVetting(data) {
    // This would integrate with:
    // 1. SEC Express System API
    // 2. PCAB License Database
    // 3. PhilGEPS API
    // 4. GPPB Blacklist
    // 5. COA Reports API
    
    return {
        contractorName: data.contractorName,
        secStatus: 'Valid',
        pcabStatus: 'Active',
        philgepsStatus: 'Registered',
        riskLevel: 'LOW',
        familyNetwork: null,
        anomalies: [],
        recommendation: 'PROCEED - Contractor cleared'
    };
}

async function analyzeDocumentsWithAI(files, options) {
    // This would use:
    // 1. Agent 1 (DeepSeek) for deep analysis
    // 2. Agent 2 (Grok) for quick verification
    // 3. OCR processing for text extraction
    // 4. Document authenticity verification
    
    return {
        agentUsed: options.aiAgent === 'both' ? 'Both Agents' : 
                  options.aiAgent === 'agent1' ? 'Agent 1 (Deep Analysis)' : 
                  'Agent 2 (Fast Verification)',
        documentsAnalyzed: files.length,
        textExtraction: { success: true, confidence: 95.5 },
        authenticity: { verified: true, confidence: 98.2 },
        anomalies: { count: 0, details: [] },
        findings: [
            { type: 'success', message: 'Document appears authentic and complete' },
            { type: 'success', message: 'All required signatures present' }
        ]
    };
}

async function runAgent1(context) {
    // DeepSeek agent implementation
    return {
        summary: 'Deep analysis completed. Pattern detected in bidding history.',
        details: 'Detailed analysis shows consistent performance metrics.',
        confidence: 92.7
    };
}

async function runAgent2(context) {
    // Grok agent implementation
    return {
        summary: 'Real-time verification completed. All documents authentic.',
        details: 'Quick check shows no immediate red flags.',
        confidence: 98.1
    };
}

async function processAICommand(agent, command) {
    const responses = {
        agent1: [
            'Deep analysis initiated for command.',
            'Pattern recognition algorithm engaged.',
            'Historical data analysis in progress.'
        ],
        agent2: [
            'Real-time verification started.',
            'Quick assessment initiated.',
            'Instant analysis completed.'
        ]
    };
    
    const agentResponses = responses[agent] || ['Command received and processed.'];
    const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)];
    
    return {
        message: `${randomResponse} Command: "${command}"`,
        processed: true
    };
}

async function testAIAgent(agent) {
    const messages = {
        agent1: 'Deep analysis systems functioning optimally.',
        agent2: 'Verification systems ready and responsive.'
    };
    
    return {
        message: messages[agent] || 'Agent test completed successfully.',
        status: 'operational',
        performance: 'excellent'
    };
}

async function getDPWHProjects() {
    // Simulate DPWH project data
    return [
        {
            id: 'DPWH-FC-2025-045',
            name: 'Pasig River Flood Control',
            contractor: 'Edison Development Corp.',
            budget: '₱ 2.5B',
            status: 'In Progress',
            startDate: '2024-01-15',
            endDate: '2025-12-31'
        },
        {
            id: 'DPWH-RB-2025-112',
            name: 'C5 Road Expansion',
            contractor: 'ABC Construction Co.',
            budget: '₱ 1.8B',
            status: 'Planning',
            startDate: '2024-03-01',
            endDate: '2026-02-28'
        }
    ];
}

async function getContractorDatabase() {
    // Simulate contractor database
    return [
        {
            id: 'CTR-001',
            name: 'Edison Development Corp.',
            license: 'PCAB-12345',
            status: 'Active',
            riskLevel: 'LOW'
        },
        {
            id: 'CTR-002',
            name: 'Discaya Construction Group',
            license: 'REVOKED',
            status: 'Blacklisted',
            riskLevel: 'HIGH'
        }
    ];
}

async function logDocumentUpload(files) {
    // Log uploads for audit trail
    const logEntry = {
        timestamp: new Date().toISOString(),
        files: files.map(f => f.originalName),
        count: files.length
    };
    
    const logFile = path.join(__dirname, '../logs/upload-log.json');
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
}

// Start server
app.listen(PORT, () => {
    console.log(`BATHALA AI Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});
