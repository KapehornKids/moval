
-- Function to update a user's wallet balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance(_user_id UUID, _amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's wallet balance
  UPDATE public.wallets
  SET 
    balance = balance + _amount,
    updated_at = now()
  WHERE user_id = _user_id;
END;
$$;
