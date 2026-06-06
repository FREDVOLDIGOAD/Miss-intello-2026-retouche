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

  if (loading) return <div className="loader">CHARGEMENT DE L'ÉLÉGANCE...</div>;

  const vedette = candidates[0]; 
  const others = candidates.slice(1);

  return (
    <div className="site-gala">
      {/* --- SECTION 1 : HERO BANNER (VIOLET & OR) --- */}
      <section className="hero-banner">
        <div className="hero-content">
          <span className="badge-gold">ÉDITION 2026</span>
          <h1>VOTEZ POUR<br/>VOTRE MISS</h1>
          <p>Soutenez l'intelligence et le leadership féminin. Chaque vote rapproche votre candidate de la couronne.</p>
          <a href="#candidates" className="btn-hero-gold">EXPLORER LES CANDIDATES</a>
        </div>
        <div className="hero-image">
          <img src="/WhatsApp_Image_2026-03-30_at_20.55.09-removebg-preview.png" alt="Miss Intello" />
        </div>
      </section>

      <div className="container">
        {/* --- SECTION 2 : MISS EN VEDETTE (LEADERBOARD #1) --- */}
        {vedette && (
          <section className="vedette-section">
            <h2 className="section-title">MISS EN VEDETTE</h2>
            <div className="vedette-card glass-violet">
              <div className="vedette-img-container">
                <img src={vedette.photo_url} alt={vedette.name} />
              </div>
              <div className="vedette-info">
                <span className="rank-tag">ACTUELLEMENT N°1</span>
                <h3>{vedette.name}</h3>
                <p>{vedette.age} ans — {vedette.total_votes} votes</p>
                <button className="btn-outline-gold" onClick={() => handleVoteClick(vedette)}>VOTER POUR ELLE</button>
              </div>
            </div>
          </section>
        )}

        {/* --- SECTION 3 : GRILLE CANDIDATES --- */}
        <section id="candidates" className="grid-section">
          <h2 className="section-title">LES CANDIDATES</h2>
          <div className="candidates-grid">
            {others.map(c => (
              <div key={c.id} className="mini-card glass-violet">
                <div className="mini-img-container" onClick={() => setSelectedCandidate(c)}>
                   <img src={c.photo_url} alt={c.name} />
                </div>
                <div className="mini-info">
                  <h4>{c.name}</h4>
                  <p>{c.age} ans • {c.total_votes} votes</p>
                  <button className="btn-card-vote" onClick={() => handleVoteClick(c)}>
                    ❤ VOTER (200F)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* --- MODAL PAIEMENT --- */}
      {showVoteModal && (
        <div className="payment-overlay" onClick={() => setShowVoteModal(false)}>
          <div className="payment-modal glass-purple-deep" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowVoteModal(false)}>×</button>
            <h2 style={{color: 'var(--primary-gold)'}}>Soutenir {selectedCandidate.name}</h2>
            <div className="payment-form">
                <label>Réseau de paiement</label>
                <div className="net-selector">
                    <button className={voteData.network === 'TMONEY' ? 'active' : ''} onClick={() => setVoteData({...voteData, network:'TMONEY'})}>TMONEY</button>
                    <button className={voteData.network === 'FLOOZ' ? 'active' : ''} onClick={() => setVoteData({...voteData, network:'FLOOZ'})}>FLOOZ</button>
                </div>
                <label>Numéro de téléphone</label>
                <input type="tel" maxLength="8" placeholder="Ex: 90010203" onChange={(e) => setVoteData({...voteData, phone: e.target.value})} />
                <label>Quantité de votes</label>
                <input type="number" min="1" value={voteData.qty} onChange={(e) => setVoteData({...voteData, qty: e.target.value})} />
                <button className="btn-confirm-final" onClick={confirmPayment}>CONFIRMER LE VOTE ({(voteData.qty * 200).toLocaleString()} F)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}