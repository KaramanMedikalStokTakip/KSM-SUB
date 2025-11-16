import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

// ============================================
// AUTH FUNCTIONS
// ============================================

export const loginUser = async (username, password) => {
  // Call Supabase RPC function to verify password
  const { data, error } = await supabase
    .rpc('verify_user_password', {
      p_username: username,
      p_password: password
    });

  if (error) throw new Error('Giriş hatası: ' + error.message);
  if (!data || data.length === 0) throw new Error('Kullanıcı adı veya şifre hatalı');

  const result = data[0];

  // Check if password matches
  if (!result.password_match) {
    throw new Error('Kullanıcı adı veya şifre hatalı');
  }

  // Return user data without password_match field
  const { password_match, ...userWithoutPassword } = result;
  return userWithoutPassword;
};

export const registerUser = async (username, email, password, role = 'depo') => {
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        username,
        email,
        password: hashedPassword,
        role
      }
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Bu kullanıcı adı zaten kullanılıyor');
    throw new Error('Kayıt başarısız');
  }

  const { password: _, ...userWithoutPassword } = data;
  return userWithoutPassword;
};

// ============================================
// USERS FUNCTIONS
// ============================================

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateUser = async (userId, updates) => {
  const updateData = {};
  
  if (updates.username) updateData.username = updates.username;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.role) updateData.role = updates.role;
  if (updates.password) {
    updateData.password = await bcrypt.hash(updates.password, 10);
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('id, username, email, role, created_at')
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Bu kullanıcı adı zaten kullanılıyor');
    throw error;
  }

  return data;
};

export const deleteUser = async (userId) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
  return { message: 'Kullanıcı silindi' };
};

// ============================================
// PRODUCTS FUNCTIONS
// ============================================

export const getAllProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};

export const getProductByBarcode = async (barcode) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .single();

  if (error) throw new Error('Ürün bulunamadı');
  return data;
};

export const getLowStockProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .filter('quantity', 'lte', 'min_quantity')
    .order('quantity', { ascending: true });

  if (error) throw error;
  return data;
};

export const createProduct = async (productData) => {
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Bu barkod zaten mevcut');
    throw error;
  }

  return data;
};

export const updateProduct = async (productId, updates) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProduct = async (productId) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) throw error;
  return { message: 'Ürün silindi' };
};

export const getProductFilters = async () => {
  const { data: products, error } = await supabase
    .from('products')
    .select('brand, category');

  if (error) throw error;

  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  return { brands, categories };
};

// ============================================
// CUSTOMERS FUNCTIONS
// ============================================

export const getAllCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('deleted', false)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};

export const searchCustomers = async (query) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('deleted', false)
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('name', { ascending: true })
    .limit(100);

  if (error) throw error;
  return data;
};

export const createCustomer = async (customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCustomer = async (customerId, updates) => {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCustomer = async (customerId) => {
  // Soft delete
  const { data, error } = await supabase
    .from('customers')
    .update({ deleted: true })
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;
  return { message: 'Müşteri silindi' };
};

export const getCustomerPurchases = async (customerId) => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data;
};

// ============================================
// SALES FUNCTIONS
// ============================================

export const getAllSales = async (startDate = null, endDate = null) => {
  let query = supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });

  if (startDate && endDate) {
    query = query
      .gte('created_at', startDate)
      .lte('created_at', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createSale = async (saleData) => {
  const { data, error } = await supabase
    .from('sales')
    .insert([saleData])
    .select()
    .single();

  if (error) throw error;

  // Update product quantities
  for (const item of saleData.items) {
    const { error: updateError } = await supabase.rpc('decrement_product_quantity', {
      product_id: item.product_id,
      quantity_to_subtract: item.quantity
    });
    
    // If RPC doesn't exist, use regular update
    if (updateError) {
      const { data: product } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', item.product_id)
        .single();
      
      await supabase
        .from('products')
        .update({ quantity: product.quantity - item.quantity })
        .eq('id', item.product_id);
    }
  }

  // Update customer total_spent
  if (saleData.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('total_spent')
      .eq('id', saleData.customer_id)
      .single();
    
    await supabase
      .from('customers')
      .update({ total_spent: (customer?.total_spent || 0) + saleData.final_amount })
      .eq('id', saleData.customer_id);
  }

  return data;
};

// ============================================
// CALENDAR EVENTS FUNCTIONS
// ============================================

export const getCalendarEvents = async (userId, startDate = null, endDate = null) => {
  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (startDate && endDate) {
    query = query
      .gte('date', startDate)
      .lte('date', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createCalendarEvent = async (eventData) => {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert([eventData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCalendarEvent = async (eventId, updates) => {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCalendarEvent = async (eventId) => {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
  return { message: 'Etkinlik silindi' };
};

// ============================================
// REPORTS FUNCTIONS
// ============================================

export const getDashboardStats = async () => {
  // Get total products
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  // Get low stock count
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('id')
    .filter('quantity', 'lte', 'min_quantity');

  // Get today's sales
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: todaySales } = await supabase
    .from('sales')
    .select('final_amount')
    .gte('created_at', today.toISOString());

  // Get week sales
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: weekSales } = await supabase
    .from('sales')
    .select('final_amount')
    .gte('created_at', weekAgo.toISOString());

  const todayRevenue = todaySales?.reduce((sum, sale) => sum + parseFloat(sale.final_amount), 0) || 0;
  const weekRevenue = weekSales?.reduce((sum, sale) => sum + parseFloat(sale.final_amount), 0) || 0;

  return {
    total_products: totalProducts || 0,
    low_stock_count: lowStockProducts?.length || 0,
    today_sales_count: todaySales?.length || 0,
    today_revenue: todayRevenue,
    week_sales_count: weekSales?.length || 0,
    week_revenue: weekRevenue
  };
};

export const getStockReport = async (brand = null, category = null) => {
  let query = supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });

  if (brand) query = query.ilike('brand', `%${brand}%`);
  if (category) query = query.ilike('category', `%${category}%`);

  const { data: products, error } = await query;
  if (error) throw error;

  const reportData = products.map(product => ({
    name: product.name,
    barcode: product.barcode,
    brand: product.brand,
    category: product.category,
    quantity: product.quantity,
    unit_type: product.unit_type || 'adet',
    min_quantity: product.min_quantity,
    purchase_price: product.purchase_price,
    sale_price: product.sale_price,
    stock_value: product.quantity * product.purchase_price,
    status: product.quantity <= product.min_quantity ? 'Düşük Stok' : 'Normal'
  }));

  const totalValue = reportData.reduce((sum, item) => sum + item.stock_value, 0);
  const totalItems = reportData.reduce((sum, item) => sum + item.quantity, 0);

  return {
    products: reportData,
    summary: {
      total_products: reportData.length,
      total_items: totalItems,
      total_value: Math.round(totalValue * 100) / 100,
      filters_applied: { brand, category }
    }
  };
};

export const getTopSellingProducts = async (startDate, endDate, limit = 10) => {
  const { data: sales, error } = await supabase
    .from('sales')
    .select('items')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) throw error;

  // Aggregate product sales
  const productSales = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.product_id]) {
        productSales[item.product_id] = {
          _id: item.product_id,
          product_name: item.name,
          total_quantity: 0,
          total_revenue: 0
        };
      }
      productSales[item.product_id].total_quantity += item.quantity;
      productSales[item.product_id].total_revenue += item.total;
    });
  });

  return Object.values(productSales)
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, limit);
};

export const getTopProfitProducts = async (startDate, endDate, limit = 10) => {
  const { data: sales, error } = await supabase
    .from('sales')
    .select('items')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) throw error;

  // Get all products for purchase price lookup
  const { data: products } = await supabase
    .from('products')
    .select('id, purchase_price');

  const productPriceMap = {};
  products.forEach(p => {
    productPriceMap[p.id] = p.purchase_price;
  });

  // Calculate profits
  const productProfits = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const purchasePrice = productPriceMap[item.product_id] || 0;
      const profit = (item.price - purchasePrice) * item.quantity;

      if (!productProfits[item.product_id]) {
        productProfits[item.product_id] = {
          product_id: item.product_id,
          product_name: item.name,
          total_profit: 0,
          total_quantity: 0
        };
      }
      productProfits[item.product_id].total_profit += profit;
      productProfits[item.product_id].total_quantity += item.quantity;
    });
  });

  return Object.values(productProfits)
    .sort((a, b) => b.total_profit - a.total_profit)
    .slice(0, limit);
};

// ============================================
// CURRENCY API (External)
// ============================================

export const getCurrencyRates = async () => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
    const data = await response.json();
    const rates = data.rates;

    const usd_try = Math.round((1 / rates.USD) * 100) / 100;
    const eur_try = Math.round((1 / rates.EUR) * 100) / 100;

    return {
      usd_try,
      eur_try,
      gold_try: 5400.0, // Fallback value
      silver_try: 62.5, // Fallback value
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      usd_try: 35.50,
      eur_try: 38.20,
      gold_try: 5400.0,
      silver_try: 62.5,
      timestamp: new Date().toISOString()
    };
  }
};
