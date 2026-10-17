import { useEffect } from "react";

const usePageMeta = (title, description) => {
  useEffect(() => {
    document.title = title ? `${title} — AUTRAXIS` : "AUTRAXIS — Intelligence. Integrated.";
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (tag) tag.setAttribute("content", description);
    }
  }, [title, description]);
};

export default usePageMeta;
