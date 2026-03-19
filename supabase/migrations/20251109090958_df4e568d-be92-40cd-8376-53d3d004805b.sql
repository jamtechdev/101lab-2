-- Create listings table to track each transaction
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('surplus', 'waste')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'inspection', 'bidding', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Listings policies
CREATE POLICY "Users can view all listings"
  ON public.listings
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own listings"
  ON public.listings
  FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Users can update their own listings"
  ON public.listings
  FOR UPDATE
  USING (seller_id = auth.uid());

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('seller', 'buyer')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat messages policies
CREATE POLICY "Users can view messages for listings they're involved in"
  ON public.chat_messages
  FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM public.listings WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for listings
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();