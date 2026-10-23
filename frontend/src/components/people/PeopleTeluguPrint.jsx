import { useRef } from 'react';
import { Printer } from 'lucide-react';

function PeopleTeluguPrint({ people, visibleColumns }) {
  const printRef = useRef();
  const columns = Object.entries(visibleColumns).filter(([, visible]) => visible).map(([key]) => key);
  const labels = { pid: 'PID', name: 'Name', category: 'Category', email: 'Email', phone: 'Phone', street: 'Street', location: 'Location' };
  const value = (person, column) => column === 'location'
    ? (person.location ? `${person.location.lat}, ${person.location.lng}` : '-')
    : person[column] || '-';
  const handlePrint = () => {
    const printWindow = window.open('', 'people-print', 'height=700,width=1000');
    printWindow.document.write('<style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left;font-size:12px}th{background:#f4f4f4}</style><h2 style="text-align:center">ప్రజల నివేదిక</h2>');
    printWindow.document.write(printRef.current.innerHTML);
    printWindow.document.close();
    printWindow.print();
  };
  return <><button onClick={handlePrint} className="btn-secondary flex items-center"><Printer className="mr-1 h-4 w-4" />Print</button><div ref={printRef} style={{ display: 'none' }}><table><thead><tr><th>S.No</th>{columns.map((column) => <th key={column}>{labels[column] || column}</th>)}</tr></thead><tbody>{people.map((person, index) => <tr key={person._id}><td>{index + 1}</td>{columns.map((column) => <td key={column}>{value(person, column)}</td>)}</tr>)}</tbody></table></div></>;
}

export default PeopleTeluguPrint;
