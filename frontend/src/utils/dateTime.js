export function formatDateTime(dateString) {
  if (!dateString) return '';
  
  const utcDate = new Date(dateString);
  const localDate = new Date(utcDate.getTime() + (new Date().getTimezoneOffset() * -60000)); // convert UTC → local

  const day = localDate.getDate().toString().padStart(2, '0');
  const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
  const year = localDate.getFullYear();

  let hours = localDate.getHours();
  const minutes = localDate.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
}
