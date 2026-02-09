// Main Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { processMessage } = require('./agent');
const tools = require('./tools');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'app')));

// Store sessions in memory (for simplicity)
const sessions = {};

// ===== API Routes =====

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'app', 'index.html'));
});

// Create new session
app.post('/api/sessions', (req, res) => {
    const sessionId = uuidv4();
    console.log('Creating new session:', sessionId);
    
    sessions[sessionId] = {
        id: sessionId,
        messages: [],
        createdAt: new Date().toISOString()
    };
    
    // Save to database
    const db = tools.getDB();
    db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)')
        .run(sessionId, 'system', 'New session started');
    
    console.log('Session created successfully');
    res.json({ sessionId });
});

// Get all sessions
app.get('/api/sessions', (req, res) => {
    const db = tools.getDB();
    const sessionsFromDB = db.prepare(`
        SELECT DISTINCT session_id, MIN(created_at) as created_at
        FROM messages 
        GROUP BY session_id
        ORDER BY created_at DESC
    `).all();

    res.json(sessionsFromDB); 
});

// Get messages for specific session
app.get('/api/sessions/:sessionId/messages', (req, res) => {
    const { sessionId } = req.params;
    const db = tools.getDB();
    
    const messages = db.prepare(`
        SELECT * FROM messages 
        WHERE session_id = ? AND role != 'system'
        ORDER BY created_at ASC
    `).all(sessionId);
    
    res.json(messages);
});

// Send message
app.post('/api/chat', async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        
        if (!sessionId || !message) {
            return res.status(400).json({ error: 'sessionId and message are required' });
        }
        
        const db = tools.getDB();
        
        // Save user message
        db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)')
            .run(sessionId, 'user', message);
        
        // Get conversation history
        const history = db.prepare(`
            SELECT role, content FROM messages 
            WHERE session_id = ? AND role != 'system'
            ORDER BY created_at ASC
        `).all(sessionId);
        
        // Process message with Agent
        console.log('Processing message...');
        const response = await processMessage(history);
        
        // Ensure content exists
        const content = response.content || 'Sorry, I could not process your request.';
        
        // Save assistant response
        db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)')
            .run(sessionId, 'assistant', content);
        
        // Save tool calls if found
        if (response.toolCalls && response.toolCalls.length > 0) {
            for (let i = 0; i < response.toolCalls.length; i++) {
                db.prepare('INSERT INTO tool_calls (session_id, name, args_json, result_json) VALUES (?, ?, ?, ?)')
                    .run(
                        sessionId,
                        response.toolCalls[i].name,
                        JSON.stringify(response.toolCalls[i].args),
                        JSON.stringify(response.toolResults[i])
                    );
            }
        }
        
        console.log('Response sent successfully');
        res.json({
            content: content,
            toolCalls: response.toolCalls || [],
            toolResults: response.toolResults || []
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        
        // Understandable error messages
        let errorMessage = 'An unexpected error occurred';
        
        if (error.message.includes('API key')) {
            errorMessage = '❌ Invalid API key. Make sure .env file is configured correctly';
        } else if (error.message.includes('quota')) {
            errorMessage = '❌ API quota exceeded. Check your account balance';
        } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
            errorMessage = '❌ Network connection error';
        } else if (error.message.includes('Ollama') || error.message.includes('localhost:11434')) {
            errorMessage = '❌ Cannot connect to Ollama. Make sure Ollama is running on http://localhost:11434';
        } else {
            errorMessage = `❌ Error: ${error.message}`;
        }
        
        res.status(500).json({ error: errorMessage, content: errorMessage });
    }
});

// Delete session
app.delete('/api/sessions/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const db = tools.getDB();
    
    db.prepare('DELETE FROM messages WHERE session_id = ?').run(sessionId);
    db.prepare('DELETE FROM tool_calls WHERE session_id = ?').run(sessionId);
    
    res.json({ success: true });
});


app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
