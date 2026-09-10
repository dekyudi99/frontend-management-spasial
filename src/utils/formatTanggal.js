const formatTanggal = (dateString) => {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(dateString));
};

export default formatTanggal