/* eslint-disable react/prop-types */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';

function PeopleMapPrint({ people }) {
  const handlePrint = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('People Map - Visible Locations', 105, 15, { align: 'center' });
    autoTable(doc, {
      head: [['S.No', 'PID', 'Name', 'Category', 'Street', 'Location']],
      body: people.map((person, index) => [
        index + 1, person.pid, person.name, person.category, person.street,
        person.location ? `${person.location.lat}, ${person.location.lng}` : '-'
      ]),
      startY: 25
    });
    doc.save('People-Map.pdf');
  };
  return <button onClick={handlePrint} className="btn-secondary flex items-center"><Printer className="mr-1 h-4 w-4" />Print</button>;
}

export default PeopleMapPrint;
