import { useState, useEffect }                    from 'react';
import { format, addDays, startOfToday }          from 'date-fns';
import { ChevronLeft, ChevronRight }              from 'lucide-react';
import { motion, AnimatePresence }                from 'framer-motion';
import api                                        from '../../api/axios';
import LoadingSpinner                             from '../common/LoadingSpinner';

export default function SlotPicker({ doctorId, onSlotSelect, selectedSlot }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots,       setSlots]       = useState([]);
  const [loading,     setLoading]     = useState(false);

  const today = startOfToday();
  const days  = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  useEffect(() => {
    if (doctorId) fetchSlots();
  }, [doctorId, currentDate]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const dateStr   = format(currentDate, 'yyyy-MM-dd');
      const { data }  = await api.get(`/doctors/${doctorId}/slots?date=${dateStr}`);
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Style helpers (no mixing className strings with style props) ──
  const getDayStyle = (isSelected) => ({
    background:  isSelected ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'var(--bg-input)',
    color:       isSelected ? '#ffffff'                                   : 'var(--text-secondary)',
    border:      isSelected ? '1px solid transparent'                    : '1px solid var(--border-input)',
    boxShadow:   isSelected ? '0 4px 12px rgba(124,58,237,0.35)'         : 'none',
  });

  const getSlotStyle = (isSelected, isBooked) => {
    if (isBooked) {
      return {
        background: 'var(--bg-card)',
        color:      'var(--text-muted)',
        border:     '1px solid var(--border-primary)',
        cursor:     'not-allowed',
        opacity:    0.5,
      };
    }
    if (isSelected) {
      return {
        background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
        color:      '#ffffff',
        border:     '1px solid transparent',
        boxShadow:  '0 4px 12px rgba(124,58,237,0.35)',
      };
    }
    return {
      background: 'var(--bg-input)',
      color:      'var(--text-secondary)',
      border:     '1px solid var(--border-input)',
    };
  };

  return (
    <div className="space-y-5">

      {/* ── Day Selector ── */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Select Date
        </p>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((day, i) => {
            const dateStr    = format(day, 'yyyy-MM-dd');
            const currentStr = format(currentDate, 'yyyy-MM-dd');
            const isSelected = dateStr === currentStr;
            const isToday    = dateStr === format(today, 'yyyy-MM-dd');

            return (
              <motion.button
                key={day.toISOString()}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0  }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setCurrentDate(day)}
                className="flex-shrink-0 flex flex-col items-center p-3 rounded-xl
                           w-14 transition-all duration-200 relative"
                style={getDayStyle(isSelected)}
              >
                {/* Today indicator */}
                {isToday && !isSelected && (
                  <div
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--text-accent)' }}
                  />
                )}

                <span
                  className="text-xs font-medium mb-1"
                  style={{
                    color: isSelected
                      ? 'rgba(255,255,255,0.8)'
                      : 'var(--text-muted)',
                  }}
                >
                  {format(day, 'EEE')}
                </span>

                <span className="text-lg font-bold leading-none">
                  {format(day, 'd')}
                </span>

                <span
                  className="text-xs mt-1"
                  style={{
                    color: isSelected
                      ? 'rgba(255,255,255,0.7)'
                      : 'var(--text-muted)',
                  }}
                >
                  {format(day, 'MMM')}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Date Label ── */}
      <div
        className="flex items-center justify-between px-1"
      >
        <p
          className="text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </p>
        {!loading && slots.length > 0 && (
          <p
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {slots.filter((s) => !s.booked).length} slots available
          </p>
        )}
      </div>

      {/* ── Slots ── */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Available Times
        </p>

        {loading ? (
          <LoadingSpinner text="Loading slots..." />
        ) : slots.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-8 text-center"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center
                          mx-auto mb-3 text-2xl"
              style={{ background: 'var(--bg-card)' }}
            >
              📅
            </div>
            <p
              className="font-medium text-sm"
              style={{ color: 'var(--text-primary)' }}
            >
              No slots available
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Doctor is not available on this day
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={format(currentDate, 'yyyy-MM-dd')}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{   opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-3 sm:grid-cols-4 gap-2"
            >
              {slots.map((slot, i) => {
                const isSelected =
                  selectedSlot?.time === slot.time &&
                  selectedSlot?.date === format(currentDate, 'yyyy-MM-dd');

                return (
                  <motion.button
                    key={slot.time}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1   }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={slot.booked ? {} : { scale: 1.04, y: -1 }}
                    whileTap={slot.booked   ? {} : { scale: 0.96 }}
                    disabled={slot.booked}
                    onClick={() => {
                      if (!slot.booked) {
                        onSlotSelect({
                          time: slot.time,
                          date: format(currentDate, 'yyyy-MM-dd'),
                        });
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl text-sm font-semibold
                               transition-all duration-200 relative"
                    style={getSlotStyle(isSelected, slot.booked)}
                  >
                    {/* Booked overlay label */}
                    {slot.booked ? (
                      <span className="text-xs">Booked</span>
                    ) : (
                      slot.time
                    )}

                    {/* Selected checkmark */}
                    {isSelected && !slot.booked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full
                                   bg-green-400 flex items-center justify-center"
                      >
                        <span className="text-white text-xs leading-none">✓</span>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ── Selected Slot Summary ── */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0,  height: 'auto' }}
            exit={{   opacity: 0, y: 10,  height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: 'var(--success-bg)',
                border:     '1px solid var(--success-border)',
              }}
            >
              <span className="text-lg">✅</span>
              <div>
                <p
                  className="text-xs font-semibold"
                  style={{ color: 'var(--success-text)' }}
                >
                  Slot Selected
                </p>
                <p
                  className="text-sm font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {selectedSlot.date} at {selectedSlot.time}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}