-- Database Schema for PT. Indo Tungkal Net (ITNET) ISP Management System
-- Database: MariaDB

-- 1. ERP & Admin
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    permissions JSON
);

CREATE TABLE staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role_id INT,
    email VARCHAR(100),
    phone VARCHAR(20),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 2. CRM & Customer Data
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_code VARCHAR(20) UNIQUE, -- e.g., ITN-0001
    full_name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    identity_number VARCHAR(50), -- KTP/SIM
    status ENUM('lead', 'active', 'suspended', 'terminated') DEFAULT 'lead',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Subscriptions & Plans
CREATE TABLE plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    speed_mbps INT NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    description TEXT
);

CREATE TABLE subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    plan_id INT,
    pppoe_username VARCHAR(50),
    pppoe_password VARCHAR(50),
    installation_date DATE,
    billing_date INT DEFAULT 1, -- Day of month
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- 4. Financials (Laporan Keuangan)
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT,
    invoice_number VARCHAR(50) UNIQUE,
    amount DECIMAL(15, 2) NOT NULL,
    period_start DATE,
    period_end DATE,
    due_date DATE,
    status ENUM('unpaid', 'paid', 'overdue', 'cancelled') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50),
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    expense_date DATE,
    staff_id INT,
    FOREIGN KEY (staff_id) REFERENCES staff(id)
);

-- 5. Inventory
CREATE TABLE inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    brand VARCHAR(50),
    category ENUM('router', 'onu', 'cable', 'sfp', 'other'),
    total_quantity INT DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'pcs'
);

CREATE TABLE stock_units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT,
    serial_number VARCHAR(100) UNIQUE,
    status ENUM('in_stock', 'deployed', 'faulty', 'returned') DEFAULT 'in_stock',
    customer_id INT, -- If deployed
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- 6. Maintenance & Customer Service
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    assigned_staff_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
);

CREATE TABLE maintenance_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT,
    activity TEXT,
    staff_id INT,
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id)
);
