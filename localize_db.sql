-- Update Categories
UPDATE categories SET name_en = 'Current' WHERE slug = 'gundem';
UPDATE categories SET name_en = 'Economy' WHERE slug = 'ekonomi';
UPDATE categories SET name_en = 'Sport' WHERE slug = 'spor';
UPDATE categories SET name_en = 'Technology' WHERE slug = 'teknoloji';
UPDATE categories SET name_en = 'Health' WHERE slug = 'saglik';
UPDATE categories SET name_en = 'Culture' WHERE slug = 'kultur';
UPDATE categories SET name_en = 'World' WHERE slug = 'dunya';
UPDATE categories SET name_en = 'Politics' WHERE slug = 'politika';
UPDATE categories SET name_en = 'Life' WHERE slug = 'yasam';
UPDATE categories SET name_en = 'Education' WHERE slug = 'egitim';
UPDATE categories SET name_en = 'Magazine' WHERE slug = 'magazin';
UPDATE categories SET name_en = 'Automobile' WHERE slug = 'otomobil';

-- Update Footer Sections
UPDATE footer_sections SET title_en = 'Corporate' WHERE title = 'Kurumsal';
UPDATE footer_sections SET title_en = 'Categories' WHERE title = 'Kategoriler';

-- Update Footer Links
UPDATE footer_links SET title_en = 'About Us' WHERE title = 'Hakkımızda';
UPDATE footer_links SET title_en = 'Contact' WHERE title = 'İletişim';
UPDATE footer_links SET title_en = 'Advertise' WHERE title = 'Reklam';
UPDATE footer_links SET title_en = 'Imprint' WHERE title = 'Künye';
