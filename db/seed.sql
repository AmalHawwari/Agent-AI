-- Insert 10 books
INSERT INTO books (isbn, title, author, price, stock) VALUES
('978-0-13-468599-1', 'Clean Code', 'Robert C. Martin', 35.99, 15),
('978-0-201-63361-0', 'The Pragmatic Programmer', 'Andrew Hunt', 42.99, 8),
('978-0-596-51774-8', 'JavaScript: The Good Parts', 'Douglas Crockford', 25.99, 20),
('978-1-491-95038-0', 'You Dont Know JS', 'Kyle Simpson', 29.99, 12),
('978-0-13-235088-4', 'Clean Architecture', 'Robert C. Martin', 39.99, 5),
('978-1-449-33192-4', 'Eloquent JavaScript', 'Marijn Haverbeke', 31.99, 18),
('978-0-596-00712-6', 'Head First Design Patterns', 'Eric Freeman', 44.99, 7),
('978-0-13-468741-4', 'The Clean Coder', 'Robert C. Martin', 33.99, 10),
('978-1-491-90400-0', 'Learning Python', 'Mark Lutz', 49.99, 3),
('978-0-321-12521-7', 'Domain-Driven Design', 'Eric Evans', 54.99, 6);

-- Insert 6 customers
INSERT INTO customers (name, email) VALUES
('Ahmed Mohamed', 'ahmed@example.com'),
('Sarah Ali', 'sara@example.com'),
('Mohamed Khaled', 'mohamed@example.com'),
('Noor Hassan', 'noor@example.com'),
('Yassir Amin', 'yaser@example.com'),
('Rana Fouad', 'rana@example.com');

-- Insert 4 orders
INSERT INTO orders (customer_id, status) VALUES
(1, 'completed'),
(2, 'pending'),
(3, 'completed'),
(4, 'processing');

-- Insert order items
INSERT INTO order_items (order_id, isbn, qty, price_at_purchase) VALUES
(1, '978-0-13-468599-1', 2, 35.99),
(1, '978-0-596-51774-8', 1, 25.99),
(2, '978-1-491-95038-0', 3, 29.99),
(3, '978-0-201-63361-0', 1, 42.99),
(3, '978-0-13-235088-4', 2, 39.99),
(4, '978-1-449-33192-4', 1, 31.99);
