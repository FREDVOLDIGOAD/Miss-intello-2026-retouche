import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const payload = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', payload.identifier).single();

    // ... (code fetch payload au dessus)

    if (tx && tx.status !== 'Succès') {
      await supabase.rpc('confirm_vote_transaction', {
        p_transaction_id: tx.id,
        p_payment_ref: payload.payment_reference,
        p_payment_method: payload.payment_method, // T-Money ou Flooz
        p_phone: payload.phone_number || tx.phone_number,
        p_tx_ref: payload.tx_reference
      });
    }

    }
    return new Response("OK", { status: 200 });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
});ss