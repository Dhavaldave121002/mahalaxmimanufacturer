-- ==============================================================================
-- MAHALAXMI ENTERPRISES - COMPLETE PRODUCTION MYSQL DATABASE SCHEMA
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB, AWS RDS, Hostinger, cPanel, PlanetScale
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `image` VARCHAR(255),
  `theme_color` VARCHAR(20) DEFAULT '#1E293B',
  `icon_name` VARCHAR(50) DEFAULT 'layers',
  `product_count_text` VARCHAR(50) DEFAULT '3 Products',
  `is_featured_in_app` BOOLEAN DEFAULT TRUE,
  `display_order` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cat_slug` (`slug`),
  INDEX `idx_cat_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `sku` VARCHAR(50) NOT NULL UNIQUE,
  `category_id` VARCHAR(50) NOT NULL,
  `category_name` VARCHAR(100) NOT NULL,
  `subcategory` VARCHAR(100) NOT NULL,
  `mrp` DECIMAL(10,2) NOT NULL,
  `retail_price` DECIMAL(10,2) NOT NULL,
  `stock` INT NOT NULL DEFAULT 100,
  `moq` INT NOT NULL DEFAULT 1,
  `rating` DECIMAL(3,2) DEFAULT 4.80,
  `review_count` INT DEFAULT 12,
  `is_bestseller` BOOLEAN DEFAULT FALSE,
  `is_direct_mill_deal` BOOLEAN DEFAULT TRUE,
  `is_trending` BOOLEAN DEFAULT FALSE,
  `is_app_exclusive` BOOLEAN DEFAULT FALSE,
  `hsn_code` VARCHAR(20) DEFAULT '630221',
  `gst_rate` DECIMAL(4,2) DEFAULT 5.00,
  `short_description` TEXT,
  `description` LONGTEXT,
  `images` JSON NOT NULL,
  `tags` JSON,
  `specifications` JSON,
  `wholesale_tiers` JSON,
  `variants` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_prod_cat` (`category_id`),
  INDEX `idx_prod_sku` (`sku`),
  INDEX `idx_prod_app_exclusive` (`is_app_exclusive`),
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. APP CAROUSEL BANNERS TABLE (Drives Flutter App Home Slider)
CREATE TABLE IF NOT EXISTS `app_banners` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `category` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` TEXT NOT NULL,
  `tag` VARCHAR(100) NOT NULL,
  `cta` VARCHAR(100) NOT NULL,
  `image` VARCHAR(255) NOT NULL,
  `gradient_from` VARCHAR(20) NOT NULL,
  `gradient_via` VARCHAR(20),
  `gradient_to` VARCHAR(20) NOT NULL,
  `accent_color` VARCHAR(20) NOT NULL,
  `icon_name` VARCHAR(50) DEFAULT 'kitchen',
  `badge_icon` VARCHAR(50) DEFAULT 'star',
  `is_active` BOOLEAN DEFAULT TRUE,
  `display_order` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_banner_order` (`display_order`),
  INDEX `idx_banner_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. APP GLOBAL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS `app_settings` (
  `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `app_name` VARCHAR(100) DEFAULT 'Mahalaxmi Enterprises',
  `app_version` VARCHAR(20) DEFAULT '1.0.3+4',
  `min_supported_version` VARCHAR(20) DEFAULT '1.0.0',
  `maintenance_mode` BOOLEAN DEFAULT FALSE,
  `maintenance_message` TEXT,
  `support_phone` VARCHAR(30) DEFAULT '+91 85111 72099',
  `support_email` VARCHAR(100) DEFAULT 'dhavaldave121002@gmail.com',
  `whatsapp_number` VARCHAR(30) DEFAULT '918511172099',
  `flash_sale_active` BOOLEAN DEFAULT TRUE,
  `flash_sale_tag` VARCHAR(255) DEFAULT 'DIWALI MILL DHAMAKA - UP TO 45% WHOLESALE',
  `catalog_download_url` VARCHAR(255) DEFAULT 'https://mahalaxmimanufacturer.vercel.app/catalog.pdf',
  `gst_notice` TEXT,
  `local_flutter_project_path` VARCHAR(255) DEFAULT 'C:\\mahalaxmi_enterprises',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. APP PUSH NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS `app_notifications` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `target_category` VARCHAR(100),
  `type` ENUM('OFFER', 'ORDER', 'SYSTEM', 'PRICE_DROP') DEFAULT 'OFFER',
  `is_sent` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. USERS TABLE (Consumers, Retailers, Wholesalers, Admins)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(30) NOT NULL,
  `password_hash` VARCHAR(255),
  `role` ENUM('consumer', 'retailer', 'wholesaler', 'admin') DEFAULT 'consumer',
  `business_type` VARCHAR(50) DEFAULT 'Individual',
  `company_name` VARCHAR(150),
  `gst_number` VARCHAR(20),
  `is_gst_verified` BOOLEAN DEFAULT FALSE,
  `credit_limit` DECIMAL(12,2) DEFAULT 0.00,
  `available_credit` DECIMAL(12,2) DEFAULT 0.00,
  `wallet_balance` DECIMAL(12,2) DEFAULT 0.00,
  `wallet_transactions` JSON,
  `addresses` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_email` (`email`),
  INDEX `idx_user_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. ORDERS TABLE (Both Web and Mobile App Orders)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` VARCHAR(50),
  `source` ENUM('WEB', 'FLUTTER_APP') DEFAULT 'WEB',
  `device_info` VARCHAR(150),
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_email` VARCHAR(150) NOT NULL,
  `customer_phone` VARCHAR(30) NOT NULL,
  `company_name` VARCHAR(150),
  `gst_number` VARCHAR(20),
  `is_b2b` BOOLEAN DEFAULT FALSE,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `cgst` DECIMAL(10,2) DEFAULT 0.00,
  `sgst` DECIMAL(10,2) DEFAULT 0.00,
  `igst` DECIMAL(10,2) DEFAULT 0.00,
  `total_tax` DECIMAL(10,2) DEFAULT 0.00,
  `shipping_charge` DECIMAL(10,2) DEFAULT 0.00,
  `discount` DECIMAL(10,2) DEFAULT 0.00,
  `coupon_code` VARCHAR(50),
  `total_amount` DECIMAL(12,2) NOT NULL,
  `payment_method` ENUM('UPI', 'COD', 'NET_BANKING', 'CREDIT_30_DAYS') DEFAULT 'UPI',
  `payment_status` ENUM('PAID', 'PENDING', 'REFUNDED', 'CREDIT_APPROVED') DEFAULT 'PAID',
  `status` ENUM('PLACED', 'MILL_PROCESSING', 'PACKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED') DEFAULT 'PLACED',
  `shipping_address` JSON NOT NULL,
  `billing_address` JSON NOT NULL,
  `tracking_number` VARCHAR(100),
  `courier_name` VARCHAR(100),
  `estimated_delivery` TIMESTAMP NULL,
  `timeline` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_order_source` (`source`),
  INDEX `idx_order_status` (`status`),
  INDEX `idx_order_number` (`order_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `order_id` VARCHAR(50) NOT NULL,
  `product_id` VARCHAR(50) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `sku` VARCHAR(50) NOT NULL,
  `hsn_code` VARCHAR(20),
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `total_price` DECIMAL(12,2) NOT NULL,
  `variant_description` VARCHAR(255),
  `image` VARCHAR(255),
  `gst_rate` DECIMAL(4,2) DEFAULT 5.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. WHOLESALE QUOTATIONS (RFQ) TABLE
CREATE TABLE IF NOT EXISTS `quotations` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `quote_number` VARCHAR(50) NOT NULL UNIQUE,
  `buyer_name` VARCHAR(150) NOT NULL,
  `company_name` VARCHAR(150) NOT NULL,
  `gst_number` VARCHAR(20),
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `business_type` VARCHAR(50) NOT NULL,
  `items` JSON NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `estimated_tax` DECIMAL(10,2) NOT NULL,
  `estimated_freight` DECIMAL(10,2) NOT NULL,
  `grand_total` DECIMAL(12,2) NOT NULL,
  `status` ENUM('PENDING', 'PREPARED', 'ACCEPTED', 'REJECTED', 'CONVERTED') DEFAULT 'PENDING',
  `notes` TEXT,
  `prepared_by` VARCHAR(100),
  `valid_until` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. BUSINESS LEADS & ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS `business_enquiries` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `business_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `business_type` VARCHAR(50) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `expected_monthly_volume` VARCHAR(50),
  `interested_categories` JSON,
  `notes` TEXT,
  `status` ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED') DEFAULT 'NEW',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- INITIAL SEED DATA FOR CATEGORIES
-- ==============================================================================
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image`, `theme_color`, `icon_name`, `product_count_text`, `is_featured_in_app`, `display_order`)
VALUES
  ('home-kitchen', 'Home and kitchen', 'home-kitchen', 'Direct mill kitchen towels, dining aprons, and table linen.', 'assets/images/banner_home_kitchen.jpg', '#F59E0B', 'kitchen', '3 Products', TRUE, 1),
  ('household', 'Household', 'household', 'Household cleaning cloths, laundry bags, and cotton organizers.', 'assets/images/banner_household.jpg', '#10B981', 'cleaning', '3 Products', TRUE, 2),
  ('textile', 'Textile', 'textile', '300 TC Combed cotton bedsheets, woven fabrics, and curtain linen.', 'assets/images/banner_textile.jpg', '#3B82F6', 'checkroom', '3 Products', TRUE, 3),
  ('cotton-products', 'Cotton products', 'cotton-products', 'Super-plush 600 GSM bath towels and durable tote bags.', 'assets/images/banner_cotton.jpg', '#8B5CF6', 'spa', '3 Products', TRUE, 4)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `theme_color`=VALUES(`theme_color`);

-- ==============================================================================
-- INITIAL SEED DATA FOR APP CAROUSEL BANNERS
-- ==============================================================================
INSERT INTO `app_banners` (`id`, `category`, `title`, `subtitle`, `tag`, `cta`, `image`, `gradient_from`, `gradient_via`, `gradient_to`, `accent_color`, `icon_name`, `badge_icon`, `is_active`, `display_order`)
VALUES
  ('banner-kitchen', 'Home and kitchen', 'Home & Kitchen', 'Kitchen Towels, Aprons & Table Linen', 'KITCHEN & DINING', 'Shop Wholesale', 'assets/images/banner_home_kitchen.jpg', '#0F172A', '#1E293B', '#334155', '#F59E0B', 'kitchen', 'star', TRUE, 1),
  ('banner-household', 'Household', 'Household Care', 'Cleaning Cloths, Storage & Laundry', 'DAILY ESSENTIALS', 'Bulk Packs', 'assets/images/banner_household.jpg', '#064E3B', '#047857', '#059669', '#10B981', 'cleaning', 'verified', TRUE, 2),
  ('banner-textile', 'Textile', 'Luxury Textiles', 'Double Bedsheets, Curtains & Fabrics', 'PREMIUM LINEN', 'Explore Fabrics', 'assets/images/banner_textile.jpg', '#312E81', '#4338CA', '#6366F1', '#818CF8', 'checkroom', 'diamond', TRUE, 3),
  ('banner-cotton', 'Cotton products', 'Pure Cotton Collection', 'Ultra-Soft Bath Towels & Canvas Bags', '100% PURE COTTON', 'Direct Mill Rates', 'assets/images/banner_cotton.jpg', '#881337', '#9F1239', '#BE123C', '#FBBF24', 'spa', 'eco', TRUE, 4)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `tag`=VALUES(`tag`), `cta`=VALUES(`cta`);

-- ==============================================================================
-- INITIAL SEED DATA FOR APP GLOBAL SETTINGS
-- ==============================================================================
INSERT INTO `app_settings` (`id`, `app_name`, `app_version`, `min_supported_version`, `maintenance_mode`, `maintenance_message`, `support_phone`, `support_email`, `whatsapp_number`, `flash_sale_active`, `flash_sale_tag`, `catalog_download_url`, `gst_notice`, `local_flutter_project_path`)
VALUES
  (1, 'Mahalaxmi Enterprises', '1.0.3+4', '1.0.0', FALSE, 'Mahalaxmi Mill servers are undergoing scheduled routine maintenance. App ordering will resume shortly.', '+91 85111 72099', 'dhavaldave121002@gmail.com', '918511172099', TRUE, 'DIWALI MILL DHAMAKA - UP TO 45% WHOLESALE', 'https://mahalaxmimanufacturer.vercel.app/catalog.pdf', '100% Verified Input Tax Credit (ITC) invoices available for all commercial business orders.', 'C:\\mahalaxmi_enterprises')
ON DUPLICATE KEY UPDATE `app_name`=VALUES(`app_name`);
