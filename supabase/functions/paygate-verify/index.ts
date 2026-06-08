import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { identifier } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Chercher la transaction
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', identifier).maybeSingle();

    if (!tx) return new Response(JSON.stringify({ error: "Transaction introuvable" }), { status: 404, headers: corsHeaders });
    if (tx.status === 'Succès') return new Response(JSON.stringify({ success: true, message: "Déjà validé" }), { headers: corsHeaders });

    // 2. Interroger l'API PayGate pour savoir si c'est payé
    const pgRes = await fetch("https://paygateglobal.com/api/v1/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: Deno.env.get('PAYGATE_TOKEN'),
        tx_reference: tx.transaction_ref
      })
    });
    
    const pgData = await pgRes.json();

    // Si PayGate dit 0 (Succès)
    if (String(pgData.status) === "0") {
      await supabase.rpc('confirm_vote_transaction', {
        p_transaction_id: tx.id,
        p_payment_ref: pgData.payment_reference || "VERIF_MANUELLE",
        p_payment_method: pgData.payment_method || tx.service,
        p_phone: pgData.phone_number || tx.phone_number,
        p_tx_ref: tx.transaction_ref
      });
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: false, message: "Paiement non encore détecté" }), { headers: corsHeaders });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});