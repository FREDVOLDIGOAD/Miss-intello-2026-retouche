import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

const PRICE_PER_VOTE = 200;

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voteData, setVoteData] = useState({ qty: 1, phone: '', network: 'TMONEY' });

  useEffect(() => { fetchCandidates(); }, []);

  const fetchCandidates = async () => {
    const { data } = await supabase.from('candidates').select('*').order('total_votes', { ascending: false });
    setCandidates(data || []);
    setLoading(false);
  };

  const handleVoteClick = (c) => {
    setSelectedCandidate(c);
    setShowVoteModal(true);
  };

  const confirmPayment = async () => {
    if (voteData.phone.length < 8) return alert("Numéro invalide");
    const { error } = await supabase.functions.invoke('paygate-init', {
      body: { candidateId: selectedCandidate.id, phoneNumber: voteData.phone, network: voteData.network, amount: voteData.qty * PRICE_PER_VOTE }
    });
    if (error) alert(error.message);
    else { alert("✅ Demande envoyée !"); setShowVoteModal(false); }
  };

  if (loading) return <div className="loader">CHARGEMENT...</div>;

  const vedette = candidates[0]; // La 1ère candidate du classement
  const others = candidates.slice(1); // Les autres

  return (
    <div className="site-gala">
      {/* --- SECTION 1 : HERO BANNER --- */}
      <section className="hero-banner">
        <div className="hero-content">
          <h1>VOTEZ POUR<br/>VOTRE MISS</h1>
          <p>Participez au vote et soutenez votre candidate favorite pour devenir la prochaine Miss Intello.</p>
          <a href="#candidates" className="btn-outline">VOTER</a>
        </div>
        <div className="hero-image">
          <img src="/assets/hero-miss.png" alt="Miss Intello" /> {/* Mets ta photo de couverture ici */}
        </div>
      </section>

      <div className="container">
        {/* --- SECTION 2 : MISS EN VEDETTE --- */}
        {vedette && (
          <section className="vedette-section">
            <h2 className="section-title">MISS EN VEDETTE</h2>
            <div className="vedette-card">
              <img src={vedette.photo_url} alt={vedette.name} />
              <div className="vedette-info">
                <h3>{vedette.name}</h3>
                <p>{vedette.age} ans -- {vedette.region || 'Togo'}</p>
                <button className="btn-outline-small" onClick={() => handleVoteClick(vedette)}>VOTER</button>
              </div>
            </div>
          </section>
        )}

        {/* --- SECTION 3 : GRILLE CANDIDATES --- */}
        <section id="candidates" className="grid-section">
          <h2 className="section-title">CANDIDATES</h2>
          <div className="candidates-grid">
            {others.map(c => (
              <div key={c.id} className="mini-card">
                <div className="mini-img-container" onClick={() => setSelectedCandidate(c)}>
                   <img src={c.photo_url} alt={c.name} />
                </div>
                <div className="mini-info">
                  <h4>{c.name}</h4>
                  <p>{c.age} ans : {c.region || 'Togo'}</p>
                  <p className="votes-count">{c.total_votes} votes</p>
                  <button className="btn-gold-vote" onClick={() => handleVoteClick(c)}>
                    ❤ VOTER
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* --- MODAL PAIEMENT (Garder ton style violet/or précédent ou celui-là) --- */}
      {showVoteModal && (
        <div className="payment-overlay" onClick={() => setShowVoteModal(false)}>
          <div className="payment-modal" onClick={e => e.stopPropagation()}>
            <h2>Soutenir {selectedCandidate.name}</h2>
            <div className="payment-form">
                <label>Réseau</label>
                <div className="net-selector">
                    <button className={voteData.network === 'TMONEY' ? 'active' : ''} onClick={() => setVoteData({...voteData, network:'TMONEY'})}>TMONEY</button>
                    <button className={voteData.network === 'FLOOZ' ? 'active' : ''} onClick={() => setVoteData({...voteData, network:'FLOOZ'})}>FLOOZ</button>
                </div>
                <label>Téléphone</label>
                <input type="tel" maxLength="8" onChange={(e) => setVoteData({...voteData, phone: e.target.value})} />
                <label>Nombre de votes (200F/u)</label>
                <input type="number" min="1" value={voteData.qty} onChange={(e) => setVoteData({...voteData, qty: e.target.value})} />
                <button className="btn-confirm" onClick={confirmPayment}>PAYER {voteData.qty * 200} FCFA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}