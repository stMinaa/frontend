import React from 'react';

function Modal({ onClose, title, children }) {
  return (
    <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
      <div className="card" style={{minWidth:'320px',maxWidth:'560px',width:'90%',padding:'24px 24px 28px',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:10,right:10,background:'transparent',border:'none',fontSize:20,cursor:'pointer',lineHeight:1}} aria-label="Close">×</button>
        {title && <h3 style={{marginTop:0,marginBottom:16}}>{title}</h3>}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;