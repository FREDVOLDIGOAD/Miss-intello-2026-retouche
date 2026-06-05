import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null); // Pour la modal

  useEffect(() => { fetchCandidates(); }, []);

  const fetchCandidates = async () => {
    const { data } = await supabase.from('candidates').select('*').order('id');
    setCandidates(data || []);
    setLoading(false);
  };

  // Fonction de Partage
  const handleShare = async (candidate) => {
    const shareData = {
      title: `Votez pour ${candidate.name}`,
      text: `Soutenez ${candidate.name} au concours Miss Intello 2026 ! Elle a déjà ${candidate.total_votes} votes.`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        alert("Lien copié dans le presse-papier !");
        navigator.clipboard.writeText(window.location.href);
      }
    } catch (err) { console.log(err); }
  };

  const handleVote = async (cId) => {
    const phone = prompt("Numéro Togo (8 chiffres):");
    const net = prompt("Réseau (TMONEY ou FLOOZ):").toUpperCase();
    const qty = prompt("Nombre de votes (200F l'unité):");
    if (!phone || !qty || (net !== "TMONEY" && net !== "FLOOZ")) return alert("Infos invalides");

    const { data, error } = await supabase.functions.invoke('paygate-init', {
      body: { candidateId: cId, phoneNumber: phone, network: net, amount: qty * 200 }
    });

    if (error) alert(error.message);
    else alert("Paiement initié ! Validez sur votre téléphone.");
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="container">
      <header>
        <h1 className="logo">Miss Intello 2026</h1>
        <p className="subtitle">L'intelligence est la nouvelle beauté</p>
      </header>

      <div className="grid">
        {candidates.map(c => (
          <div key={c.id} className="card">
            <div className="image-container">
              <img src={c.photo_url || 'https://via.placeholder.com/400x600'} alt={c.name} />
            </div>
            <div className="info">
              <h3 className="name">{c.name}</h3>
              <div className="vote-count">{c.total_votes || 0} <span>VOTES</span></div>
              
              <button className="btn-vote" onClick={() => handleVote(c.id)}>VOTER MAINTENANT</button>
              
              <div className="btn-group">
                <button className="btn-secondary" onClick={() => setSelectedCandidate(c)}>Détails</button>
                <button className="btn-secondary" onClick={() => handleShare(c)}>Partager</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DES DÉTAILS */}
      {selectedCandidate && (
  <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <button className="close-modal" onClick={() => setSelectedCandidate(null)}>&times;</button>
      
      <div className="modal-header">
        <span className="badge-miss">MISS</span>
        <h2 className="modal-name">{selectedCandidate.name}</h2>
      </div>

      <div className="modal-grid-stats">
        <div className="stat-card">
          <div className="stat-icon">🗳️</div>
          <div className="stat-texts">
            <span className="stat-label">Votes</span>
            <span className="stat-value">{selectedCandidate.total_votes || 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-texts">
            <span className="stat-label">Montant / vote</span>
            <span className="stat-value">200 FCFA</span>
          </div>
        </div>
      </div>

      <div className="modal-grid-specs">
        <div className="spec-card">
          <span className="spec-label">Âge</span>
          <span className="spec-value">{selectedCandidate.age || '--'} ans</span>
        </div>
        <div className="spec-card">
          <span className="spec-label">Taille</span>
          <span className="spec-value">{selectedCandidate.taille || '--'} m</span>
        </div>
        <div className="spec-card">
          <span className="spec-label">Poids</span>
          <span className="spec-value">{selectedCandidate.poids || '--'} kg</span>
        </div>
      </div>

      <div className="bio-section">
        <div className="bio-title">
          <span>📖</span> Biographie
        </div>
        <p className="bio-text">
          {selectedCandidate.biography || "Cette candidate n'a pas encore rempli sa biographie."}
        </p>
      </div>

      <div className="modal-actions">
        <button className="btn-main-vote" onClick={() => handleVote(selectedCandidate.id)}>
          ❤️ Voter pour {selectedCandidate.name}
        </button>
        <button className="btn-share" onClick={() => handleShare(selectedCandidate)}>
          🔗 Partager le profil
        </button>
      </div>
    </div>
  </div>
)}
      )}

      <footer>&copy; 2026 Miss Intello Final - PayGate Global Protection</footer>
    </div>
  );
}