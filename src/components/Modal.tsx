import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

export const Modal: React.FC<{ title?: string; onClose?: () => void; children?: React.ReactNode }> = ({ title, onClose, children }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // mount -> show
    const t = window.setTimeout(() => setVisible(true), 10);
    return () => window.clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    // wait for animation to finish before calling onClose
    setTimeout(() => {
      onClose && onClose();
    }, 180);
  };

  const modal = (
    <div className={`uml-modal-overlay ${visible ? 'visible' : ''}`} onMouseDown={handleClose}>
      <div className={`uml-modal ${visible ? 'visible' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        {title && <h3>{title}</h3>}
        <div>{children}</div>
      </div>
    </div>
  );

  // render via portal to the document body so it sits above any stacking contexts
  try {
    return createPortal(modal, document.body);
  } catch (err) {
    // fallback to inline rendering if portal isn't available (e.g., SSR)
    return modal;
  }
};

export default Modal;
