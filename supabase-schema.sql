-- ============================================
-- KARAMAN MEDİKAL STOK TAKİP SİSTEMİ
-- Supabase Database Schema
-- ============================================

-- 1. USERS TABLE (Custom authentication table)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password TEXT NOT NULL, -- Bcrypt hashed password
    role TEXT NOT NULL DEFAULT 'depo' CHECK (role IN ('yönetici', 'depo', 'satış')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    barcode TEXT UNIQUE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_url TEXT,
    unit_type TEXT DEFAULT 'adet' CHECK (unit_type IN ('adet', 'kutu')),
    package_quantity INTEGER, -- Kutu içeriği adedi
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for products
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_low_stock ON products(quantity, min_quantity);

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    notes TEXT,
    total_spent DECIMAL(10,2) DEFAULT 0,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for customer search
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_deleted ON customers(deleted);

-- 4. SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    items JSONB NOT NULL, -- Array of sale items [{product_id, name, quantity, price, total}]
    total_amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('nakit', 'kredi_karti')),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    cashier_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sales
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_cashier_id ON sales(cashier_id);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);

-- 5. CALENDAR EVENTS TABLE
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMPTZ NOT NULL,
    alarm BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for calendar events
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_date ON calendar_events(date);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
-- Allow users to read all users
CREATE POLICY "Users can view all users"
    ON users FOR SELECT
    USING (true);

-- Allow admins to update users
CREATE POLICY "Admins can update users"
    ON users FOR UPDATE
    USING (auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'yönetici'));

-- Allow admins to delete users
CREATE POLICY "Admins can delete users"
    ON users FOR DELETE
    USING (auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'yönetici'));

-- PRODUCTS POLICIES
-- Everyone can read products
CREATE POLICY "Everyone can view products"
    ON products FOR SELECT
    USING (true);

-- Only admins can insert products
CREATE POLICY "Only admins can insert products"
    ON products FOR INSERT
    WITH CHECK (auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'yönetici'));

-- Only admins can update products
CREATE POLICY "Only admins can update products"
    ON products FOR UPDATE
    USING (auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'yönetici'));

-- Only admins can delete products
CREATE POLICY "Only admins can delete products"
    ON products FOR DELETE
    USING (auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'yönetici'));

-- CUSTOMERS POLICIES
-- Everyone can view customers (excluding soft-deleted)
CREATE POLICY "Everyone can view active customers"
    ON customers FOR SELECT
    USING (deleted = FALSE OR deleted IS NULL);

-- Everyone can insert customers
CREATE POLICY "Everyone can insert customers"
    ON customers FOR INSERT
    WITH CHECK (true);

-- Everyone can update customers
CREATE POLICY "Everyone can update customers"
    ON customers FOR UPDATE
    USING (true);

-- Only admins can delete customers
CREATE POLICY "Only admins can delete customers"
    ON customers FOR DELETE
    USING (auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'yönetici'));

-- SALES POLICIES
-- Everyone can view sales
CREATE POLICY "Everyone can view sales"
    ON sales FOR SELECT
    USING (true);

-- Everyone can insert sales
CREATE POLICY "Everyone can insert sales"
    ON sales FOR INSERT
    WITH CHECK (true);

-- CALENDAR EVENTS POLICIES
-- Users can only view their own events
CREATE POLICY "Users can view their own events"
    ON calendar_events FOR SELECT
    USING (user_id::text = auth.uid()::text);

-- Users can insert their own events
CREATE POLICY "Users can insert their own events"
    ON calendar_events FOR INSERT
    WITH CHECK (user_id::text = auth.uid()::text);

-- Users can update their own events
CREATE POLICY "Users can update their own events"
    ON calendar_events FOR UPDATE
    USING (user_id::text = auth.uid()::text);

-- Users can delete their own events
CREATE POLICY "Users can delete their own events"
    ON calendar_events FOR DELETE
    USING (user_id::text = auth.uid()::text);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for products updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEFAULT ADMIN USER
-- ============================================
-- Note: Password hash for 'Admin123!'
-- You'll need to generate this using bcrypt with your application
-- This is a placeholder - will be created via frontend or API call

INSERT INTO users (username, email, password, role) 
VALUES (
    'admin',
    'admin@stokcrm.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eidgV.wQ.GKG', -- Admin123!
    'yönetici'
) ON CONFLICT (username) DO NOTHING;

-- ============================================
-- SAMPLE TEST DATA (Optional)
-- ============================================

-- Insert 5 medical products
INSERT INTO products (name, barcode, brand, category, quantity, min_quantity, purchase_price, sale_price, description, unit_type, package_quantity) VALUES
('Dijital Tansiyon Aleti', '8691234567890', 'Omron', 'Medikal Cihaz', 15, 5, 350.00, 499.00, 'Otomatik dijital tansiyon ölçüm cihazı, koldan ölçüm, hafızalı', 'adet', NULL),
('İnfrared Ateş Ölçer', '8691234567891', 'Braun', 'Medikal Cihaz', 8, 10, 180.00, 289.00, 'Temassız infrared termometre, hızlı ve hassas ölçüm', 'adet', NULL),
('Steril Eldiven Lateks', '8691234567892', 'Medline', 'Medikal Sarf', 50, 20, 25.00, 45.00, 'Lateks steril eldiven, tek kullanımlık, medium boy', 'kutu', 100),
('Nebulizatör Cihazı', '8691234567893', 'Beurer', 'Medikal Cihaz', 3, 5, 420.00, 649.00, 'Kompresörlü nebulizatör, solunum tedavisi için', 'adet', NULL),
('Kan Şekeri Test Çubuğu', '8691234567894', 'Accu-Chek', 'Medikal Sarf', 25, 15, 85.00, 135.00, '50 adet test çubuğu, glikoz ölçümü için', 'kutu', 50)
ON CONFLICT (barcode) DO NOTHING;

-- Insert 5 customers
INSERT INTO customers (name, phone, email, address, notes) VALUES
('Ayşe Yılmaz', '05321234567', 'ayse.yilmaz@email.com', 'Kadıköy, İstanbul', 'Kurumsal müşteri, aylık sipariş'),
('Mehmet Demir', '05339876543', 'mehmet.demir@email.com', 'Çankaya, Ankara', 'Toptan alım yapar'),
('Fatma Şahin', '05447891234', 'fatma.sahin@email.com', 'Konak, İzmir', 'Perakende müşteri'),
('Ali Kara', '05551234567', 'ali.kara@email.com', 'Nilüfer, Bursa', 'Kurumsal anlaşma var'),
('Zeynep Arslan', '05667894561', 'zeynep.arslan@email.com', 'Seyhan, Adana', 'Aylık düzenli alım')
ON CONFLICT DO NOTHING;

-- ============================================
-- NOTES
-- ============================================
-- 1. Auth sistemi custom users tablosu kullanıyor (Supabase Auth yerine)
-- 2. Password bcrypt ile hash'lenmeli
-- 3. RLS policies aktif - güvenlik için önemli
-- 4. Tüm tarih/saat değerleri UTC timezone kullanıyor
-- 5. Sales.items JSONB formatında array of objects
-- 6. Customers soft delete kullanıyor (deleted flag)
