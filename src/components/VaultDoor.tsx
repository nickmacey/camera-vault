import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VaultDoorProps {
  onOpen: () => void;
}

export const VaultDoor = ({ onOpen }: VaultDoorProps) => {
  const [isOpening, setIsOpening] = useState(false);
  const [showMessage, setShowMessage] = useState(true);

  useEffect(() => {
    // Show the door opening message after a delay
    const timer = setTimeout(() => {
      setShowMessage(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    setIsOpening(true);
    
    // Play vault door sound (you can add audio here)
    // const audio = new Audio("/vault-door.mp3");
    // audio.play();

    // Trigger onOpen after animation completes
    setTimeout(() => {
      onOpen();
    }, 2500);
  };

  return (
    <div className="relative h-screen w-full bg-vault-black overflow-hidden flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-vault-gold/20 via-transparent to-transparent opacity-50" />

      {/* Message */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-1/4 text-center z-10"
          >
            <p className="text-2xl text-vault-gold font-light">
              What's in your vault?
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vault Door */}
      <motion.div
        className="relative cursor-pointer group"
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        {/* Door frame */}
        <div className="relative w-96 h-96">
          {/* Main door body */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-vault-gold via-vault-gold-dark to-vault-gold rounded-lg shadow-2xl"
            animate={{
              boxShadow: isOpening
                ? "0 0 100px rgba(212, 175, 55, 0.8)"
                : "0 0 50px rgba(212, 175, 55, 0.3)",
            }}
          >
            {/* Geometric segments */}
            <div className="absolute inset-4 grid grid-cols-3 grid-rows-3 gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="bg-vault-dark/30 border border-vault-gold-dark/50"
                  animate={
                    isOpening
                      ? {
                          opacity: [1, 0],
                          scale: [1, 1.2],
                          rotate: [(i % 2 === 0 ? 45 : -45)],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.8,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>

            {/* Center lock mechanism */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24">
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-vault-dark bg-vault-gold-dark shadow-inner"
                animate={
                  isOpening
                    ? {
                        rotate: [0, 360, 720],
                        scale: [1, 1.2, 0],
                      }
                    : { rotate: 0 }
                }
                transition={{ duration: 2, ease: "easeInOut" }}
              >
                {/* Lock lines */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-vault-dark" />
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-vault-dark" />
              </motion.div>
            </div>

            {/* Decorative bolts */}
            {[0, 90, 180, 270].map((angle) => (
              <motion.div
                key={angle}
                className="absolute w-4 h-4 rounded-full bg-vault-dark border-2 border-vault-gold-dark"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-140px)`,
                }}
                animate={
                  isOpening
                    ? {
                        scale: [1, 0.5, 0],
                        opacity: [1, 1, 0],
                      }
                    : {}
                }
                transition={{
                  duration: 1,
                  delay: 0.5,
                }}
              />
            ))}
          </motion.div>

          {/* Door light beam */}
          <AnimatePresence>
            {isOpening && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-vault-gold/50 to-transparent"
                style={{ transformOrigin: "center" }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Hover instruction */}
        {!isOpening && (
          <motion.p
            className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-vault-light-gray text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
          >
            Click to enter your vault
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};
