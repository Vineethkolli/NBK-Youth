import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';

function PeopleStatsEnglishPrint({ people, streets }) {
  const handlePrint = () => {
    const youth = people.filter((person) => person.category === 'Youth').length;
    const villagers = people.filter((person) => person.category === 'Villager').length;
    const streetRows = streets.map((street) => [
      street,
      people.filter((person) => person.street === street).length
    ]);
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('People Statistics', 105, 15, { align: 'center' });
    autoTable(doc, {
      head: [['Metric', 'Count']],
      body: [
        ['People count', people.length],
        ['Youth count', youth],
        ['Villagers count', villagers]
      ],
      startY: 25
    });
    autoTable(doc, {
      head: [['Street', 'Count']],
      body: streetRows,
      startY: doc.lastAutoTable.finalY + 10
    });
    doc.save('People-Statistics.pdf');
  };

  return (
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="mr-1 h-4 w-4" />
      Print
    </button>
  );
}

export default PeopleStatsEnglishPrint;
