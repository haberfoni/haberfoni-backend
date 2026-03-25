-- Enable free translation for all bot sources
UPDATE bot_settings SET use_free_translate = 1;

-- Hide empty ad slots by default as requested
UPDATE settings SET `value` = 'false' WHERE `key` = 'show_empty_ads';
