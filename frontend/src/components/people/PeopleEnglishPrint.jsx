/* eslint-disable react/prop-types */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';

function PeopleEnglishPrint({ people, visibleColumns }) {
  const handlePrint = () => {
    const columns = Object.entries(visibleColumns).filter(([, visible]) => visible).map(([key]) => key);
    const labels = { pid: 'PID', name: 'Name', category: 'Category', email: 'Email', phone: 'Phone', street: 'Street', location: 'Location' };
    const body = people.map((person, index) => [
      index + 1,
      ...columns.map((column) => column === 'location'
        ? (person.location ? `${person.location.lat}, ${person.location.lng}` : '-')
        : person[column] || '-')
    ]);
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('People Report', 105, 15, { align: 'center' });
    autoTable(doc, { head: [['S.No', ...columns.map((column) => labels[column] || column)]], body, startY: 25 });
    doc.save('People.pdf');
  };
  return <button onClick={handlePrint} className="btn-secondary flex items-center"><Printer className="mr-1 h-4 w-4" />Print</button>;
}

export default PeopleEnglishPrint;
