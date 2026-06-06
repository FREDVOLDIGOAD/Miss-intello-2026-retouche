import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './supabaseClient';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Search, Trophy, Sparkles, Info, Star, ShieldCheck, Zap } from 'lucide-react';
import confetti from 'canvas-confetti'; // Pour l'idée n°2
import './App.css';

const PRICE_PER_VOTE = 200;

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteData, setVoteData] = useState({ qty: 1, phone: '', network: 'TMONEY' });
  const [oracleQuery, setOracleQuery] = useState("");
  
  // Réf pour l'effet de tapis rouge 3D
  const containerRef = useRef(null);

  useEffect(() => {
    fetchCandidates();

    // --- IDÉE N°2 : LE COEUR DE LA NATION (REALTIME EXPLOSION) ---
    const channel = supabase
      .channel('global-votes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'candidates' }, (payload) => {
        // Mise à jour live
        setCandidates(prev => prev.map(c => c.id === payload.new.id ? { ...c, total_votes: payload.new.total_votes } : c));
        
        // EXPLOSION D'OR GLOBALE
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#ffffff', '#6b21a8']
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchCandidates = async () => {
    const { data } = await supabase.from('candidates').select('*').order('total_votes', { ascending: false });
    setCandidates(data || []);
    setLoading(false);
  };

  // --- IDÉE N°4 : L'ORACLE (FILTRE INTELLIGENT) ---
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => 
      c.name.toLowerCase().includes(oracleQuery.toLowerCase()) || 
      (c.tags && c.tags.toLowerCase().includes(oracleQuery.toLowerCase()))
    );
  }, [candidates, oracleQuery]);

  const handleVoteClick = (candidate) => { setSelectedCandidate(candidate); setShowVoteModal(true); };

  const confirmPayment = async () => {
    try {
      const { error } = await supabase.functions.invoke('paygate-init', {
        body: { candidateId: selectedCandidate.id, phoneNumber: voteData.phone, network: voteData.network, amount: voteData.qty * PRICE_PER_VOTE }
      });
      if (error) throw error;
      alert("Demande envoyée !");
      setShowVoteModal(false);
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div className="cosmic-loader"><div className="sun"></div></div>;

  return (
    <div className="olympus-root">
      {/* --- IDÉE N°1 : L'OLYMPE (FOND SPATIAL ANIMÉ) --- */}
      <div className="nebula-bg"></div>
      <div className="stars-layer"></div>

      <div className="container">
        <header className="cosmic-header">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="crown-icon">
            <Trophy size={50} color="#d4af37" />
          </motion.div>
          <h1 className="main-title">Miss Intello <span>2026</span></h1>
          <p className="glitch-text">Édition Grandiose</p>
        </header>

        {/* --- L'ORACLE --- */}
        <div className="oracle-container">
          <div className="oracle-box">
            <Sparkles className="oracle-icon" />
            <input 
              placeholder="Demandez à l'Oracle (ex: Leadership, Éducation...)" 
              onChange={(e) => setOracleQuery(e.target.value)}
            />
          </div>
        </div>

        {/* --- IDÉE N°3 : LE TAPIS ROUGE VIRTUEL (SCROLL 3D) --- */}
        <motion.div 
          className="virtual-red-carpet"
          ref={containerRef}
          initial="hidden"
          whileInView="visible"
        >
          <div className="grid-3d">
            {filteredCandidates.map((c, index) => {
              // Calcul de l'AURA (Plus elle a de votes, plus elle brille)
              const auraStrength = Math.min((c.total_votes || 0) / 100, 1);
              
              return (
                <motion.div 
                  key={c.id}
                  className="card-3d"
                  whileHover={{ rotateY: 10, rotateX: -5, scale: 1.05 }}
                  style={{ 
                    boxShadow: `0 0 ${40 * auraStrength}px rgba(212, 175, 55, ${0.4 * auraStrength})`,
                    borderColor: auraStrength > 0.5 ? 'var(--primary-gold)' : 'var(--glass-border)'
                  }}
                >
                  <div className="image-wrapper" onClick={() => setSelectedCandidate(c)}>
                    <img src={c.photo_url} alt={c.name} />
                    <div className="aura-effect" style={{ opacity: auraStrength }}></div>
                  </div>
                  <div className="card-content">
                    <h3 translate="no">{c.name}</h3>
                    <div className="vote-badge">
                      <Zap size={14} /> {c.total_votes || 0} VOIX
                    </div>
                    <button className="btn-olympus" onClick={() => handleVoteClick(c)}>VOTER</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* FOOTER MENTIONS LÉGALES */}
      <footer className="cosmic-footer">
        <div className="footer-line"></div>
        <p>© 2026 Miss Intello Final - Sécurité de vote certifiée par PayGate Global</p>
        <div className="legal-links">
          <span onClick={() => alert("Votes non remboursables.")}>CGV</span> • 
          <span onClick={() => alert("Données chiffrées.")}>Confidentialité</span>
        </div>
      </footer>

      {/* ... (Garder tes modales détails et paiement ici) ... */}
    </div>
  );
}