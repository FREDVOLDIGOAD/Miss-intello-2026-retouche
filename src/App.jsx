import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, Share2, X, Trophy, CheckSquare, Banknote, BookOpen, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import './App.css';

const PRICE_PER_VOTE = 200;
const ELECTION_DATE = new Date('2026-08-15T20:00:00').getTime();

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteData, setVoteData] = useState({ qty: 1, phone: '', network: 'TMONEY' });
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [pendingId, setPendingId] = useState(localStorage.getItem('pendingVoteId') || null);
  const [isVerifying, setIsVerifying] = useState(false);

  // --- CHARGEMENT DES DONNÉES SÉCURISÉ ---
  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('total_votes', { ascending: false });
      
      if (error) throw error;
      setCandidates(data || []);
    } catch (err) {
      console.error("Erreur de récupération:", err.message);
    } finally {
      // Cette ligne s'exécutera QUOI QU'IL ARRIVE au bout de la requête
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchCandidates();

    // Variable pour limiter les confettis (anti-bug)
    let lastConfettiTime = 0;

    const channel = supabase.channel('live-ranking')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'candidates' }, (payload) => {
        // Mise à jour ultra-rapide sans recharger tout le site
        setCandidates(prev => {
          const updated = prev.map(c => 
            c.id === payload.new.id ? { ...c, total_votes: payload.new.total_votes } : c
          );
          return [...updated].sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0));
        });

        // Explosion de confettis limitée (max 1 fois par seconde)
        const now = Date.now();
        if (now - lastConfettiTime > 1000) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#d4af37', '#6b21a8'] });
          lastConfettiTime = now;
        }
      }).subscribe();

    const timer = setInterval(() => {
      const diff = ELECTION_DATE - new Date().getTime();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          mins: Math.floor((diff % 3600000) / 60000),
          secs: Math.floor((diff % 60000) / 1000)
        });
      }
    }, 1000);

    return () => { supabase.removeChannel(channel); clearInterval(timer); };
  }, []);

  const handleVoteClick = (c) => { setSelectedCandidate(c); setShowVoteModal(true); };
  
  const handleShare = async (c) => {
    try {
      await navigator.share({ title: `Votez pour ${c.name}`, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      alert("Lien de vote copié !");
    }
  };

  const confirmPayment = async () => {
    if (voteData.phone.length < 8) return alert("Numéro invalide (8 chiffres requis)");
    try {
        // ✅ Correction ici : on ajoute "data" dans l'extraction
        const { data, error } = await supabase.functions.invoke('paygate-init', {
          body: { 
            candidateId: selectedCandidate.id, 
            phoneNumber: voteData.phone, 
            network: voteData.network,
            amount: voteData.qty * 200
          }
        });

        if (error) throw error;

        // ✅ On vérifie que data existe bien avant de l'utiliser
        if (data && data.identifier) {
          localStorage.setItem('pendingVoteId', data.identifier);
          setPendingId(data.identifier);
          alert("✅ Demande envoyée ! Confirmez avec votre code PIN sur votre téléphone.");
          setShowVoteModal(false);
        }
      } catch (err) {
        alert("Erreur : " + err.message);
      };
    };
    
  const verifyMyVote = async () => {
    if (!pendingId) return;
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('paygate-verify', {
        body: { identifier: pendingId }
      });

      if (data?.success) {
        alert("🎉 Vote confirmé ! Merci pour votre soutien.");
        localStorage.removeItem('pendingVoteId'); // On efface la mémoire
        setPendingId(null); // On cache le bandeau
        fetchCandidates(); // On met à jour les scores
      } else {
        alert("ℹ️ Paiement non encore détecté. Si vous avez déjà validé sur votre téléphone, attendez 1 minute et réessayez.");
      }
    } catch (e) {
      alert("Erreur lors de la communication avec le serveur.");
    } finally {
      setIsVerifying(false);
    }
  };
  if (loading) return <div className="loading" style={{display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', color:'#d4af37', letterSpacing:'4px'}}>CHARGEMENT DE L'ÉLÉGANCE...</div>;

  const top3 = candidates.slice(0, 3);
  const others = candidates.slice(3);

  return (
    <div className="olympus-root" translate="no">
      <div className="nebula-bg"></div>
      
      <div className="container">
        <header className="main-header">
          <h1 className="logo">Miss Intello <span>2026</span></h1>
          <p className="subtitle">L'intelligence est la nouvelle beauté</p>
          <div className="countdown-box">
             <div className="timer-item"><span>{timeLeft.days}</span><label>Jours</label></div>
             <div className="timer-item"><span>{timeLeft.hours}</span><label>H</label></div>
             <div className="timer-item"><span>{timeLeft.mins}</span><label>M</label></div>
             <div className="timer-item"><span>{timeLeft.secs}</span><label>S</label></div>
          </div>
        </header>
        {pendingId && (
          <div className="verification-banner" style={{marginBottom: '30px'}}>
            <div className="banner-text">
              <Zap size={20} color="var(--gold)" />
              <span>Vous avez un vote en attente de confirmation.</span>
            </div>
            <button 
              onClick={verifyMyVote} 
              disabled={isVerifying} 
              className="btn-verify"
            >
              {isVerifying ? "VÉRIFICATION..." : "VÉRIFIER MON VOTE"}
            </button>
          </div>
        )}

        <section className="podium-section">
          <h2 className="section-title"><Trophy size={28} color="#d4af37"/> Le Podium de l'Excellence</h2>
          <div className="podium-grid">
            {top3.map((c, index) => (
              <motion.div key={c.id} layout className={`podium-card rank-${index + 1}`} onClick={() => setSelectedCandidate(c)}>
                <div className="rank-badge-container">
                  <div className="rank-glow"></div>
                  <div className="rank-number">{index + 1}</div>
                </div>
                <div className="podium-avatar">
                  <img src={c.photo_url} alt={c.name} onError={(e) => e.target.src='https://via.placeholder.com/150?text=Miss'} />
                </div>
                <div className="podium-info">
                  <h4>{c.name}</h4>
                  <p>{c.total_votes || 0} VOTES</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid-section">
          <h2 className="section-title">Les Candidates</h2>
          <div className="candidates-grid">
            {candidates.map((c) => (
              <div key={c.id} className="candidate-main-card">
                <div className="card-img-wrapper" onClick={() => setSelectedCandidate(c)}>
                  <img src={c.photo_url} alt={c.name} onError={(e) => e.target.src='https://via.placeholder.com/400x600?text=Photo'} />
                </div>
                <div className="card-body">
                  <div className="card-header-meta">
                    <span className="badge-miss-gold">MISS</span>
                    <div className="votes-pill-badge"><span>{c.total_votes || 0} votes</span></div>
                  </div>
                  <h3 className="card-name">{c.name}</h3>
                  <div className="card-specs-list">
                    <p>Âge : <span>{c.age || '--'} ans</span></p>
                    <p>Taille : <span>{c.taille || '--'}</span></p>
                    <p>Poids : <span>{c.poids || '--'}</span></p>
                  </div>
                  <button className="btn-vote-gold" onClick={() => handleVoteClick(c)}>VOTER</button>
                  <div className="card-actions">
                    <button onClick={() => setSelectedCandidate(c)}>Détails</button>
                    <button onClick={() => handleShare(c)}>Partager</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {selectedCandidate && !showVoteModal && (
          <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
            <div className="modal-split-card" onClick={e => e.stopPropagation()}>
              <button className="close-details" onClick={() => setSelectedCandidate(null)}><X size={24} /></button>
              <div className="split-container">
                <div className="candidate-image-frame">
                  <img src={selectedCandidate.photo_url} alt={selectedCandidate.name} onError={(e) => e.target.src='https://via.placeholder.com/600?text=Photo'} />
                </div>
                <div className="split-right">
                  <div className="badge-miss-gold">MISS</div>
                  <h2 className="candidate-title-main">{selectedCandidate.name}</h2>
                  <div className="specs-container-luxury">
                    <div className="spec-box-luxury"><span>ÂGE :</span><strong>{selectedCandidate.age || '--'} ans</strong></div>
                    <div className="spec-box-luxury"><span>TAILLE :</span><strong>{selectedCandidate.taille || '--'}</strong></div>
                    <div className="spec-box-luxury"><span>POIDS :</span><strong>{selectedCandidate.poids || '--'}</strong></div>
                  </div>
                  <div className="stats-row">
                    <div className="mini-stat-card">
                      <div className="stat-icon-bg"><CheckSquare size={20} color="#f2d06b" /></div>
                      <div className="stat-text-content"><span className="stat-label">Votes</span><span className="stat-value">{selectedCandidate.total_votes || 0}</span></div>
                    </div>
                    <div className="mini-stat-card">
                      <div className="stat-icon-bg"><Banknote size={20} color="#f2d06b" /></div>
                      <div className="stat-text-content"><span className="stat-label">Prix / vote</span><span className="stat-value">200 FCFA</span></div>
                    </div>
                  </div>
                  <div className="bio-card-large">
                    <div className="bio-header"><BookOpen size={20} color="#f2d06b" /><span>Biographie</span></div>
                    <p className="bio-content-text">{selectedCandidate.biography || "Biographie en cours de rédaction..."}</p>
                  </div>
                  <button className="btn-vote-now-gold" onClick={() => handleVoteClick(selectedCandidate)}><Heart size={20} fill="black" /> VOTER POUR ELLE</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showVoteModal && (
          <div className="payment-overlay" onClick={() => setShowVoteModal(false)}>
            <div className="payment-modal" onClick={e => e.stopPropagation()}>
               <button className="close-details" onClick={() => setShowVoteModal(false)}><X size={24} /></button>
               <h2 className="gold-text">Soutenir {selectedCandidate?.name}</h2>
               <div className="payment-form">
                  <div className="net-selector">
                      <button className={voteData.network === 'TMONEY' ? 'active' : ''} onClick={() => setVoteData({...voteData, network:'TMONEY'})}>TMONEY</button>
                      <button className={voteData.network === 'FLOOZ' ? 'active' : ''} onClick={() => setVoteData({...voteData, network:'FLOOZ'})}>FLOOZ</button>
                  </div>
                  <input type="tel" placeholder="Numéro Togo (8 chiffres)" value={voteData.phone} onChange={(e) => setVoteData({...voteData, phone: e.target.value.replace(/\D/g, '')})} maxLength="8" />
                  <input type="number" min="1" value={voteData.qty} onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setVoteData({...voteData, qty: isNaN(val) ? "" : val});
                  }} onBlur={() => { if (!voteData.qty || voteData.qty < 1) setVoteData({...voteData, qty: 1}); }} />
                  <div className="total-box">Total à payer : <span>{`${((voteData.qty || 1) * 200).toLocaleString()} FCFA`}</span></div>
                  <button className="btn-confirm-final" onClick={confirmPayment}>CONFIRMER LE PAIEMENT</button>
               </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-logo">Miss Intello <span>2026</span></h3>
            <p className="footer-description">L'excellence et l'intelligence au service du leadership féminin au Togo.</p>
          </div>
          <div className="footer-section">
            <h4>Aide & Support</h4>
            <ul className="footer-links">
              <li>+228 90 83 64 94</li>
              <li>comitemissintello1@gmail.com</li>
              <li>Lomé, Togo</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Mentions Légales</h4>
            <ul className="footer-links">
              <li><a href="#/" onClick={(e) => { e.preventDefault(); alert("Comité Miss Intello. Système sécurisé par PayGate Global."); }}>Mentions Légales</a></li>
              <li><a href="#/" onClick={(e) => { e.preventDefault(); alert("Votes définitifs et non remboursables."); }}>CGV / CGU</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-bottom-flex">
            <p>&copy; {new Date().getFullYear()} Miss Intello Togo - Tous droits réservés.</p>
            <div className="paygate-badge"><span className="dot"></span> Paiements sécurisés par PayGate Global</div>
          </div>
        </div>
      </footer>
    </div>
  );
}