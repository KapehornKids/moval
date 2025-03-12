
-- Function to update a user's wallet balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance(user_id_param UUID, amount_param NUMERIC)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the user's wallet balance
  UPDATE public.wallets
  SET 
    balance = balance + amount_param,
    updated_at = now()
  WHERE user_id = user_id_param;
END;
$$;
