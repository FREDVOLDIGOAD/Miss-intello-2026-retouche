import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

export default function App() {
  // États de base
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Nouveaux états pour le paiement personnalisé
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteData, setVoteData] = useState({ qty: 1, phone: '', network: 'TMONEY' });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { fetchCandidates(); }, []);

  const fetchCandidates = async () => {
    const { data } = await supabase.from('candidates').select('*').order('id');
    setCandidates(data || []);
    setLoading(false);
  };

  // Fonction pour ouvrir la fenêtre de vote
  const handleVoteClick = (candidate) => {
    setSelectedCandidate(candidate); // On mémorise la candidate
    setShowVoteModal(true); // On ouvre la fenêtre de paiement
  };

  // Fonction finale qui appelle l'API PayGate
  const confirmPayment = async () => {
    const { qty, phone, network } = voteData;
    
    if (!phone || phone.length < 8) {
      return alert("Veuillez entrer un numéro Togo valide (8 chiffres).");
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('paygate-init', {
        body: { 
          candidateId: selectedCandidate.id, 
          phoneNumber: phone, 
          network: network, 
          amount: qty * 200 
        }
      });

      if (error) throw error;

      if (data.success) {
        alert("✅ Demande envoyée ! Veuillez confirmer la transaction sur votre téléphone en tapant votre code PIN.");
        setShowVoteModal(false);
        setVoteData({ qty: 1, phone: '', network: 'TMONEY' }); // Reset
      }
    } catch (err) {
      alert("❌ Erreur : " + (err.message || "Le service de paiement est indisponible."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async (candidate) => {
    const shareData = {
      title: `Votez pour ${candidate.name}`,
      text: `Soutenez ${candidate.name} au concours Miss Intello 2026 !`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        navigator.clipboard.writeText(window.location.href);
        alert("Lien copié !");
      }
    } catch (err) { console.log(err); }
  };

  if (loading) return <div className="loading">Chargement de l'élégance...</div>;

  return (
    <div className="container">
      <header>
        <h1 className="logo">Miss Intello 2026</h1>
        <p className="subtitle">L'intelligence est la nouvelle beauté</p>
      </header>

      {/* GRILLE DES CANDIDATES */}
      <div className="grid">
        {candidates.map(c => (
          <div key={c.id} className="card">
            <div className="image-container">
              <img src={c.photo_url || 'https://via.placeholder.com/400x600'} alt={c.name} />
            </div>
            <div className="info">
              <h3 className="name">{c.name}</h3>
              <div className="vote-count">{c.total_votes || 0} <span>VOTES</span></div>
              
              <button className="btn-vote" onClick={() => handleVoteClick(c)}>VOTER MAINTENANT</button>
              
              <div className="btn-group">
                <button className="btn-secondary" onClick={() => setSelectedCandidate(c)}>Détails</button>
                <button className="btn-secondary" onClick={() => handleShare(c)}>Partager</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FENÊTRE DÉTAILS (MODAL DÉTAILS) */}
      {selectedCandidate && !showVoteModal && (
        <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedCandidate(null)}>&times;</button>
            <div className="modal-header">
                <span className="badge-miss">MISS</span>
                <h2 className="modal-name">{selectedCandidate.name}</h2>
            </div>
            <div className="modal-grid-specs">
                <div className="spec-card"><span>Âge</span><strong>{selectedCandidate.age || '--'} ans</strong></div>
                <div className="spec-card"><span>Taille</span><strong>{selectedCandidate.taille || '--'} m</strong></div>
                <div className="spec-card"><span>Poids</span><strong>{selectedCandidate.poids || '--'} kg</strong></div>
            </div>
            <div className="bio-section">
                <div className="bio-title">📖 Biographie</div>
                <p className="bio-text">{selectedCandidate.biography}</p>
            </div>
            <button className="btn-main-vote" onClick={() => handleVoteClick(selectedCandidate)}>
                ❤️ Voter pour {selectedCandidate.name}
            </button>
          </div>
        </div>
      )}

      {/* FENÊTRE DE PAIEMENT (MODAL VOTE) */}
      {showVoteModal && (
        <div className="payment-overlay" onClick={() => !isProcessing && setShowVoteModal(false)}>
          <div className="payment-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowVoteModal(false)}>&times;</button>
            
            <h2 className="payment-title">Finaliser votre Vote</h2>
            <p className="payment-subtitle">Soutien pour <span>{selectedCandidate?.name}</span></p>

            <div className="payment-form">
              <label>Choisir le réseau :</label>
              <div className="network-selector">
                <button 
                  className={voteData.network === 'TMONEY' ? 'active' : ''} 
                  onClick={() => setVoteData({...voteData, network: 'TMONEY'})}>
                  TMONEY
                </button>
                <button 
                  className={voteData.network === 'FLOOZ' ? 'active' : ''} 
                  onClick={() => setVoteData({...voteData, network: 'FLOOZ'})}>
                  FLOOZ
                </button>
              </div>

              <label>Numéro de téléphone (8 chiffres) :</label>
              <input 
                type="tel" 
                placeholder="Ex: 90010203" 
                value={voteData.phone}
                onChange={(e) => setVoteData({...voteData, phone: e.target.value.replace(/\D/g, '')})}
                maxLength="8"
              />

              <label>Nombre de votes (200F / vote) :</label>
              <input 
                type="number" 
                min="1"
                value={voteData.qty}
                /* Correction : On s'assure que la valeur est bien transformée en nombre */
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setVoteData({...voteData, qty: isNaN(val) ? 0 : val});
                }}
              />

              <div className="total-box">
                {/* On multiplie en temps réel la quantité par 200 */}
                Total à payer : <span>{(voteData.qty * 200).toLocaleString()} FCFA</span>
              </div>

              <button className="confirm-btn" onClick={confirmPayment} disabled={isProcessing || voteData.qty <= 0}>
                {isProcessing ? "CONNEXION PAYGATE..." : `CONFIRMER (${(voteData.qty * 200).toLocaleString()}F)`}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer>&copy; 2026 Miss Intello Final - Sécurisé par PayGate Global</footer>
    </div>
  );
}
