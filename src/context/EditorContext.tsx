import React, { createContext, useContext, useState, type ReactNode } from "react";

interface EditorContextType {
  selectedId?: string;
  setSelectedId: (id?: string) => void;
  zoom: number;
  setZoom: (z: number) => void;
}

const EditorContext = createContext<EditorContextType>({
  setSelectedId: () => {},
  zoom: 1,
  setZoom: () => {}
});

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [zoom, setZoom] = useState<number>(1);

  return (
    <EditorContext.Provider value={{ selectedId, setSelectedId, zoom, setZoom }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorContext = () => useContext(EditorContext);

export default EditorContext;
