"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppConfig, AppProps } from "./app-registry";

interface ActiveApp {
  id: string;
  instanceId: string;
  config: AppConfig;
}

function AppModal({ app, onClose }: { app: ActiveApp; onClose: () => void }) {
  const [Component, setComponent] = useState<React.ComponentType<AppProps> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // +++  Lazy load app component +++
    app.config.component().then((module) => {
      setComponent(() => module.default);
      setLoading(false);
    });
  }, [app.config]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* +++  Blurred background effect +++  */}
        <div className="absolute inset-0 blur-3xl pointer-events-none" />

        {/* +++  Modal card +++  */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative z-10 w-11/12 h-5/6 max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <span className="text-xl">{app.config.icon}</span>
              <h2 className="text-lg font-semibold text-gray-900">
                {app.config.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="w-full h-[calc(100%-60px)] overflow-auto bg-white">
            {loading ? (
              <div className="flex items-center justify-center w-full h-full">
                <div className="text-gray-400">Loading {app.config.name}...</div>
              </div>
            ) : Component ? (
              // +++  App rendered in isolation +++
              <Component
                appInstanceId={app.instanceId}
                onClose={onClose}
              />
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export { AppModal };
