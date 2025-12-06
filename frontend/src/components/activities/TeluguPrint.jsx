import { useRef } from 'react';
import { Printer } from 'lucide-react';

function ActivitiesTeluguPrint({ games }) {
  const printRef = useRef();
const handlePrint = () => {
  const content = printRef.current.innerHTML;
  const printWindow = window.open('height=700,width=1000');

  printWindow.document.write(`
    <html>
    <head>
      <style>
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
        th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; }

        th:nth-child(1), td:nth-child(1) { width: 40px; text-align: center; }
        th:nth-child(2), td:nth-child(2) { width: 45px; text-align: center; }
        th:nth-child(3), td:nth-child(3) { width: 95px; text-align: center; }

        th { background: #f4f4f4; }
        .game-title { font-size: 14px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
      </style>
    </head>
    <body>
      <div style="text-align:center;">
        <h2>కార్యకలాపాల నివేదిక</h2>
      </div>
  `);

  printWindow.document.write(content);
  printWindow.document.write(`</body></html>`);
  printWindow.document.close();
  printWindow.print();
};

  return (
    <>
      <button 
        onClick={handlePrint}
        className="btn-primary"
      >
        <Printer className="h-4 w-4 mr-2" />
        Print
      </button>

      <div ref={printRef} style={{ display: 'none' }}>
        {games.map((game) => {
          const winnersSorted = game.players
            .filter((p) => p.status && p.status.startsWith("winner-"))
            .sort(
              (a, b) =>
                parseInt(a.status.split("-")[1]) -
                parseInt(b.status.split("-")[1])
            );

          if (winnersSorted.length === 0) return null;

          return (
            <div key={game._id}>
              <div className="game-title">{game.name}</div>

              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Winner</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {winnersSorted.map((player, index) => (
                    <tr key={player._id}>
                      <td><span translate="no">{index + 1}</span></td>
                      <td>{player.status.split("-")[1]}</td>
                      <td>{player.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default ActivitiesTeluguPrint;
