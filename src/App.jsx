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
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase.from('candidates').select('*').order('total_votes', { ascending: false });
      if (error) throw error;
      setCandidates(data || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    let lastConfettiTime = 0;
    const channel = supabase.channel('live-ranking')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'candidates' }, (payload) => {
        setCandidates(prev => {
          const updated = prev.map(c => c.id === payload.new.id ? payload.new : c);
          return [...updated].sort((a, b) => b.total_votes - a.total_votes);
        });
        const now = Date.now();
        if (now - lastConfettiTime > 1000) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#d4af37', '#6b21a8'] });
          lastConfettiTime = now;
        }
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

  const handleVoteClick = (c) => { setSelectedCandidate(c); setShowVoteModal(true); };
  
  const handleShare = async (c) => {
    try { await navigator.share({ title: `Votez pour ${c.name}`, url: window.location.href }); }
    catch { navigator.clipboard.writeText(window.location.href); alert("Lien copié !"); }
  };

  const confirmPayment = async () => {
    if (voteData.phone.length < 8) return alert("Numéro invalide");
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('paygate-init', {
        body: { candidateId: selectedCandidate.id, phoneNumber: voteData.phone, network: voteData.network, amount: voteData.qty * PRICE_PER_VOTE }
      });
      if (error) throw error;
      if (data && data.identifier) {
        localStorage.setItem('pendingVoteId', data.identifier);
        setPendingId(data.identifier);
        alert("✅ Demande envoyée ! Confirmez sur votre téléphone.");
        setShowVoteModal(false);
      }
    } catch (err) { alert("Erreur : " + err.message); }
    finally { setIsProcessing(false); }
  };

  const verifyMyVote = async () => {
    if (!pendingId) return;
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('paygate-verify', { body: { identifier: pendingId } });
      if (data?.success) {
        alert("🎉 Vote confirmé ! Merci.");
        localStorage.removeItem('pendingVoteId');
        setPendingId(null);
        fetchCandidates();
      } else { alert(data?.message || "Paiement non détecté."); }
    } catch (err) { alert("Erreur : " + err.message); }
    finally { setIsVerifying(false); }
  };

  if (loading) return <div className="loading">CHARGEMENT...</div>;

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
          <div className="verification-banner">
            <div className="banner-text"><Zap size={20} color="var(--primary-gold)" /><span>Vote en attente...</span></div>
            <button onClick={verifyMyVote} disabled={isVerifying} className="btn-verify">{isVerifying ? "VÉRIF..." : "VÉRIFIER"}</button>
          </div>
        )}

        <section className="podium-section">
          <h2 className="section-title"><Trophy size={28} color="#d4af37"/> Le Podium</h2>
          <div className="podium-grid">
            {top3.map((c, index) => (
              <motion.div key={c.id} layout className={`podium-card rank-${index + 1}`} onClick={() => setSelectedCandidate(c)}>
                <div className="rank-badge-container"><div className="rank-glow"></div><div className="rank-number">{index + 1}</div></div>
                <div className="podium-avatar"><img src={c.photo_url} alt={c.name} onError={(e) => e.target.src='https://via.placeholder.com/150'} /></div>
                <div className="podium-info"><h4>{c.name}</h4><p>{c.total_votes || 0} VOTES</p></div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid-section">
          <h2 className="section-title">Les Candidates</h2>
          <div className="grid">
            {others.map((c) => (
              <div key={c.id} className="candidate-main-card">
                <div className="card-img-wrapper" onClick={() => setSelectedCandidate(c)}><img src={c.photo_url} alt={c.name} /></div>
                <div className="card-body">
                  <div className="card-header-meta"><span className="badge-miss-gold">MISS</span><div className="votes-pill-badge"><span>{c.total_votes || 0} votes</span></div></div>
                  <h3 className="card-name">{c.name}</h3>
                  <button className="btn-vote-gold" onClick={() => handleVoteClick(c)}>VOTER</button>
                  <div className="card-actions"><button onClick={() => setSelectedCandidate(c)}>Détails</button><button onClick={() => handleShare(c)}>Partager</button></div>
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
                <div className="candidate-image-frame"><img src={selectedCandidate.photo_url} alt="" /></div>
                <div className="split-right">
                  <div className="badge-miss-gold">MISS</div>
                  <h2 className="candidate-title-main">{selectedCandidate.name}</h2>
                  <div className="specs-container-luxury">
                    <div className="spec-box-luxury"><span>ÂGE</span><strong>{selectedCandidate.age} ans</strong></div>
                    <div className="spec-box-luxury"><span>TAILLE</span><strong>{selectedCandidate.taille}</strong></div>
                    <div className="spec-box-luxury"><span>POIDS</span><strong>{selectedCandidate.poids}</strong></div>
                  </div>
                  <div className="bio-card-large">
                    <div className="bio-header"><BookOpen size={20} color="#f2d06b" /><span>Biographie</span></div>
                    <p className="bio-content-text">{selectedCandidate.biography}</p>
                  </div>
                  <button className="btn-vote-now-gold" onClick={() => handleVoteClick(selectedCandidate)}><Heart size={20} fill="black" /> VOTER POUR ELLE</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showVoteModal && (
          <div className="payment-overlay" onClick={() => !isProcessing && setShowVoteModal(false)}>
            <div className="payment-modal" onClick={e => e.stopPropagation()}>
               <button className="close-details" onClick={() => setShowVoteModal(false)}><X size={24} /></button>
               <h2 className="gold-text">Soutenir {selectedCandidate?.name}</h2>
               <div className="payment-form">
                  <div className="net-selector">
                      <button className={voteData.network === 'TMONEY' ? 'active' : ''} onClick={() => setVoteData({...voteData, network:'TMONEY'})}>TMONEY</button>
                      <button className={voteData.network === 'FLOOZ' ? 'active' : ''} onClick={() => setVoteData({...voteData, network:'FLOOZ'})}>FLOOZ</button>
                  </div>
                  <input type="tel" placeholder="Numéro (8 chiffres)" value={voteData.phone} onChange={(e) => setVoteData({...voteData, phone: e.target.value.replace(/\D/g, '')})} maxLength="8" />
                  <input type="number" min="1" value={voteData.qty} onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setVoteData({...voteData, qty: isNaN(val) ? "" : val});
                  }} onBlur={() => { if (!voteData.qty || voteData.qty < 1) setVoteData({...voteData, qty: 1}); }} />
                  <div className="total-box">Total : <span>{`${((voteData.qty || 1) * 200).toLocaleString()} FCFA`}</span></div>
                  <button className="btn-confirm-final" onClick={confirmPayment} disabled={isProcessing}>{isProcessing ? "CHARGEMENT..." : "CONFIRMER"}</button>
               </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}