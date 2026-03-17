-- ArchDraw Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Component categories
CREATE TABLE IF NOT EXISTS public.component_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#94a3b8',
  icon TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Component templates (the draggable components)
CREATE TABLE IF NOT EXISTS public.component_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.component_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#94a3b8',
  icon TEXT,
  technology TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diagrams (user's architecture diagrams)
CREATE TABLE IF NOT EXISTS public.diagrams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Diagram',
  description TEXT,
  nodes JSONB DEFAULT '[]'::jsonb,
  edges JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{"showGrid": true, "edgeAnimations": true, "darkMode": false}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diagram versions (for history/undo)
CREATE TABLE IF NOT EXISTS public.diagram_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diagram_id UUID REFERENCES public.diagrams(id) ON DELETE CASCADE NOT NULL,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log (track every action)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diagrams_user_id ON public.diagrams(user_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_updated_at ON public.diagrams(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagram_versions_diagram_id ON public.diagram_versions(diagram_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagram_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Component categories: Public read, authenticated write
CREATE POLICY "Anyone can read categories" ON public.component_categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert categories" ON public.component_categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update categories" ON public.component_categories
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Component templates: Public read, authenticated write
CREATE POLICY "Anyone can read templates" ON public.component_templates
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert templates" ON public.component_templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update templates" ON public.component_templates
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Diagrams: Owner full control, optional public read
CREATE POLICY "Users can read own diagrams" ON public.diagrams
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert diagrams" ON public.diagrams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diagrams" ON public.diagrams
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diagrams" ON public.diagrams
  FOR DELETE USING (auth.uid() = user_id);

-- Diagram versions: Owner only
CREATE POLICY "Users can read own versions" ON public.diagram_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.diagrams WHERE id = diagram_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own versions" ON public.diagram_versions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.diagrams WHERE id = diagram_id AND user_id = auth.uid())
  );

-- Activity log: User can read own, system can insert
CREATE POLICY "Users can read own activity" ON public.activity_log
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert activity" ON public.activity_log
  FOR INSERT WITH CHECK (true);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, details)
  VALUES (
    (SELECT id FROM auth.users() LIMIT 1),
    p_action,
    p_entity_type,
    p_entity_id,
    p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Default component categories
INSERT INTO public.component_categories (name, color, icon, display_order) VALUES
  ('Client', '#3b82f6', 'Monitor', 1),
  ('Server', '#8b5cf6', 'Server', 2),
  ('Database', '#10b981', 'Database', 3),
  ('Cache', '#f59e0b', 'Zap', 4),
  ('Queue', '#ec4899', 'Mail', 5),
  ('Storage', '#06b6d4', 'HardDrive', 6),
  ('Security', '#ef4444', 'Shield', 7),
  ('Network', '#6366f1', 'Globe', 8),
  ('Analytics', '#14b8a6', 'BarChart', 9),
  ('Integration', '#a855f7', 'Plug', 10)
ON CONFLICT DO NOTHING;

-- Default component templates
INSERT INTO public.component_templates (category_id, name, description, color, icon, technology)
SELECT 
  c.id,
  t.name,
  t.description,
  t.color,
  t.icon,
  t.technology
FROM (
  VALUES
    ('Client', 'Web Client', 'Browser-based web application', '#3b82f6', 'Globe', 'React'),
    ('Client', 'Mobile App', 'iOS or Android application', '#3b82f6', 'Smartphone', 'React Native'),
    ('Client', 'Desktop App', 'Native desktop application', '#3b82f6', 'Monitor', 'Electron'),
    ('Server', 'API Gateway', 'API gateway for routing', '#8b5cf6', 'ArrowLeftRight', 'Kong'),
    ('Server', 'REST API', 'RESTful API service', '#8b5cf6', 'Server', 'Express'),
    ('Server', 'GraphQL API', 'GraphQL API service', '#8b5cf6', 'Server', 'Apollo'),
    ('Server', 'Microservice', 'Individual microservice', '#8b5cf6', 'Box', 'Node.js'),
    ('Server', 'Load Balancer', 'Distributes traffic', '#8b5cf6', 'Scale', 'Nginx'),
    ('Database', 'PostgreSQL', 'Relational database', '#10b981', 'Database', 'PostgreSQL'),
    ('Database', 'MySQL', 'Relational database', '#10b981', 'Database', 'MySQL'),
    ('Database', 'MongoDB', 'NoSQL database', '#10b981', 'Database', 'MongoDB'),
    ('Database', 'Redis', 'In-memory data store', '#f59e0b', 'Zap', 'Redis'),
    ('Cache', 'Redis Cache', 'Distributed cache', '#f59e0b', 'Zap', 'Redis'),
    ('Cache', 'Memcached', 'Memory caching', '#f59e0b', 'Zap', 'Memcached'),
    ('Queue', 'RabbitMQ', 'Message queue', '#ec4899', 'Mail', 'RabbitMQ'),
    ('Queue', 'Kafka', 'Event streaming', '#ec4899', 'Activity', 'Kafka'),
    ('Queue', 'SQS', 'AWS Simple Queue Service', '#ec4899', 'Mail', 'AWS SQS'),
    ('Storage', 'S3', 'Object storage', '#06b6d4', 'HardDrive', 'AWS S3'),
    ('Storage', 'Blob Storage', 'Binary large object storage', '#06b6d4', 'HardDrive', 'Azure Blob'),
    ('Storage', 'File Storage', 'Network file system', '#06b6d4', 'Folder', 'NFS'),
    ('Security', 'Auth Service', 'Authentication service', '#ef4444', 'Shield', 'Auth0'),
    ('Security', 'IAM', 'Identity and access management', '#ef4444', 'Key', 'AWS IAM'),
    ('Security', 'VPN', 'Virtual private network', '#ef4444', 'Lock', 'OpenVPN'),
    ('Network', 'CDN', 'Content delivery network', '#6366f1', 'Globe', 'CloudFlare'),
    ('Network', 'DNS', 'Domain name system', '#6366f6', 'Globe', 'Route53'),
    ('Network', 'Firewall', 'Network firewall', '#6366f1', 'Shield', 'AWS WAF'),
    ('Analytics', 'Analytics', 'Data analytics', '#14b8a6', 'BarChart', 'Mixpanel'),
    ('Analytics', 'Logging', 'Log aggregation', '#14b8a6', 'FileText', 'ELK'),
    ('Analytics', 'Monitoring', 'System monitoring', '#14b8a6', 'Activity', 'Datadog'),
    ('Integration', 'Webhook', 'HTTP callback', '#a855f7', 'Webhook', 'Webhook'),
    ('Integration', 'API Integration', 'Third-party API', '#a855f7', 'Plug', 'REST')
) AS t(name, description, color, icon, technology)
JOIN public.component_categories c ON c.name = t.category
ON CONFLICT DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_diagrams_updated_at ON public.diagrams;
CREATE TRIGGER update_diagrams_updated_at
  BEFORE UPDATE ON public.diagrams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
