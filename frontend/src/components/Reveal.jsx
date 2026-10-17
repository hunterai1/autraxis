import { motion } from "framer-motion";

export const Reveal = ({ children, delay = 0, className = "", y = 28 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

export const Eyebrow = ({ children, dark = false }) => (
  <p
    className={`font-mono text-xs uppercase tracking-[0.3em] mb-4 ${
      dark ? "text-cyanglow" : "text-electric"
    }`}
  >
    {children}
  </p>
);

export const MaskedLines = ({ lines, className = "", lineClassName = "", as: Tag = "h1" }) => {
  const MotionTag = motion[Tag] || motion.h1;
  return (
    <MotionTag className={className}>
      {lines.map((line, i) => (
        <span key={line} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <motion.span
            className={`block ${lineClassName}`}
            initial={{ y: "112%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 + i * 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
};

export default Reveal;
