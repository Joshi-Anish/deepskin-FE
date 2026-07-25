export const formatDate = (value, options = {}) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...options }).format(new Date(value));
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
};

export const timeAgo = (value) => {
  if (!value) return '—';
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d`;
};

export const statusLabel = {
  pending: 'Pending',
  inReview: 'In Review',
  reviewed: 'Reviewed',
};

export const verdictLabel = {
  reassure: 'Reassure',
  monitor: 'Monitor',
  recommendBiopsy: 'Recommend Biopsy',
  referSpecialist: 'Refer to Specialist',
};
