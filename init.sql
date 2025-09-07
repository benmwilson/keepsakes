-- Keepsakes Database Schema
-- This script initializes the Postgres database for the Keepsakes application

-- Create the main tables
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    hero_image_url TEXT,
    hero_color VARCHAR(7),
    instructions TEXT,
    consent_required BOOLEAN DEFAULT true,
    paused BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    skip_next BOOLEAN DEFAULT false,
    skip_prev BOOLEAN DEFAULT false,
    autoplay_delay INTEGER DEFAULT 5000,
    transition_duration INTEGER DEFAULT 1000,
    gallery_transition_duration INTEGER DEFAULT 2000,
    gallery_item_delay INTEGER DEFAULT 1000,
    restart_autoplay TIMESTAMP WITH TIME ZONE,
    allow_downloads BOOLEAN DEFAULT true,
    enabled_keepsake_types JSONB DEFAULT '{"photo": true, "video": true, "text": true, "gallery": true}',
    show_captions BOOLEAN DEFAULT true,
    show_author_names BOOLEAN DEFAULT true,
    enable_fullscreen BOOLEAN DEFAULT true,
    mobile_grid_columns INTEGER DEFAULT 2,
    gallery_size_limit INTEGER DEFAULT 10,
    email_registration_enabled BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS keepsakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('photo', 'video', 'text', 'gallery')),
    file_url TEXT,
    file_urls JSONB,
    text TEXT,
    caption TEXT,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pinned BOOLEAN DEFAULT false,
    hidden BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS guest_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    has_consented BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
    category VARCHAR(20) NOT NULL CHECK (category IN ('upload', 'guest', 'admin', 'system')),
    message TEXT NOT NULL,
    data JSONB,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    event_slug VARCHAR(255),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_keepsakes_event_id ON keepsakes(event_id);
CREATE INDEX IF NOT EXISTS idx_keepsakes_type ON keepsakes(type);
CREATE INDEX IF NOT EXISTS idx_keepsakes_created_at ON keepsakes(created_at);
CREATE INDEX IF NOT EXISTS idx_guest_emails_event_id ON guest_emails(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_emails_email ON guest_emails(email);
CREATE INDEX IF NOT EXISTS idx_logs_event_id ON logs(event_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_category ON logs(category);

-- Insert a default event for testing
INSERT INTO events (slug, name, subtitle, hero_image_url, instructions, consent_required, paused)
VALUES (
    'my-event',
    'My Special Event',
    'Celebrating Together!',
    'https://placehold.co/1200x600.png',
    'Share your favorite memory from this event! It can be a photo, a short video, or a heartfelt message. We''ll be showing these on a big screen during the event.',
    true,
    false
) ON CONFLICT (slug) DO NOTHING;

