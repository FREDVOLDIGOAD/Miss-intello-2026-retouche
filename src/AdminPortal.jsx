// --- LOGIQUE DE ROUTAGE ADMIN CORRIGÉE ---
  // On utilise .includes pour être sûr de capter l'URL
  if (window.location.pathname.includes("/admin")) {
    if (!isAdmin) {
      return (
        <div className="admin-login-screen" style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', color:'white'}}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="login-card">
            <Trophy size={50} color="#d4af37" style={{marginBottom:'20px'}} />
            <h2 style={{fontFamily: 'Playfair Display, serif', fontSize:'2rem'}}>Accès Comité</h2>
            <p style={{color:'#888', marginBottom:'30px'}}>Espace sécurisé - Clé d'or requise</p>
            
            <form onSubmit={handleAdminLogin} style={{width:'100%'}}>
              <input 
                type="password" 
                placeholder="PIN" 
                maxLength="4" 
                value={adminPin} 
                onChange={(e) => setAdminPin(e.target.value)}
                autoFocus
                style={{background:'#000', border:'1px solid #333', padding:'15px', borderRadius:'10px', color:'white', width:'100%', textAlign:'center', fontSize:'1.5rem', letterSpacing:'10px', marginBottom:'20px', boxSizing:'border-box'}}
              />
              <button type="submit" className="btn-confirm-final">S'IDENTIFIER</button>
            </form>
            <a href="/" style={{marginTop:'20px', color:'#666', textDecoration:'none', fontSize:'0.8rem'}}>Retour au site public</a>
          </motion.div>
        </div>
      );
    }
    // Si déjà identifié, on montre le portail
    return <AdminPortal onBack={() => {
        sessionStorage.removeItem("miss_admin_token");
        window.location.href = "/";
    }} />;
  }