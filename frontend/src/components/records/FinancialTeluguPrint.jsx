import { useRef } from "react";
import { Printer } from "lucide-react";

const FinancialTeluguPrint = ({ records, selectedEvent }) => {
  const printRef = useRef();

  const safeAmount = (val) =>
    typeof val === "number"
      ? new Intl.NumberFormat("te-IN").format(val)
      : "-";

  const safeDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return isNaN(d) ? "-" : d.toLocaleDateString("te-IN");
  };

  const handlePrint = () => {
    const renderedLabel = document
      .getElementById("event-label-display")
      ?.innerText?.trim();

    const content = printRef.current.innerHTML;
    const win = window.open("height=700,width=1000");

    win.document.write(`
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          
          .section { margin-bottom: 28px; page-break-inside: avoid; }
          .year-title { font-size: 15px; font-weight: bold; margin: 12px 0 6px; }

          table { width: 100%; border-collapse: collapse; margin-top: 6px; }
          th, td {
            border: 1px solid #ccc;
            padding: 6px;
            font-size: 12px;
            text-align: center;
          }
          th { background: #e8f0fe; }
          
          .header-title {
            text-align: center;
            margin-bottom: 4px;
            font-size: 16px;
            font-weight: bold;
          }
          .event-label {
            text-align: center;
            margin-bottom: 14px;
            color: #444;
            font-size: 13px;
          }

          .remarks {
            text-align: left;
            font-size: 12px;
            margin-top: 6px;
            padding: 4px;
            border-left: 3px solid #555;
          }

          @media print {
            button { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header-title"><span translate="no">ఆర్థిక కాలక్రమ నివేదిక</span></div>
    `);

    if (renderedLabel || selectedEvent) {
      win.document.write(
        `<div class="event-label">${
          renderedLabel || selectedEvent
        }</div>`
      );
    }

    win.document.write(content);

    win.document.write(`
        <script>
          window.onload = function() { window.print(); window.close(); };
        </script>
      </body></html>
    `);

    win.document.close();
  };

  return (
    <>
      <button onClick={handlePrint} className="btn-secondary flex items-center">
        <Printer className="h-4 w-4 mr-1 inline" />
        ప్రింట్
      </button>

      <div ref={printRef} style={{ display: "none" }}>
        {records.map((rec, i) => {
          const interest =
            typeof rec.maturityAmount === "number" &&
            typeof rec.amountLeft === "number"
              ? rec.maturityAmount - rec.amountLeft
              : null;

          return (
            <div className="section" key={i}>
              {rec.year && (
                <div className="year-title">
                  {rec.year}
                </div>
              )}

              <table>
                <thead>
                  <tr>
                    <th>మిగిలిన మొత్తం</th>
                    <th>వ్యాజ్యం</th>
                    <th>చివరలో పొందే మొత్తం</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span translate="no">{safeAmount(rec.amountLeft)}</span></td>
                    <td><span translate="no">
                      {interest !== null ? (interest > 0 ? "+" : "") + safeAmount(interest) : "-"}
                    </span></td>
                    <td><span translate="no">{safeAmount(rec.maturityAmount)}</span></td>
                  </tr>
                </tbody>
              </table>

              <table>
                <thead>
                  <tr>
                    <th>డిపాజిట్ ప్రారంభం</th>
                    <th>డిపాజిట్ పూర్తయ్యే తేదీ</th>
                    <th>డిపాజిట్ ఖాతా</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span translate="no">{safeDate(rec.fdStartDate)}</span></td>
                    <td><span translate="no">{safeDate(rec.fdMaturityDate)}</span></td>
                    <td><span translate="no">{rec.fdAccount?.trim() || "-"}</span></td>
                  </tr>
                </tbody>
              </table>

              {rec.remarks?.trim() && (
                <div className="remarks">{rec.remarks}</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default FinancialTeluguPrint;
