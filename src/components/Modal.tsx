import React from "react";
import "./Modal.css";

export const Modal: React.FC<{ title?: string; onClose?: () => void; children?: React.ReactNode }> = ({ title, onClose, children }) => {
  return (
    <div className="uml-modal-overlay" onMouseDown={onClose}>
      <div className="uml-modal" onMouseDown={(e) => e.stopPropagation()}>
        {title && <h3>{title}</h3>}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
