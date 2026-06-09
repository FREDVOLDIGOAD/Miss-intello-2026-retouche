import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Trophy, Users, CreditCard, Activity, ArrowLeft, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminPortal({ onBack }) {
  const [stats, setStats] = useState({ totalVotes: 0, totalRevenue: 0, activeCandidates: 0 });
  const [candidates, setCandidates] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadAdminData();
    // Écouter les changements en temps réel sur les transactions pour l'admin
    const channel = supabase.channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => loadAdminData())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const loadAdminData = async () => {
    const { data: candData } = await supabase.from('candidates').select('*').order('total_votes', { ascending: false });
    setCandidates(candData || []);

    const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(10);
    setTransactions(txData || []);

    const totalV = candData?.reduce((acc, curr) => acc + (curr.total_votes || 0), 0);
    setStats({
      totalVotes: totalV,
      totalRevenue: totalV * 200,
      activeCandidates: candData?.length || 0
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-root">
      <div className="container">
        <header className="admin-nav">
          <button onClick={onBack} className="btn-back-admin"><ArrowLeft size={18} /> Retour au site</button>
          <div className="admin-title-box">
            <h1 className="admin-main-title">WAR ROOM <span>COMITÉ</span></h1>
            <p className="admin-subtitle">Suivi des performances Miss Intello 2026</p>
          </div>
        </header>

        {/* CARTES DE STATS OR */}
        <div className="admin-stats-grid">
          <div className="stat-card-gold">
            <div className="stat-icon-circle"><Trophy color="#d4af37" /></div>
            <div className="stat-data">
              <label>Votes Totaux</label>
              <strong>{stats.totalVotes.toLocaleString()}</strong>
            </div>
          </div>
          <div className="stat-card-gold">
            <div className="stat-icon-circle"><CreditCard color="#00d1b2" /></div>
            <div className="stat-data">
              <label>Recettes (FCFA)</label>
              <strong>{stats.totalRevenue.toLocaleString()} F</strong>
            </div>
          </div>
          <div className="stat-card-gold">
            <div className="stat-icon-circle"><Users color="#b085ff" /></div>
            <div className="stat-data">
              <label>Candidates</label>
              <strong>{stats.activeCandidates}</strong>
            </div>
          </div>
        </div>

        <div className="admin-dashboard-layout">
          {/* GRAPHIQUE À GAUCHE */}
          <div className="admin-panel chart-panel">
            <div className="panel-header">
              <h3><TrendingUp size={18} /> Top 10 National</h3>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={candidates.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: 'rgba(212, 175, 55, 0.05)'}}
                    contentStyle={{ background: '#0a0518', border: '1px solid #d4af37', borderRadius: '10px' }} 
                  />
                  <Bar dataKey="total_votes" radius={[10, 10, 0, 0]}>
                    {candidates.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#d4af37' : '#2d1b4e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* FLUX DE VOTES À DROITE */}
          <div className="admin-panel tx-panel">
            <div className="panel-header">
              <h3><Activity size={18} /> Flux en direct</h3>
            </div>
            <div className="tx-list-admin">
              {transactions.map(tx => (
                <div key={tx.id} className="tx-row-admin">
                  <div className={`tx-dot ${tx.status === 'Succès' ? 'success' : 'pending'}`}></div>
                  <div className="tx-details-admin">
                    <p><strong>{tx.phone_number?.slice(0, 4)}XXXX</strong> vote +{tx.vote_count}</p>
                    <span>{new Date(tx.created_at).toLocaleTimeString()} • {tx.service}</span>
                  </div>
                  <div className="tx-value">+{tx.amount}F</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}