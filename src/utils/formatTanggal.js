const formatTanggal = (dateString) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(dateString));
};

export default formatTanggal