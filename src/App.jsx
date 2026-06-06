import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, Share2, X, Trophy, CheckSquare, Banknote, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import './App.css';

const PRICE_PER_VOTE = 200;
const ELECTION_DATE = new Date('2026-06-30T20:00:00').getTime();

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteData, setVoteData] = useState({ qty: 1, phone: '', network: 'TMONEY' });
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    fetchCandidates();
    const channel = supabase.channel('live-ranking')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'candidates' }, () => {
        fetchCandidates(); 
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#d4af37', '#6b21a8'] });
      }).subscribe();

    const timer = setInterval(() => {
      const diff = ELECTION_DATE - new Date().getTime();
      setTimeLeft({
        days: Math.max(0, Math.floor(diff / 86400000)),
        hours: Math.max(0, Math.floor((diff % 86400000) / 3600000)),
        mins: Math.max(0, Math.floor((diff % 3600000) / 60000)),
        secs: Math.max(0, Math.floor((diff % 60000) / 1000))
      });
    }, 1000);
    return () => { supabase.removeChannel(channel); clearInterval(timer); };
  }, []);

  const fetchCandidates = async () => {
    const { data } = await supabase.from('candidates').select('*').order('total_votes', { ascending: false });
    setCandidates(data || []);
    setLoading(false);
  };

  const handleVoteClick = (c) => { setSelectedCandidate(c); setShowVoteModal(true); };
  
  const handleShare = async (c) => {
    try { await navigator.share({ title: `Votez pour ${c.name}`, url: window.location.href }); }
    catch { navigator.clipboard.writeText(window.location.href); alert("Lien copié !"); }
  };

  const confirmPayment = async () => {
    if (voteData.phone.length < 8) return alert("Numéro invalide (8 chiffres requis)");
    if (!voteData.qty || voteData.qty < 1) return alert("Minimum 1 vote requis");

    try {
      const { error } = await supabase.functions.invoke('paygate-init', {
        body: { candidateId: selectedCandidate.id, phoneNumber: voteData.phone, network: voteData.network, amount: voteData.qty * PRICE_PER_VOTE }
      });
      if (error) throw error;
      alert("✅ Demande envoyée ! Confirmez avec votre code PIN sur votre téléphone.");
      setShowVoteModal(false);
    } catch (err) { alert("Erreur : " + err.message); }
  };

  if (loading) return <div className="loading">CHARGEMENT...</div>;

  const top3 = candidates.slice(0, 3);
  const others = candidates.slice(3);

  return (
    <div className="olympus-root">
      <div className="nebula-bg"></div>
      
      <div className="container">
        {/* --- HEADER --- */}
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

        {/* --- PODIUM --- */}
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
                  <h4 translate="no">{c.name}</h4>
                  <p>{c.total_votes || 0} VOTES</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- GRILLE --- */}
        <section className="grid-section">
          <h2 className="section-title">Les Candidates</h2>
          <div className="candidates-grid">
            {others.map((c) => (
              <div key={c.id} className="candidate-main-card">
                <div className="card-img-wrapper" onClick={() => setSelectedCandidate(c)}>
                  <img src={c.photo_url} alt={c.name} onError={(e) => e.target.src='https://via.placeholder.com/400x600?text=Photo'} />
                </div>
                <div className="card-body">
                  <h3 className="card-name" translate="no">{c.name}</h3>
                  <div className="card-votes">
                    <span className="votes-number">{c.total_votes || 0}</span>
                    <span className="votes-label">VOTES</span>
                  </div>
                  <button className="btn-vote-gold" onClick={() => handleVoteClick(c)} translate="no">VOTER</button>
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

      {/* --- MODALES (PLACÉES ICI POUR ÉVITER LES BUGS D'AFFICHAGE) --- */}
      
      <AnimatePresence>
        {/* MODAL DÉTAILS (STYLE SPLIT) */}
        {selectedCandidate && !showVoteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="modal-split-card" onClick={e => e.stopPropagation()}>
              <button className="close-details" onClick={() => setSelectedCandidate(null)}><X size={24} /></button>
              <div className="split-container">
                <div className="candidate-image-frame">
                  <img src={selectedCandidate.photo_url} alt={selectedCandidate.name} onError={(e) => e.target.src='https://via.placeholder.com/600?text=Photo'} />
                </div>
                <div className="split-right">
                  <div className="badge-miss-gold" translate="no">MISS</div>
                  <h2 className="candidate-title-main" translate="no">Candidate n°{selectedCandidate.candidate_number || selectedCandidate.id}</h2>
                  <div className="stats-row">
                    <div className="mini-stat-card">
                      <div className="stat-icon-bg"><CheckSquare size={20} color="#f2d06b" /></div>
                      <div className="stat-text-content"><span className="stat-label">Votes</span><span className="stat-value">{selectedCandidate.total_votes || 0}</span></div>
                    </div>
                    <div className="mini-stat-card">
                      <div className="stat-icon-bg"><Banknote size={20} color="#f2d06b" /></div>
                      <div className="stat-text-content"><span className="stat-label">Montant / vote</span><span className="stat-value">200 FCFA</span></div>
                    </div>
                  </div>
                  <div className="bio-card-large">
                    <div className="bio-header"><BookOpen size={20} color="#f2d06b" /><span>Biographie</span></div>
                    <p className="bio-content-text">{selectedCandidate.biography || "Biographie en cours de rédaction..."}</p>
                  </div>
                  <button className="btn-vote-now-gold" onClick={() => handleVoteClick(selectedCandidate)} translate="no"><Heart size={20} fill="black" /> VOTER POUR ELLE</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL PAIEMENT */}
        {showVoteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="payment-overlay" onClick={() => setShowVoteModal(false)}>
            <div className="payment-modal" onClick={e => e.stopPropagation()}>
               <button className="close-details" onClick={() => setShowVoteModal(false)}><X size={24} /></button>
               <h2 className="gold-text">Soutenir {selectedCandidate.name}</h2>
               <div className="payment-form">
                  <div className="net-selector">
                      <button className={voteData.network === 'TMONEY' ? 'active' : ''} onClick={() => setVoteData({...voteData, network:'TMONEY'})}>TMONEY</button>
                      <button className={voteData.network === 'FLOOZ' ? 'active' : ''} onClick={() => setVoteData({...voteData, network:'FLOOZ'})}>FLOOZ</button>
                  </div>
                  <label className="input-label">Numéro de téléphone</label>
                  <input type="tel" placeholder="90 00 00 00" value={voteData.phone} onChange={(e) => setVoteData({...voteData, phone: e.target.value.replace(/\D/g, '')})} maxLength="8" />
                  
                  <label className="input-label">Nombre de votes (200 F / unité)</label>
                  <input type="number" min="1" value={voteData.qty} onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setVoteData({...voteData, qty: isNaN(val) ? "" : val});
                  }} onBlur={() => { if (!voteData.qty || voteData.qty < 1) setVoteData({...voteData, qty: 1}); }} />

                  <div className="total-box">Total à payer : <span>{`${((voteData.qty || 1) * 200).toLocaleString()} FCFA`}</span></div>
                  <button className="btn-confirm-final" onClick={confirmPayment} translate="no">CONFIRMER LE PAIEMENT</button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}