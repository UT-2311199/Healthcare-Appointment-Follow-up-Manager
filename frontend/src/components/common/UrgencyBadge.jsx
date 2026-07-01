import { URGENCY_CONFIG } from '../../utils/constants';

export default function UrgencyBadge({ level }) {
  const config = URGENCY_CONFIG[level] || URGENCY_CONFIG.Low;
  return (
    <span className={`badge ${config.color}`}>
      {config.icon} {level} Urgency
    </span>
  );
}