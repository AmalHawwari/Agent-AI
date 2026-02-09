// Tools File - Contains all tools used by the Agent
const Database = require('better-sqlite3');
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '..', 'db', 'library.db');
let db;

// Function to get database connection
function getDB() {
    if (!db) {
        db = new Database(dbPath);
    }
    return db;
}

// ===== TOOLS =====

// 1. Search for books
function find_books({ q, by }) {
    const db = getDB();
    
    // by can be "title" or "author"
    const searchBy = by || 'title';
    const searchTerm = `%${q}%`;
    
    let query;
    if (searchBy === 'title') {
        query = db.prepare('SELECT * FROM books WHERE title LIKE ?');
    } else {
        query = db.prepare('SELECT * FROM books WHERE author LIKE ?');
    }
    
    const results = query.all(searchTerm);
    return results;
}

// 2. Create new order
function create_order({ customer_id, items }) {
    const db = getDB();
    
    // Verify customer exists
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
    if (!customer) {
        return { success: false, error: 'Customer not found' };
    }
    
    // Process items - handle both ISBN and title
    const processedItems = [];
    for (const item of items) {
        let book;
        
        // Try to find by ISBN first
        if (item.isbn) {
            book = db.prepare('SELECT * FROM books WHERE isbn = ?').get(item.isbn);
        } 
        // If no ISBN, try to find by title
        else if (item.title) {
            book = db.prepare('SELECT * FROM books WHERE title LIKE ?').get(`%${item.title}%`);
        }
        
        if (!book) {
            const identifier = item.isbn || item.title || 'unknown';
            return { success: false, error: `Book "${identifier}" not found in inventory` };
        }
        
        if (book.stock < item.qty) {
            return { success: false, error: `Insufficient stock for "${book.title}". Available: ${book.stock}, Requested: ${item.qty}` };
        }
        
        processedItems.push({ isbn: book.isbn, qty: item.qty, price: book.price, title: book.title });
    }
    
    // Create order
    const insertOrder = db.prepare('INSERT INTO orders (customer_id, status) VALUES (?, ?)');
    const orderResult = insertOrder.run(customer_id, 'pending');
    const order_id = orderResult.lastInsertRowid;
    
    // Add order items and reduce stock
    const insertItem = db.prepare('INSERT INTO order_items (order_id, isbn, qty, price_at_purchase) VALUES (?, ?, ?, ?)');
    const updateStock = db.prepare('UPDATE books SET stock = stock - ? WHERE isbn = ?');
    
    for (const item of processedItems) {
        insertItem.run(order_id, item.isbn, item.qty, item.price);
        updateStock.run(item.qty, item.isbn);
    }
    
    return { 
        success: true, 
        order_id: order_id,
        customer_id: customer_id,
        items: processedItems.map(i => ({ title: i.title, qty: i.qty, price: i.price })),
        message: `Order #${order_id} created successfully`
    };
}

// 3. Restock book
function restock_book({ isbn, qty }) {
    const db = getDB();
    
    // Verify book exists
    const book = db.prepare('SELECT * FROM books WHERE isbn = ?').get(isbn);
    if (!book) {
        return { success: false, error: 'Book not found' };
    }
    
    // Update stock
    const update = db.prepare('UPDATE books SET stock = stock + ? WHERE isbn = ?');
    update.run(qty, isbn);
    
    // Get new stock
    const updatedBook = db.prepare('SELECT * FROM books WHERE isbn = ?').get(isbn);
    
    return { 
        success: true, 
        title: updatedBook.title,
        new_stock: updatedBook.stock,
        message: `Added ${qty} copies of "${updatedBook.title}". New stock: ${updatedBook.stock}`
    };
}

// 4. Update book price
function update_price({ isbn, price }) {
    const db = getDB();
    
    // Verify book exists
    const book = db.prepare('SELECT * FROM books WHERE isbn = ?').get(isbn);
    if (!book) {
        return { success: false, error: 'Book not found' };
    }
    
    const oldPrice = book.price;
    
    // Update price
    const update = db.prepare('UPDATE books SET price = ? WHERE isbn = ?');
    update.run(price, isbn);
    
    return { 
        success: true, 
        title: book.title,
        old_price: oldPrice,
        new_price: price,
        message: `Updated price of "${book.title}" from ${oldPrice} to ${price}`
    };
}

// 5. Order status
function order_status({ order_id }) {
    const db = getDB();
    
    // Get order
    const order = db.prepare(`
        SELECT o.*, c.name as customer_name, c.email as customer_email
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
    `).get(order_id);
    
    if (!order) {
        return { success: false, error: 'Order not found' };
    }
    
    // Get order items
    const items = db.prepare(`
        SELECT oi.*, b.title, b.author
        FROM order_items oi
        JOIN books b ON oi.isbn = b.isbn
        WHERE oi.order_id = ?
    `).all(order_id);
    
    // Calculate total
    let total = 0;
    for (const item of items) {
        total += item.price_at_purchase * item.qty;
    }
    
    return {
        success: true,
        order_id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        status: order.status,
        created_at: order.created_at,
        items: items,
        total: total.toFixed(2)
    };
}

// 6. Inventory summary
function inventory_summary() {
    const db = getDB();
    
    // Get books with low stock
    const lowStockBooks = db.prepare('SELECT * FROM books WHERE stock < 10 ORDER BY stock ASC').all();
    
    // Get total books
    const totalBooks = db.prepare('SELECT COUNT(*) as count FROM books').get();
    const totalStock = db.prepare('SELECT SUM(stock) as total FROM books').get();
    
    return {
        success: true,
        low_stock_books: lowStockBooks,
        total_titles: totalBooks.count,
        total_stock: totalStock.total,
        message: `${lowStockBooks.length} books have low stock (less than 10)`
    };
}

// Export tools
module.exports = {
    find_books,
    create_order,
    restock_book,
    update_price,
    order_status,
    inventory_summary,
    getDB
};
