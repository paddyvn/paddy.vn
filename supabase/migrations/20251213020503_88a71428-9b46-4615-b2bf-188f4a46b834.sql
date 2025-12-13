-- Create pets table for Boss feature
CREATE TABLE public.pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL, -- 'dog', 'cat', etc.
  breed TEXT,
  age_years INTEGER,
  age_months INTEGER,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Users can view their own pets
CREATE POLICY "Users can view own pets" 
ON public.pets 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own pets
CREATE POLICY "Users can create own pets" 
ON public.pets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pets
CREATE POLICY "Users can update own pets" 
ON public.pets 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own pets
CREATE POLICY "Users can delete own pets" 
ON public.pets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_pets_updated_at
BEFORE UPDATE ON public.pets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for pet photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pet-photos', 'pet-photos', true);

-- Storage policies for pet photos
CREATE POLICY "Anyone can view pet photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'pet-photos');

CREATE POLICY "Users can upload pet photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pet-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own pet photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'pet-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own pet photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'pet-photos' AND auth.uid()::text = (storage.foldername(name))[1]);