import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { candidateId, phoneNumber, network, amount } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const internalId = crypto.randomUUID();

    const response = await fetch("https://paygateglobal.com/api/v1/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: Deno.env.get("PAYGATE_TOKEN"),
        phone_number: phoneNumber,
        amount: Number(amount),
        network: network.toUpperCase(),
        identifier: internalId,
        description: "Vote Miss Intello"
      }),
    });
    const data = await response.json();
    if (String(data.status) !== "0") throw new Error(data.message);


    // On enregistre dans la table avec les nouveaux noms de colonnes
    await supabase.from('transactions').insert({
      id: internalId,
      candidate_id: candidateId,
      amount: Number(amount),
      vote_count: Number(amount) / 200,
      details: `Vote Miss Intello - Candidate #${candidateId}`,
      service: network.toUpperCase(),
      status: 'En attente', // Etat initial
      phone_number: phoneNumber,
      transaction_ref: data.tx_reference
    });


    return new Response(JSON.stringify({ success: true, identifier: internalId }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});