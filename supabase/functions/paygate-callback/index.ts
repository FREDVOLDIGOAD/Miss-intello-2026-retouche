import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // 1. Si on ouvre juste le lien dans un navigateur (GET), on affiche un message simple au lieu de planter
  if (req.method === "GET") {
    return new Response("Le pont PayGate est actif. En attente de paiements...", { status: 200 });
  }

  try {
    const payload = await req.json();
    console.log("Signal PayGate reçu :", payload);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 2. On cherche la transaction en attente
    const { data: tx } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', payload.identifier)
      .maybeSingle();

    if (tx && tx.status !== 'Succès') {
      // 3. On déclenche le vote
      const { error: rpcError } = await supabase.rpc('confirm_vote_transaction', {
        p_transaction_id: tx.id,
        p_payment_ref: payload.payment_reference || "REF_PG",
        p_payment_method: payload.payment_method || "MOBILE",
        p_phone: payload.phone_number || tx.phone_number,
        p_tx_ref: payload.tx_reference || "AUTO"
      });

      if (rpcError) throw rpcError;
      console.log(`✅ Vote validé pour la candidate ${tx.candidate_id}`);
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (e) {
    console.error("Erreur dans le Callback :", e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});