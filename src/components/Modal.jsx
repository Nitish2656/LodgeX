import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '500px' }) {
  const [render, setRender] = useState(isOpen);
  const [isClickable, setIsClickable] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => setIsClickable(true), 250);
      return () => { 
        clearTimeout(timer);
        document.body.style.overflow = 'unset'; 
      };
    } else {
      setIsClickable(false);
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const onAnimationEnd = () => {
    if (!isOpen) setRender(false);
  };

  if (!render) return null;

  return createPortal(
    <div 
      className={`modal-overlay ${isOpen ? 'open' : 'closed'}`} 
      onAnimationEnd={onAnimationEnd}
      onClick={(e) => { if (isClickable) onClose(e); }}
    >
      <div 
        className="modal-container" 
        style={{ maxWidth }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
