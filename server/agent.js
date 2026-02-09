// Agent File - Using Ollama (Free)
const tools = require('./tools');

// Available tools information
const toolsInfo = `
Available Tools:

1. find_books(q, by) - Search for books
   - q: Search text
   - by: "title" or "author"
   Example: {"tool": "find_books", "args": {"q": "Clean Code", "by": "title"}}

2. create_order(customer_id, items) - Create an order
   - customer_id: Customer ID (1-6)
   - items: List of {title: "book title", qty: 1} OR {isbn: "...", qty: 1}
   Example (with title): {"tool": "create_order", "args": {"customer_id": 2, "items": [{"title": "Clean Code", "qty": 3}]}}
   Example (with isbn): {"tool": "create_order", "args": {"customer_id": 2, "items": [{"isbn": "978-0-13-468599-1", "qty": 3}]}}

3. restock_book(isbn, qty) - Add inventory
   Example: {"tool": "restock_book", "args": {"isbn": "978-0-13-468599-1", "qty": 10}}

4. update_price(isbn, price) - Update book price
   Example: {"tool": "update_price", "args": {"isbn": "978-0-13-468599-1", "price": 29.99}}

5. order_status(order_id) - Check order status
   Example: {"tool": "order_status", "args": {"order_id": 1}}

6. inventory_summary() - Show low stock books
   Example: {"tool": "inventory_summary", "args": {}}
`;

// System Prompt
const systemPrompt = `[SYSTEM LANGUAGE REQUIREMENT: ALL RESPONSES MUST BE IN ENGLISH]

You are an intelligent assistant for the "Library Desk" library system.

LANGUAGE RULE (CRITICAL): 
- Write ONLY in English
- Do NOT write in Arabic, Chinese, or any other language
- All text output MUST be English
- ALL responses MUST be English

${toolsInfo}

Available Customers:
1. Ahmed Mohamed (id: 1)
2. Sarah Ali (id: 2)
3. Mohamed Khaled (id: 3)
4. Noor Hassan (id: 4)
5. Yassir Amin (id: 5)
6. Rana Fouad (id: 6)

Response Format Rules:
- When a tool is needed: respond with {"tool": "tool_name", "args": {...}}
- When no tool needed: respond with {"response": "your message in ENGLISH"}
- Do not add any text before or after JSON
- Every word must be in English

EXAMPLES OF CORRECT ENGLISH RESPONSES:
- {"response": "I found Clean Code by Robert Martin with ISBN 978-0-13-468599-1. It has 30 copies in stock."}
- {"tool": "find_books", "args": {"q": "Clean Code", "by": "title"}}
- {"tool": "create_order", "args": {"customer_id": 2, "items": [{"title": "Clean Code", "qty": 3}]}}
- {"response": "I have successfully created order #5 for Sarah Ali with 3 copies of Clean Code at $35.99 each."}
- {"response": "I have successfully added 10 copies to inventory. Total available: 50 copies."}
- {"response": "Order status for order 1: Customer Sarah Ali ordered 2 books for total $59.98."}

EXAMPLES OF WRONG RESPONSES (DO NOT DO THIS):
- Do not respond in Arabic like: "هناك كتب titled Clean Code"
- Do not mix languages
- Do not translate to Arabic
- Always use English words and phrases`;

// Function to call Ollama
async function callOllama(messages) {
    const model = process.env.OLLAMA_MODEL || 'llama3.2';
    
    const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            messages: messages,
            stream: false,
            options: {
                temperature: 0.1
            }
        })
    });
    
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to connect to Ollama: ${text}`);
    }
    
    const data = await response.json();
    return data.message.content;
}

// Function to extract JSON from text
function extractJSON(text) {
    try {
        return JSON.parse(text.trim());
    } catch {
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch {
                return null;
            }
        }
        return null;
    }
}

// Function to process message
async function processMessage(sessionMessages) {
    try {
        const messages = [
            { role: 'system', content: systemPrompt },
            ...sessionMessages
        ];
        
        console.log('Using Ollama...');
        const aiResponse = await callOllama(messages);
        
        console.log('Raw AI response:', aiResponse);
        
        const parsed = extractJSON(aiResponse);
		
        if (parsed && parsed.tool) {
            const toolName = parsed.tool;
            const args = parsed.args || {};
            
            console.log(`Executing: ${toolName}`, args);
            
            let toolResult;
            if (tools[toolName]) {
                toolResult = tools[toolName](args);
            } else {
                toolResult = { error: `Tool ${toolName} not found` };
            }
            
            console.log('Result:', JSON.stringify(toolResult, null, 2));
            
            // Request summary of the result
            const summary = await callOllama([
                { role: 'user', content: `Result of ${toolName}:\n${JSON.stringify(toolResult, null, 2)}\n\nSummarize this result for the user clearly and concisely. Do not use JSON in your response.` }
            ]);
            
            return {
                content: summary.replace(/\{[\s\S]*?\}/g, '').trim() || summary,
                toolCalls: [{ name: toolName, args }],
                toolResults: [toolResult]
            };
        }
        
        // Response without tool
        const text = parsed?.response || aiResponse.replace(/\{[\s\S]*?\}/g, '').trim() || aiResponse;
        
        return {
            content: text,
            toolCalls: [],
            toolResults: []
        };
        
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

module.exports = { processMessage, systemPrompt };
