
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://twcyxfcqlrggxulmopkt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3l4ZmNxbHJnZ3h1bG1vcGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjA4MDQsImV4cCI6MjA4NjAzNjgwNH0.rltcz6Bir55nEj1j95MeEsbSIl7pXOXaSQE0m6tN4OE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
