import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCandidates(); }, []);

  const fetchCandidates = async () => {
    const { data, error } = await supabase.from('candidates').select('*').order('id');
    if (error) console.error(error);
    else setCandidates(data || []);
    setLoading(false);
  };

  const handleVote = async (cId) => {
    const phone = prompt("Numéro Togo (8 chiffres):");
    const net = prompt("Réseau (TMONEY ou FLOOZ):").toUpperCase();
    const qty = prompt("Nombre de votes (200F l'unité):");
    if (!phone || !qty || (net !== "TMONEY" && net !== "FLOOZ")) return alert("Infos invalides");

    const { data, error } = await supabase.functions.invoke('paygate-init', {
      body: { candidateId: cId, phoneNumber: phone, network: net, amount: qty * 200 }
    });

    if (error) alert("Erreur: " + error.message);
    else alert("Paiement initié ! Validez sur votre téléphone.");
  };

  if (loading) return <p style={{textAlign:'center', marginTop:50}}>Chargement des candidates...</p>;

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', textAlign: 'center', color: 'white' }}>
      <h1>MISS INTELLO 2026</h1>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 40 }}>
        {candidates.length > 0 ? candidates.map(c => (
          <div key={c.id} style={{ border: '1px solid #555', padding: 20, borderRadius: 15, width: 220, background: '#1a1a1a' }}>
            <img src={c.photo_url || 'https://via.placeholder.com/150'} style={{ width: '100%', borderRadius: 10 }} />
            <h3>{c.name}</h3>
            <p style={{ fontSize: 24, fontWeight: 'bold', color: '#00d1b2' }}>{c.total_votes || 0} votes</p>
            <button onClick={() => handleVote(c.id)} style={{ width: '100%', padding: 12, cursor: 'pointer', background: '#00d1b2', color: '#000', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>
              VOTER (200F)
            </button>
          </div>
        )) : <p>Aucune candidate trouvée dans la base de données.</p>}
      </div>
    </div>
  );
}