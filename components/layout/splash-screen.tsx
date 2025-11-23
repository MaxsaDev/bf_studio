"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function SplashScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading or wait for resources
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F5F5F4] dark:bg-[#0C0A09]"
        >
          <div className="relative flex flex-col items-center">
             {/* Animated Logo/Text */}
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 text-center space-y-4"
             >
                <h1 className="text-6xl sm:text-8xl font-serif font-bold tracking-tighter text-stone-900 dark:text-stone-100">
                  BODY FACTORY
                </h1>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeInOut" }}
                  className="h-0.5 bg-stone-900 dark:bg-stone-100 mx-auto"
                />
                <motion.p
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 1, duration: 0.5 }}
                   className="text-sm font-bold tracking-[0.4em] text-stone-500 uppercase"
                >
                  The Ritual
                </motion.p>
             </motion.div>

             {/* Background Pulse */}
             <motion.div
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: [0, 0.2, 0], scale: 1.5 }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-stone-300/20 dark:bg-stone-700/20 blur-[100px] -z-10"
             />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

