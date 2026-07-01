import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon }               from 'lucide-react';
import { useTheme }                from '../../context/ThemeContext';

export default function ThemeToggle({ showLabel = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        background:   'var(--bg-input)',
        border:       '1px solid var(--border-input)',
        color:        'var(--text-secondary)',
      }}
      className={`relative flex items-center gap-2 rounded-xl
                  transition-all duration-300 cursor-pointer
                  ${showLabel ? 'px-3 py-2' : 'w-9 h-9 justify-center'}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0,   opacity: 1, scale: 1   }}
            exit={{   rotate:  90,  opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <Sun className="w-4 h-4" style={{ color: '#fbbf24' }} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90,  opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0,   opacity: 1, scale: 1   }}
            exit={{   rotate: -90,  opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <Moon className="w-4 h-4" style={{ color: '#6366f1' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {showLabel && (
        <span className="text-sm font-medium whitespace-nowrap"
              style={{ color: 'var(--text-secondary)' }}>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </motion.button>
  );
}