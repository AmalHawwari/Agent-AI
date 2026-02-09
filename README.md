# 📚 Library Desk Agent - AI Library Helper

An AI Agent project for managing a library.

## 🎯 Goal

Build a local chat interface for a "Library Desk" agent that can answer questions and perform actions via tools that read/write to a database.

## 🏗️ Project Structure

```
/app        - User Interface (Frontend)
/server     - Server and Tools (Backend)
/db         - Database (SQLite)
/prompts    - System Prompt
```

## 🗄️ Database

### Main Tables:
- **books** - Books (isbn, title, author, price, stock)
- **customers** - Customers (id, name, email)
- **orders** - Orders (id, customer_id, status)
- **order_items** - Order items (order_id, isbn, qty)

### Chat Tables:
- **messages** - Chat messages (session_id, role, content)
- **tool_calls** - Tool execution records

## 🔧 Available Tools

| Tool | Description |
|------|-------------|
| `find_books` | Search for books by title or author |
| `create_order` | Create a new order and reduce stock |
| `restock_book` | Add inventory for a book |
| `update_price` | Update book price |
| `order_status` | Get order details and status |
| `inventory_summary` | Show low stock books |

## 🚀 Setup Instructions

### 1. Install Ollama (One-time setup)

- Go to: https://ollama.com/download
- Download and install Ollama
- In Terminal, run:
```bash
ollama pull llama3.2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment File

```bash
cp .env.example .env
```

### 4. Setup Database

```bash
npm run setup-db
```

### 5. Run Ollama (In separate terminal)

```bash
ollama serve
```

### 6. Run Project (In another terminal)

```bash
npm start
```

Then open: http://localhost:3000

## 💡 Usage Examples

1. **Search for books:**
   > "Search for Clean Code books"

2. **Create an order:**
   > "Create an order for customer 2 with 3 copies of Clean Code"

3. **Restock:**
   > "Add 10 copies of The Pragmatic Programmer to inventory"

4. **Order status:**
   > "What is the status of order 1?"

5. **Inventory summary:**
   > "Show low stock books"

## 📋 Sample Data

- **10 books** - Famous programming books
- **6 customers**
- **4 orders**

## 🛠️ Technology Stack

- **Backend:** Node.js, Express
- **Database:** SQLite (better-sqlite3)
- **AI:** Ollama (llama3.2) - Free, Local
- **Frontend:** HTML, CSS, JavaScript (Vanilla)

## 📝 Features

- No login required
- Works locally only
- Simple and beginner-friendly
- Free (no API costs)

---

**Created for Assessment** 🚀
