import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

// Constante pour le prix du vote
const PRICE_PER_VOTE = 200;

export default function App() {
  // États de base
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // États pour le paiement
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteData, setVoteData] = useState({ qty: 1, phone: '', network: 'TMONEY' });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) throw error;
      setCandidates(data || []);
    } catch (err) {
      console.error("Erreur de chargement:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ouvre la fenêtre de vote
  const handleVoteClick = (candidate) => {
    setSelectedCandidate(candidate);
    setShowVoteModal(true);
  };

  // Appel API PayGate
  const confirmPayment = async () => {
    const { qty, phone, network } = voteData;
    
    if (!phone || phone.length < 8) {
      return alert("Veuillez entrer un numéro Togo valide (8 chiffres).");
    }

    if (!qty || qty < 1) {
      return alert("Veuillez choisir au moins 1 vote.");
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('paygate-init', {
        body: { 
          candidateId: selectedCandidate.id, 
          phoneNumber: phone, 
          network: network, 
          amount: qty * PRICE_PER_VOTE 
        }
      });

      if (error) throw error;

      if (data.success || data.paymentInitiated) {
        alert("✅ Demande envoyée ! Veuillez confirmer la transaction sur votre téléphone en tapant votre code PIN.");
        setShowVoteModal(false);
        setVoteData({ qty: 1, phone: '', network: 'TMONEY' }); 
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
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Lien de vote copié !");
      }
    } catch (err) { console.log(err); }
  };

  if (loading) return <div className="loading">Chargement de l'élégance...</div>;

  return (
    <div className="container">
      {/* HEADER (Toujours visible si pas de candidate sélectionnée) */}
      {!selectedCandidate && (
        <header>
          <h1 className="logo">Miss Intello 2026</h1>
          <p className="subtitle">L'intelligence est la nouvelle beauté</p>
        </header>
      )}

      {/* GRILLE DES CANDIDATES (Visible seulement si aucune sélectionnée) */}
      {!selectedCandidate ? (
        <div className="grid">
          {candidates.map(c => (
            <div key={c.id} className="card">
              <div className="image-container">
                <img src={c.photo_url || 'https://via.placeholder.com/400x600'} alt={c.name} />
              </div>
              <div className="info">
                <h3 className="name">{c.name}</h3>
                <div className="vote-count">{c.total_votes || 0} <span>VOTES</span></div>
                
                <button className="btn-vote" onClick={() => handleVoteClick(c)} translate="no">VOTER MAINTENANT</button>
                
                <div className="btn-group">
                  <button className="btn-secondary" onClick={() => setSelectedCandidate(c)}>Détails</button>
                  <button className="btn-secondary" onClick={() => handleShare(c)}>Partager</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VUE DÉTAILLÉE (Split view Photo + Infos) */
        <div className="modal-overlay detail-view-active" onClick={() => setSelectedCandidate(null)}>
          <div className="modal-content modal-detail-full" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedCandidate(null)}>&times;</button>
            
            <div className="modal-split">
              <div className="modal-photo-side">
                <img src={selectedCandidate.photo_url || 'https://via.placeholder.com/400x600'} alt={selectedCandidate.name} />
              </div>

              <div className="modal-info-side">
                <span className="badge-miss">MISS INTELLO 2026</span>
                <h2 className="modal-name">{selectedCandidate.name}</h2>

                <div className="modal-grid-specs">
                  <div className="spec-card"><span>Âge</span><strong>{selectedCandidate.age || '--'} ans</strong></div>
                  <div className="spec-card"><span>Taille</span><strong>{selectedCandidate.taille || '--'} m</strong></div>
                  <div className="spec-card"><span>Poids</span><strong>{selectedCandidate.poids || '--'} kg</strong></div>
                </div>

                <div className="stat-card-large">
                  <span className="stat-label">Score actuel</span>
                  <span className="stat-value">{selectedCandidate.total_votes || 0} VOTES</span>
                </div>

                <div className="bio-section">
                  <div className="bio-title">📖 Biographie</div>
                  <p className="bio-text">{selectedCandidate.biography || "Biographie en cours de rédaction..."}</p>
                </div>

                <div className="modal-actions-footer">
                  <button className="btn-main-vote" onClick={() => handleVoteClick(selectedCandidate)}>
                    ❤️ VOTER POUR ELLE
                  </button>
                  <button className="btn-share-alt" onClick={() => handleShare(selectedCandidate)}>
                    🔗 PARTAGER LE PROFIL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAIEMENT (S'affiche par dessus tout) */}
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

              <label>Nombre de votes ({PRICE_PER_VOTE}F / vote) :</label>
              <input 
                type="number" 
                min="1"
                value={voteData.qty}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setVoteData({...voteData, qty: isNaN(val) ? 1 : val});
                }}
              />

              <div className="total-box">
                Total à payer : <span>{`${(voteData.qty * PRICE_PER_VOTE).toLocaleString()} FCFA`}</span>
              </div>

              <button className="confirm-btn" onClick={confirmPayment} disabled={isProcessing || voteData.qty <= 0}>
                {isProcessing ? "CONNEXION PAYGATE..." : `CONFIRMER (${(voteData.qty * PRICE_PER_VOTE).toLocaleString()}F)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-logo">Miss Intello <span>2026</span></h3>
            <p>L'excellence et l'intelligence au service du leadership féminin au Togo.</p>
          </div>

          <div className="footer-section">
            <h4>Aide & Support</h4>
            <ul>
              <li><i className="fa-solid fa-phone"></i> +228 90 83 64 94</li>
              <li><i className="fa-solid fa-envelope"></i> contact@missintello.tg</li>
              <li>Lomé, Togo</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Mentions Légales</h4>
            <ul>
              <li><a href="#/" onClick={(e) => { e.preventDefault(); alert("Éditeur : Comité Miss Intello. Système de vote sécurisé par PayGate Global."); }}>Mentions Légales</a></li>
              <li><a href="#/" onClick={(e) => { e.preventDefault(); alert("Les votes sont définitifs et non remboursables."); }}>CGV / CGU</a></li>
              <li><a href="#/" onClick={(e) => { e.preventDefault(); alert("Vos données de paiement sont traitées par PayGate Global."); }}>Confidentialité</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Miss Intello Togo - Tous droits réservés.</p>
          <div className="paygate-badge">Paiements sécurisés par PayGate Global</div>
        </div>
      </footer>
    </div>
  );
}