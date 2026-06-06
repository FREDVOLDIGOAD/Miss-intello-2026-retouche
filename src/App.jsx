import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { motion, AnimatePresence } from 'framer-motion'; // Pour les animations
import { Search, Trophy, Timer, Heart, Share2, Info, CheckCircle } from 'lucide-react'; // Icônes
import './App.css';

const PRICE_PER_VOTE = 200;
const ELECTION_DATE = new Date('2026-06-30T20:00:00').getTime();

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteData, setVoteData] = useState({ qty: 1, phone: '', network: 'TMONEY' });
  const [searchTerm, setSearchQuery] = useState("");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    fetchCandidates();
    
    // --- TEMPS RÉEL SUPABASE ---
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'candidates' }, (payload) => {
        setCandidates(current => 
          current.map(c => c.id === payload.new.id ? { ...c, total_votes: payload.new.total_votes } : c)
        );
      })
      .subscribe();

    // --- COMPTE À REBOURS ---
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = ELECTION_DATE - now;
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, []);

  const fetchCandidates = async () => {
    const { data } = await supabase.from('candidates').select('*').order('total_votes', { ascending: false });
    setCandidates(data || []);
    setLoading(false);
  };

  // --- LOGIQUE DE FILTRE ET CLASSEMENT ---
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [candidates, searchTerm]);

  const top3 = useMemo(() => candidates.slice(0, 3), [candidates]);

  // (Garder les fonctions handleVoteClick, confirmPayment et handleShare que tu as déjà)
  const handleVoteClick = (candidate) => { setSelectedCandidate(candidate); setShowVoteModal(true); };
  
  const handleShare = async (c) => {
    try { await navigator.share({ title: `Votez pour ${c.name}`, url: window.location.href }); } 
    catch { navigator.clipboard.writeText(window.location.href); alert("Lien copié !"); }
  };

  const confirmPayment = async () => {
    const { qty, phone, network } = voteData;
    if (phone.length < 8) return alert("Numéro invalide");
    try {
      const { data, error } = await supabase.functions.invoke('paygate-init', {
        body: { candidateId: selectedCandidate.id, phoneNumber: phone, network, amount: qty * PRICE_PER_VOTE }
      });
      if (error) throw error;
      alert("✅ Demande envoyée ! Tapez votre code PIN.");
      setShowVoteModal(false);
    } catch (err) { alert("Erreur : " + err.message); }
  };

  if (loading) return <div className="loading-screen"><div className="loader"></div></div>;

  return (
    <div className="app-wrapper">
      <div className="glow-bg"></div>

      <div className="container">
        {/* --- HEADER --- */}
        <header className="main-header">
          <motion.h1 initial={{y:-20}} animate={{y:0}} className="logo">Miss Intello <span>2026</span></motion.h1>
          <p className="subtitle">L'intelligence est la nouvelle beauté</p>
        </header>

        {/* --- SECTION COMPTE À REBOURS --- */}
        <section className="countdown-box">
          <div className="timer-item"><span>{timeLeft.days}</span><label>Jours</label></div>
          <div className="timer-item"><span>{timeLeft.hours}</span><label>Heures</label></div>
          <div className="timer-item"><span>{timeLeft.mins}</span><label>Mins</label></div>
          <div className="timer-item"><span>{timeLeft.secs}</span><label>Secs</label></div>
        </section>

        {/* --- SECTION PODIUM (TOP 3) --- */}
        <section className="podium-section">
          <h2 className="section-title"><Trophy size={20} color="var(--primary-gold)"/> Le Podium de l'Excellence</h2>
          <div className="podium-grid">
            {top3.map((c, index) => (
              <motion.div key={c.id} whileHover={{scale:1.05}} className={`podium-card rank-${index + 1}`}>
                <div className="rank-badge">{index + 1}</div>
                <img src={c.photo_url} alt={c.name} />
                <h4>{c.name}</h4>
                <p>{c.total_votes} votes</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- BARRE DE RECHERCHE --- */}
        <div className="search-bar">
          <Search size={20} color="#888"/>
          <input 
            type="text" 
            placeholder="Rechercher une candidate..." 
            value={searchTerm}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* --- SECTION "POURQUOI VOTER" --- */}
        <section className="why-vote">
            <div className="info-card"><Heart color="var(--primary-gold)"/><h3>Soutenir</h3><p>Aidez-la à réaliser son projet social.</p></div>
            <div className="info-card"><CheckCircle color="var(--primary-gold)"/><h3>Décider</h3><p>Votre voix compte pour le jury final.</p></div>
            <div className="info-card"><Share2 color="var(--primary-gold)"/><h3>Partager</h3><p>Faites rayonner son talent au Togo.</p></div>
        </section>

        {/* --- GRILLE PRINCIPALE --- */}
        <div className="grid">
          {filteredCandidates.map(c => (
            <motion.div layout key={c.id} className="card">
              <div className="image-container" onClick={() => setSelectedCandidate(c)}>
                <img src={c.photo_url || 'https://via.placeholder.com/400'} alt={c.name} />
                <div className="overlay-info"><Info size={24}/></div>
              </div>
              <div className="info">
                <h3 className="name" translate="no">{c.name}</h3>
                <div className="vote-count">{c.total_votes} <span>VOTES</span></div>
                <button className="btn-vote" onClick={() => handleVoteClick(c)}>VOTER MAINTENANT</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* --- MODALES (On garde les mêmes mais avec le CSS amélioré) --- */}
      {/* ... (Inclus les modales Details et Paiement ici) ... */}

    </div>
  );
}