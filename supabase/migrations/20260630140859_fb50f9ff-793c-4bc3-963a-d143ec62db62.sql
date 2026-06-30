
-- Remove empty categories (keep IPTV which has products)
DELETE FROM categories WHERE slug IN ('receivers','dishes','lnb','cables','accessories');

-- Update IPTV sort order
UPDATE categories SET sort_order = 100 WHERE slug = 'iptv';

-- Insert new categories
INSERT INTO categories (slug, name_en, name_ar, name_ur, sort_order, is_active) VALUES
('bein-ranwel', 'BeIN Boxes & Ranwel Receivers', 'أجهزة beIN ورسيفرات Ranwel', 'beIN باکسز اور Ranwel ریسیورز', 1, true),
('satellite-receivers', 'Satellite Receivers', 'رسيفرات الستلايت', 'سیٹلائٹ ریسیورز', 2, true),
('android-tv-boxes', 'Android TV Boxes', 'أجهزة أندرويد TV', 'اینڈرائیڈ ٹی وی باکسز', 3, true),
('mobile-accessories', 'Mobile Accessories', 'إكسسوارات الجوال', 'موبائل لوازمات', 4, true),
('tp-link', 'TP-Link Products', 'منتجات TP-Link', 'TP-Link مصنوعات', 5, true),
('cctv', 'CCTV Equipment', 'كاميرات المراقبة', 'سی سی ٹی وی آلات', 6, true),
('keyboards-mice', 'Keyboards & Mice', 'لوحات المفاتيح والفأرة', 'کی بورڈز اور ماؤس', 7, true),
('power-adapters', 'Power Adapters', 'محولات الطاقة', 'پاور اڈاپٹرز', 8, true),
('new-tvs', 'New TVs (65" & 75")', 'شاشات جديدة (65" و 75")', 'نئے ٹی ویز (65" اور 75")', 9, true),
('ip-cameras', 'IP Cameras', 'كاميرات IP', 'آئی پی کیمرے', 10, true),
('video-intercom', 'Video Intercom Systems', 'أنظمة الإنتركم بالفيديو', 'ویڈیو انٹرکام سسٹمز', 11, true),
('multiswitches', 'Multiswitches', 'موزعات Multiswitch', 'ملٹی سوئچز', 12, true),
('remote-controls', 'Remote Controls', 'أجهزة التحكم عن بعد', 'ریموٹ کنٹرولز', 13, true);
