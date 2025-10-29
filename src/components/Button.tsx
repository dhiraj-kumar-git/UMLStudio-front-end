import React from "react";

interface ButtonProps {
  text: string;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ text, onClick }) => (
  <button className="button" onClick={onClick}>
    {text}
  </button>
);
