import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css'; // On importe le nouveau style

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCandidates(); }, []);

  const fetchCandidates = async () => {
    const { data } = await supabase.from('candidates').select('*').order('id');
    setCandidates(data || []);
    setLoading(false);
  };

  const handleVote = async (cId) => {
    const phone = prompt("Numéro (8 chiffres) :");
    const net = prompt("Réseau (TMONEY ou FLOOZ) :").toUpperCase();
    const qty = prompt("Nombre de votes (200F l'unité) :");
    
    if (!phone || !qty || (net !== "TMONEY" && net !== "FLOOZ")) return alert("Infos invalides");

    const { data, error } = await supabase.functions.invoke('paygate-init', {
      body: { candidateId: cId, phoneNumber: phone, network: net, amount: qty * 200 }
    });

    if (error) alert("Erreur: " + error.message);
    else alert("✅ Demande envoyée ! Confirmez sur votre téléphone.");
  };

  if (loading) return <div className="loading">Chargement de l'élégance...</div>;

  return (
    <div className="container">
      <header>
        <h1 className="logo">Miss Intello 2026</h1>
        <p style={{color: '#aaa'}}>L'intelligence est la nouvelle beauté</p>
      </header>

      <div className="grid">
        {candidates.map(c => (
          <div key={c.id} className="card">
            <div className="image-container">
              <img src={c.photo_url || 'https://via.placeholder.com/400x600'} alt={c.name} />
            </div>
            <div className="info">
              <h3 className="name">{c.name}</h3>
              <div className="vote-count">{c.total_votes || 0} <span style={{fontSize: '1rem'}}>VOTES</span></div>
              <button className="btn-vote" onClick={() => handleVote(c.id)}>
                VOTER POUR ELLE
              </button>
            </div>
          </div>
        ))}
      </div>

      <footer style={{marginTop: 80, opacity: 0.5, fontSize: '0.8rem'}}>
        &copy; 2026 Concours Miss Intello - Paiements sécurisés par PayGate Global
      </footer>
    </div>
  );
}