# 🍽️ CampusBites - QR-Based Canteen Ordering System

A modern, full-stack canteen ordering system built with React, TypeScript, and Supabase. Students can scan QR codes at their tables to browse menus, place orders, and track their order status in real-time. Admins can manage menus, process orders, and track payments through an intuitive dashboard.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [Usage Flow](#-usage-flow)
- [Technical Architecture](#-technical-architecture)
- [Database Schema](#-database-schema)
- [API Integration](#-api-integration)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Student Features
- 📱 **QR Code Scanning**: Scan QR codes at tables to access the menu
- 🍕 **Menu Browsing**: Browse menu items by categories with images and prices
- 🛒 **Shopping Cart**: Add items to cart, modify quantities, and remove items
- 💳 **Checkout**: Place orders with payment method selection (COD/UPI)
- 📊 **Order Tracking**: Real-time order status updates with progress tracking
- 👤 **User Profile**: View order history and profile information
- 🔔 **Real-time Updates**: Receive instant notifications when order status changes

### Admin Features
- 📊 **Dashboard**: View statistics and quick actions
- 🍽️ **Menu Management**: Add, edit, and delete menu items with images
- 📦 **Order Management**: Accept, prepare, mark ready, and complete orders
- 💰 **Payment Tracking**: Track payment status and mark payments as successful
- 🔢 **Token Generation**: Automatic token generation for orders (T001, T002, etc.)
- 👥 **User Management**: View and manage student accounts
- 🖨️ **QR Code Generation**: Generate QR codes for tables
- 🍳 **Kitchen Display**: Real-time kitchen display for active orders

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router DOM** - Navigation
- **React Query (TanStack Query)** - Data fetching and caching
- **Tailwind CSS** - Styling
- **Vite** - Build tool and dev server

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication (Email/Password)
  - Row Level Security (RLS)
  - Realtime subscriptions
  - Storage (for menu images)
  - REST API

### State Management
- **React Context API** - Cart state management
- **React Query** - Server state management

## 📦 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **Supabase Account** (free tier works)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Ritikmandal13/CampusBites.git
cd CampusBites
```

### 2. Install Dependencies

```bash
cd web
npm install
```

### 3. Set Up Supabase

1. Create a new project at [Supabase](https://supabase.com)
2. Go to Project Settings → API
3. Copy your Project URL and anon/public key

### 4. Configure Environment Variables

Create a `.env.local` file in the `web/` directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Set Up Database

Run the following SQL migrations in your Supabase SQL Editor:

#### Create Tables

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  canteen_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canteens table
CREATE TABLE canteens (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items table
CREATE TABLE menu_items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  image_path TEXT,
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  canteen_id BIGINT REFERENCES canteens(id),
  prep_time_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QR Codes table
CREATE TABLE qr_codes (
  id BIGSERIAL PRIMARY KEY,
  qr_id TEXT UNIQUE NOT NULL,
  canteen_id BIGINT REFERENCES canteens(id),
  table_no TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT,
  token TEXT,
  user_id UUID REFERENCES auth.users,
  canteen_id BIGINT REFERENCES canteens(id),
  source_qr_id TEXT,
  table_no TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  payment_status TEXT CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
  order_status TEXT CHECK (order_status IN ('NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
  notes TEXT,
  estimated_ready_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items table
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id BIGINT REFERENCES menu_items(id),
  name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Create Functions

```sql
-- is_admin function
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = uid AND p.role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- generate_order_token function
CREATE OR REPLACE FUNCTION generate_order_token(p_canteen_id BIGINT)
RETURNS TEXT AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_token_num INTEGER;
  v_token TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(token FROM 'T(\d+)') AS INTEGER)), 0) + 1
  INTO v_token_num
  FROM orders
  WHERE canteen_id = p_canteen_id
    AND DATE(created_at) = v_today
    AND token IS NOT NULL
    AND token ~ '^T\d+$';
  
  IF v_token_num IS NULL THEN
    v_token_num := 1;
  END IF;
  
  v_token := 'T' || LPAD(v_token_num::TEXT, 3, '0');
  
  RETURN v_token;
END;
$$ LANGUAGE PLPGSQL;
```

#### Set Up RLS Policies

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- Menu items policies
CREATE POLICY menu_items_select ON menu_items FOR SELECT USING (is_available = true OR is_admin(auth.uid()));
CREATE POLICY menu_items_admin_all ON menu_items FOR ALL USING (is_admin(auth.uid()));

-- Orders policies
CREATE POLICY orders_student_select ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY orders_student_insert ON orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY orders_admin_all ON orders FOR ALL USING (is_admin(auth.uid()));

-- Order items policies
CREATE POLICY order_items_student_select ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
);
CREATE POLICY order_items_student_insert ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
);
CREATE POLICY order_items_admin_all ON order_items FOR ALL USING (is_admin(auth.uid()));
```

#### Set Up Storage

1. Go to Storage in Supabase Dashboard
2. Create a bucket named `menu-images`
3. Set it to **Public**
4. Create storage policies:
   - **Allow authenticated uploads**: `bucket_id = 'menu-images'`
   - **Allow authenticated reads**: `bucket_id = 'menu-images'`
   - **Allow authenticated updates**: `bucket_id = 'menu-images'`
   - **Allow authenticated deletes**: `bucket_id = 'menu-images'`

### 6. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
CampusBites/
├── web/                          # Main web application
│   ├── src/
│   │   ├── lib/                  # Utilities and configurations
│   │   │   ├── constants.ts      # Shared constants
│   │   │   ├── hooks.ts          # React Query hooks
│   │   │   ├── supabaseClient.ts # Supabase client setup
│   │   │   └── types.ts          # TypeScript type definitions
│   │   ├── pages/                # Page components
│   │   │   ├── AdminMenu.tsx     # Admin menu management
│   │   │   ├── AdminOrders.tsx   # Admin order management
│   │   │   ├── AdminUsers.tsx    # Admin user management
│   │   │   ├── Auth.tsx          # Login/Register
│   │   │   ├── Checkout.tsx      # Checkout page
│   │   │   ├── Dashboards.tsx    # Admin dashboard
│   │   │   ├── Home.tsx          # Home page
│   │   │   ├── Menu.tsx          # Menu page
│   │   │   ├── Order.tsx         # QR order page
│   │   │   └── OrderTracking.tsx # Order tracking page
│   │   ├── store/                # State management
│   │   │   └── CartContext.tsx   # Cart context provider
│   │   └── ui/                   # UI components
│   │       ├── App.tsx           # Main app component
│   │       └── components/       # Reusable components
│   ├── public/                   # Static assets
│   ├── package.json              # Dependencies
│   └── vite.config.ts            # Vite configuration
├── plan.md                       # Project planning document
└── README.md                     # This file
```

## 🔄 Usage Flow

### Student Flow

1. **Scan QR Code**
   - Student scans QR code at their table
   - Redirected to menu page for that specific QR/canteen

2. **Browse Menu**
   - View available menu items by category
   - See item details, images, and prices
   - Filter by category (Snacks, Beverages, Main Course, etc.)

3. **Add to Cart**
   - Click "Add" button on menu items
   - Items are added to cart
   - View cart by clicking cart icon

4. **Checkout**
   - Review cart items and quantities
   - Select payment method (COD/UPI)
   - Add special instructions (optional)
   - Place order

5. **Order Tracking**
   - Automatically redirected to order tracking page
   - View order status in real-time:
     - NEW → ACCEPTED → PREPARING → READY → COMPLETED
   - See token number when order is accepted
   - View estimated ready time
   - Track payment status

### Admin Flow

1. **Login**
   - Admin logs in with credentials
   - Redirected to admin dashboard

2. **Dashboard**
   - View statistics (total orders, revenue, etc.)
   - Quick access to orders, menu, and users

3. **Menu Management**
   - Add new menu items with:
     - Name, price, category
     - Image upload
     - Description
     - Preparation time
   - Edit existing items
   - Delete items
   - Toggle availability

4. **Order Management**
   - View all orders in a table
   - Filter by status or payment method
   - Search by order number, token, or user
   - Update order status:
     - **Accept**: Accept order and generate token
     - **Preparing**: Mark as being prepared
     - **Ready**: Mark as ready for pickup
     - **Complete**: Mark as completed (auto-updates payment for COD)
   - Generate token manually for orders without tokens
   - View table numbers for QR-based orders

5. **User Management**
   - View all registered users
   - See user roles and canteen assignments
   - Manage user accounts

6. **QR Code Management**
   - Generate QR codes for tables
   - Assign QR codes to canteens and table numbers

## 🏗️ Technical Architecture

### Frontend Architecture

- **Component-Based**: Modular React components
- **Context API**: Cart state management
- **React Query**: Server state management with caching
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling

### Backend Architecture

- **Supabase**: BaaS platform providing:
  - PostgreSQL database
  - Authentication
  - Row Level Security
  - Realtime subscriptions
  - Storage
  - REST API

### Data Flow

1. **Authentication**: Supabase Auth handles user authentication
2. **Data Fetching**: React Query hooks fetch data from Supabase REST API
3. **State Management**: Cart state in React Context, server state in React Query
4. **Real-time Updates**: Supabase Realtime subscriptions for order status updates
5. **File Uploads**: Supabase Storage for menu images

### Security

- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure API access
- **Role-Based Access**: Admin vs Student roles
- **Environment Variables**: Sensitive data in `.env.local`

## 🗄️ Database Schema

### Key Tables

1. **profiles**: User profiles with roles
2. **canteens**: Canteen information
3. **menu_items**: Menu items with images and pricing
4. **qr_codes**: QR code mappings to tables
5. **orders**: Order information with status tracking
6. **order_items**: Individual items in each order

### Relationships

- `profiles` → `orders` (one-to-many)
- `canteens` → `menu_items` (one-to-many)
- `canteens` → `orders` (one-to-many)
- `orders` → `order_items` (one-to-many)
- `menu_items` → `order_items` (one-to-many)
- `qr_codes` → `canteens` (many-to-one)

## 🔌 API Integration

### Supabase REST API

The application uses Supabase REST API endpoints:

- `GET /rest/v1/menu_items` - Fetch menu items
- `POST /rest/v1/orders` - Create order
- `PATCH /rest/v1/orders` - Update order status
- `GET /rest/v1/orders` - Fetch orders
- `POST /rest/v1/rpc/generate_order_token` - Generate order token
- `POST /storage/v1/object/menu-images` - Upload menu images

### Custom Hooks

- `useMenu()` - Fetch menu items
- `useOrdersAdmin()` - Fetch orders for admin
- `useMyProfile()` - Fetch user profile

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd web
   vercel
   ```

3. **Set Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Netlify Deployment

1. **Build the project**
   ```bash
   cd web
   npm run build
   ```

2. **Deploy to Netlify**
   - Connect GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

### Other Platforms

The application can be deployed to any static hosting service:
- GitHub Pages
- Firebase Hosting
- AWS S3 + CloudFront
- Azure Static Web Apps

## 🧪 Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@campusbites.com or open an issue in the GitHub repository.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing BaaS platform
- [React](https://react.dev) for the UI library
- [Tailwind CSS](https://tailwindcss.com) for the styling framework
- [Vite](https://vitejs.dev) for the build tool

## 📊 Future Enhancements

- [ ] Payment gateway integration (Razorpay/Paytm)
- [ ] Push notifications for order updates
- [ ] Multi-language support
- [ ] Order analytics and reports
- [ ] Inventory management
- [ ] Staff management system
- [ ] Mobile app (React Native)
- [ ] Admin mobile app
- [ ] Order rating and reviews
- [ ] Loyalty program
- [ ] Discount coupons
- [ ] Order scheduling
- [ ] Multi-canteen support

---

**Made with ❤️ by Ritik Mandal**

