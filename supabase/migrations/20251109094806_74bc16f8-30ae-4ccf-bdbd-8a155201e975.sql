-- Create messages table for buyer-seller communication
CREATE TABLE public.listing_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('buyer', 'seller')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.listing_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read messages (public Q&A style)
CREATE POLICY "Anyone can view listing messages" 
ON public.listing_messages 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to create messages (for now, can be restricted later with auth)
CREATE POLICY "Anyone can create listing messages" 
ON public.listing_messages 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries by listing_id
CREATE INDEX idx_listing_messages_listing_id ON public.listing_messages(listing_id);
CREATE INDEX idx_listing_messages_created_at ON public.listing_messages(created_at DESC);

-- Enable realtime
ALTER TABLE public.listing_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listing_messages;