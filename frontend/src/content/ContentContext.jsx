import { createContext, useContext, useEffect, useState } from "react";

const ContentCtx = createContext(null);

export const ContentProvider = ({ children }) => {
  const [bundle, setBundle] = useState(null);
  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/content/bundle`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBundle(d))
      .catch(() => {});
  }, []);
  return <ContentCtx.Provider value={bundle}>{children}</ContentCtx.Provider>;
};

export const useContent = () => useContext(ContentCtx);
