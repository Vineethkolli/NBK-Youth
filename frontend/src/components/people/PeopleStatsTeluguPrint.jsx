import { useRef } from 'react';
import { Printer } from 'lucide-react';

function PeopleStatsTeluguPrint({ people, streets }) {
  const printRef = useRef();
  const youth = people.filter((person) => person.category === 'Youth').length;
  const villagers = people.filter((person) => person.category === 'Villager').length;

  const handlePrint = () => {
    const printWindow = window.open('', 'people-stats-print', 'height=700,width=1000');
    if (!printWindow) return;
    printWindow.document.write(
      '<style>table{width:100%;border-collapse:collapse;margin-bottom:24px}th,td{border:1px solid #ccc;padding:8px;text-align:left;font-size:12px}th{background:#f4f4f4}</style><h2 style="text-align:center">ప్రజల గణాంకాలు</h2>'
    );
    printWindow.document.write(printRef.current.innerHTML);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <button onClick={handlePrint} className="btn-secondary flex items-center">
        <Printer className="mr-1 h-4 w-4" />
        Print
      </button>
      <div ref={printRef} style={{ display: 'none' }}>
        <table>
          <thead><tr><th>వివరం</th><th>సంఖ్య</th></tr></thead>
          <tbody>
            <tr><td>మొత్తం ప్రజలు</td><td>{people.length}</td></tr>
            <tr><td>యువత</td><td>{youth}</td></tr>
            <tr><td>గ్రామస్థులు</td><td>{villagers}</td></tr>
          </tbody>
        </table>
        <table>
          <thead><tr><th>వీధి</th><th>సంఖ్య</th></tr></thead>
          <tbody>
            {streets.map((street) => (
              <tr key={street}>
                <td>{street}</td>
                <td>{people.filter((person) => person.street === street).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default PeopleStatsTeluguPrint;
