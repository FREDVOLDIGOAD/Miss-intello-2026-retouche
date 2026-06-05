import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

const QUICK_VOTES = [1, 3, 5, 10, 20];

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [pendingReference, setPendingReference] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState('TMONEY');
  const [voteCount, setVoteCount] = useState(1);
  const PRICE_PER_VOTE = 200;
  const currentCandidateRef = useRef(null);

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase.from('candidates').select('*').order('candidate_number', { ascending: true });
      if (error) throw error;
      setCandidates(data || []);
    } catch (e) {
      setErreur(e.message);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  if (erreur) {
    return (
      <div className="loading">
        <h1>Oups ! Erreur de connexion ❌</h1>
        <p>{erreur}</p>
      </div>
    );
  }

  const handleVoteClick = (candidate) => {
    currentCandidateRef.current = candidate;
    setShowPaymentModal(true);
    setPhoneNumber('');
    setNetwork('TMONEY');
    setVoteCount(1);
  };

  const handleVotePayGate = async (candidate, mobilePhoneNumber, paymentNetwork, numberOfVotes) => {
    if (!candidate) {
      alert('Aucune candidate sélectionnée.');
      return false;
    }

    const totalAmount = numberOfVotes * PRICE_PER_VOTE;

    const { data, error } = await supabase.functions.invoke('paygate-init', {
      body: {
        phoneNumber: mobilePhoneNumber,
        amount: totalAmount,
        network: paymentNetwork,
        candidateId: candidate.id,
        voteCount: numberOfVotes,
      },
    });

    if (error) {
      alert('Impossible de contacter le service de paiement. Vérifiez votre connexion.');
      return false;
    }

    if (data?.success || data?.paymentInitiated) {
      setPendingReference(data.reference || data.identifier || null);
      alert('Demande de paiement envoyée ! Confirmez sur votre téléphone.');
      return true;
    }

    alert(data?.error || 'Une erreur est survenue avec PayGate.');
    return false;
  };

  const processPaygatePayment = async (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 8) {
      alert('Veuillez entrer un numéro valide (8 chiffres).');
      return;
    }

    setPaymentLoading(true);
    try {
      const candidate = currentCandidateRef.current;
      const success = await handleVotePayGate(candidate, phoneNumber, network, voteCount);
      if (success) setShowPaymentModal(false);
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  const verifyPaygateTransaction = async () => {
    setVerifyLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paygate-verify', {
        body: { identifier: pendingReference },
      });

      if (data?.success) {
        alert('Paiement confirmé ! Merci pour votre vote.');
        setPendingReference(null);
        fetchCandidates();
      } else {
        alert(data?.error || 'Paiement non encore détecté.');
      }
    } catch (err) {
      alert('Erreur lors de la vérification.');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="container">
      {!selectedCandidate ? (
        <>
          <header>
            <h1 className="logo">Miss Intello 2026</h1>
            <p className="subtitle">L'intelligence est la nouvelle beauté</p>
          </header>

          {pendingReference && (
            <div className="status-banner" style={{marginBottom: 40}}>
                <p>Paiement en attente ({pendingReference})</p>
                <button onClick={verifyPaygateTransaction} disabled={verifyLoading} className="btn-secondary">
                  {verifyLoading ? 'Vérification...' : 'Vérifier mon vote'}
                </button>
            </div>
          )}

          <div className="grid">
            {candidates.map((c) => (
              <div key={c.id} className="card">
                <div className="image-container">
                  <img src={c.photo_url || 'https://via.placeholder.com/400x600'} alt={c.name} />
                </div>
                <div className="info">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10}}>
                        <span className="badge-miss">CANDIDATE N°{c.candidate_number}</span>
                    </div>
                  <h3 className="name">{c.name}</h3>
                  <div className="vote-count">{c.votes || 0} <span>VOTES</span></div>
                  
                  <button className="btn-vote" onClick={() => handleVoteClick(c)}>VOTER</button>
                  
                  <div className="btn-group">
                    <button className="btn-secondary" onClick={() => setSelectedCandidate(c)}>Détails</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* VUE DÉTAILLÉE STYLE PREMIUM */
        <div className="detail-view">
          <button className="btn-back" onClick={() => setSelectedCandidate(null)}>
             ← Retour aux candidates
          </button>
          
          <div className="modal-content" style={{maxWidth: '900px', margin: '0 auto'}}>
            <div className="modal-body">
                <img src={selectedCandidate.photo_url} alt={selectedCandidate.name} className="modal-img" />
                <div className="modal-info">
                    <span className="badge-miss">MISS INTELLO 2026</span>
                    <h2 className="modal-name">{selectedCandidate.name}</h2>
                    
                    <div className="modal-grid-stats">
                        <div className="stat-card">
                            <span className="stat-label">Votes actuels</span>
                            <span className="stat-value">{selectedCandidate.votes || 0}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Prix / vote</span>
                            <span className="stat-value">200 FCFA</span>
                        </div>
                    </div>

                    <div className="modal-grid-specs">
                        <div className="spec-card">
                            <span className="spec-label">Âge</span>
                            <span className="spec-value">{selectedCandidate.age} ans</span>
                        </div>
                        <div className="spec-card">
                            <span className="spec-label">Taille</span>
                            <span className="spec-value">{selectedCandidate.taille}</span>
                        </div>
                        <div className="spec-card">
                            <span className="spec-label">Poids</span>
                            <span className="spec-value">{selectedCandidate.poids}</span>
                        </div>
                    </div>

                    <div className="bio-section">
                        <p className="bio-text">{selectedCandidate.biography || "Biographie en cours de rédaction..."}</p>
                    </div>

                    <button className="btn-main-vote" onClick={() => handleVoteClick(selectedCandidate)}>
                        VOTER POUR {selectedCandidate.name}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAIEMENT (LOGIQUE USER) */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => !paymentLoading && setShowPaymentModal(false)}>
          <div className="modal-content payment-modal" onClick={e => e.stopPropagation()}>
            <h3 className="name" style={{textAlign:'center'}}>Paiement PayGate</h3>
            <p className="subtitle" style={{textAlign:'center', marginBottom: 20}}>
                Soutenez {currentCandidateRef.current?.name}
            </p>

            <form onSubmit={processPaygatePayment} className="payment-form">
                <div className="spec-card" style={{marginBottom: 20}}>
                    <label className="spec-label">Nombre de votes</label>
                    <div className="vote-stepper">
                        <button type="button" className="step-btn" onClick={() => setVoteCount(v => Math.max(1, v-1))}>-</button>
                        <input type="number" value={voteCount} readOnly className="vote-input-val" />
                        <button type="button" className="step-btn" onClick={() => setVoteCount(v => v+1)}>+</button>
                    </div>
                    <div className="quick-votes">
                        {QUICK_VOTES.map(v => (
                            <button key={v} type="button" className={`chip ${voteCount === v ? 'active' : ''}`} onClick={() => setVoteCount(v)}>{v}x</button>
                        ))}
                    </div>
                </div>

                <div className="stat-card" style={{justifyContent:'space-between', marginBottom: 20, border: '1px solid var(--primary-gold)'}}>
                    <span className="stat-label">Total à payer</span>
                    <span className="stat-value" style={{color: 'var(--primary-gold)'}}>{voteCount * PRICE_PER_VOTE} FCFA</span>
                </div>

                <div className="network-select">
                    <button type="button" className={`net-btn ${network === 'TMONEY' ? 'active' : ''}`} onClick={() => setNetwork('TMONEY')}>T-Money</button>
                    <button type="button" className={`net-btn ${network === 'FLOOZ' ? 'active' : ''}`} onClick={() => setNetwork('FLOOZ')}>Flooz</button>
                </div>

                <input 
                    type="tel" 
                    placeholder="Numéro de téléphone (ex: 90010203)" 
                    className="phone-input-field"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    maxLength="8"
                    required
                />

                <button type="submit" disabled={paymentLoading || phoneNumber.length < 8} className="btn-main-vote">
                    {paymentLoading ? 'Traitement...' : `Payer ${voteCount * PRICE_PER_VOTE} FCFA`}
                </button>
            </form>
          </div>
        </div>
      )}

      <footer>
        &copy; {new Date().getFullYear()} Miss Intello - Service de vote sécurisé
      </footer>
    </div>
  );
}

.status-banner {
    background: var(--accent-bg);
    border: 1px solid var(--primary-gold);
    padding: 15px;
    border-radius: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.vote-stepper {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin: 10px 0;
}

.step-btn {
    background: var(--glass-border);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 1.5rem;
    cursor: pointer;
}

.vote-input-val {
    background: transparent;
    border: none;
    color: white;
    font-size: 2rem;
    font-weight: bold;
    width: 60px;
    text-align: center;
}

.quick-votes {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 10px;
}

.chip {
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--glass-border);
    color: white;
    padding: 5px 12px;
    border-radius: 20px;
    cursor: pointer;
}

.chip.active {
    background: var(--primary-gold);
    color: black;
}

.network-select {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.net-btn {
    flex: 1;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid var(--glass-border);
    background: transparent;
    color: white;
    cursor: pointer;
}

.net-btn.active {
    border-color: var(--primary-gold);
    background: var(--accent-bg);
}

.phone-input-field {
    width: 100%;
    padding: 15px;
    border-radius: 12px;
    background: rgba(0,0,0,0.2);
    border: 1px solid var(--glass-border);
    color: white;
    font-size: 1.1rem;
    margin-bottom: 20px;
    box-sizing: border-box;
}

.btn-back {
    background: transparent;
    border: none;
    color: #b085ff;
    cursor: pointer;
    margin-bottom: 20px;
    font-size: 1rem;
}