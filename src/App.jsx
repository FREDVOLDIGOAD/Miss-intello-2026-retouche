import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, Share2, X, Trophy, Timer } from 'lucide-react';
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
    
    // TEMPS RÉEL : Explosion de confettis et mise à jour live
    const channel = supabase.channel('live-ranking')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'candidates' }, (payload) => {
        setCandidates(prev => prev.map(c => c.id === payload.new.id ? payload.new : c).sort((a,b) => b.total_votes - a.total_votes));
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#d4af37', '#6b21a8'] });
      }).subscribe();

    // COMPTE À REBOURS
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
    if (voteData.phone.length < 8) return alert("Numéro invalide");
    try {
      const { error } = await supabase.functions.invoke('paygate-init', {
        body: { candidateId: selectedCandidate.id, phoneNumber: voteData.phone, network: voteData.network, amount: voteData.qty * PRICE_PER_VOTE }
      });
      if (error) throw error;
      alert("✅ Demande envoyée ! Tapez votre code PIN.");
      setShowVoteModal(false);
    } catch (err) { alert("Erreur : " + err.message); }
  };

  if (loading) return <div className="loading-screen"><div className="loader-sun"></div></div>;

  const top3 = candidates.slice(0, 3);
  const others = candidates.slice(3);

  return (
    <div className="olympus-root">
      <div className="nebula-bg"></div>
      <div className="container">
        
        {/* HEADER & COUNTDOWN */}
        <header className="cosmic-header">
          <motion.h1 initial={{y:-50}} animate={{y:0}} className="main-title">Miss Intello <span>2026</span></motion.h1>
          <div className="countdown-box">
             <div className="timer-item"><span>{timeLeft.days}</span><label>Jours</label></div>
             <div className="timer-item"><span>{timeLeft.hours}</span><label>H</label></div>
             <div className="timer-item"><span>{timeLeft.mins}</span><label>M</label></div>
             <div className="timer-item"><span>{timeLeft.secs}</span><label>S</label></div>
          </div>
        </header>

        {/* SECTION PODIUM AMÉLIORÉE */}
        <section className="podium-section">
          <h2 className="section-title"><Trophy size={28} color="#d4af37"/> Le Podium de l'Excellence</h2>
          <div className="podium-grid">
            {top3.map((c, index) => (
              <motion.div 
                key={c.id} 
                layout
                className={`podium-card rank-${index + 1}`}
                onClick={() => setSelectedCandidate(c)}
              >
                <div className="rank-badge-container">
                  <div className="rank-glow"></div>
                  <div className="rank-number">{index + 1}</div>
                </div>
                <div className="podium-avatar">
                  <img src={c.photo_url || 'https://via.placeholder.com/150'} alt={c.name} />
                </div>
                <div className="podium-info">
                  <h4 translate="no">{c.name}</h4>
                  <p>{c.total_votes || 0} VOTES</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* RESTE DES CANDIDATES */}
        <div className="grid-3d">
          {others.map((c) => (
            <motion.div layout key={c.id} className="card-3d" onClick={() => setSelectedCandidate(c)}>
              <div className="image-wrapper">
                <img src={c.photo_url} alt={c.name} />
                <div className="card-overlay-text">
                    <h4 translate="no">{c.name}</h4>
                    <span className="gold-text">{c.total_votes} VOIX</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* MODAL DÉTAILS STYLE EMMA */}
      <AnimatePresence>
        {selectedCandidate && !showVoteModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="emma-overlay" onClick={() => setSelectedCandidate(null)}>
            <div className="emma-modal" onClick={e => e.stopPropagation()}>
              <button className="emma-close" onClick={() => setSelectedCandidate(null)}><X size={30}/></button>
              <div className="emma-photo"><img src={selectedCandidate.photo_url} alt="" /></div>
              <div className="emma-body">
                <h2 className="emma-title" translate="no">{selectedCandidate.name}, {selectedCandidate.age}</h2>
                <p className="emma-sub">{selectedCandidate.region}</p>
                <div className="emma-specs">
                    <div><span>Taille</span><strong>{selectedCandidate.taille}</strong></div>
                    <div><span>Poids</span><strong>{selectedCandidate.poids}</strong></div>
                    <div><span>Votes</span><strong>{selectedCandidate.total_votes}</strong></div>
                </div>
                <button className="emma-btn-vote" onClick={() => handleVoteClick(selectedCandidate)} translate="no">VOTER</button>
                <div className="emma-icons">
                    <div onClick={() => handleVoteClick(selectedCandidate)}><Heart color="#f2d06b"/><span>Vote</span></div>
                    <div><MessageSquare color="#f2d06b"/><span>Commentaires</span></div>
                    <div onClick={() => handleShare(selectedCandidate)}><Share2 color="#f2d06b"/><span>Partager</span></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PAIEMENT */}
      {showVoteModal && (
        <div className="payment-overlay" onClick={() => setShowVoteModal(false)}>
          <div className="payment-modal" onClick={e => e.stopPropagation()}>
            <h2 className="gold-text">Finaliser le Vote</h2>
            <div className="payment-form">
                <div className="net-selector">
                    <button className={voteData.network === 'TMONEY' ? 'active' : ''} onClick={() => setVoteData({...voteData, network:'TMONEY'})}>TMONEY</button>
                    <button className={voteData.network === 'FLOOZ' ? 'active' : ''} onClick={() => setVoteData({...voteData, network:'FLOOZ'})}>FLOOZ</button>
                </div>
                <input type="tel" placeholder="Numéro Togo (8 chiffres)" onChange={(e) => setVoteData({...voteData, phone: e.target.value})} />
                <input type="number" min="1" value={voteData.qty} onChange={(e) => setVoteData({...voteData, qty: e.target.value})} />
                <div className="total-box">Total : <span>{(voteData.qty * 200).toLocaleString()} F</span></div>
                <button className="btn-confirm-final" onClick={confirmPayment} translate="no">CONFIRMER LE PAIEMENT</button>
            </div>
          </div>
        </div>
      )}

      <footer className="cosmic-footer">
        <p>© 2026 Miss Intello Togo - <a href="#/" onClick={() => alert("Comité Miss Intello. Paiements par PayGate Global.")}>Mentions Légales</a></p>
      </footer>
    </div>
  );
}