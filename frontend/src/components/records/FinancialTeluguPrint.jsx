import { useRef } from "react";
import { Printer } from "lucide-react";

const FinancialTeluguPrint = ({ records, selectedEvent }) => {
  const printRef = useRef();

  const getTranslatedEventName = () => {
    if (!selectedEvent) return "";
    const name = selectedEvent;

    const translations = [
      { en: "Sankranti", te: "సంక్రాంతి" },
      { en: "Ganesh Chaturthi", te: "గణేశ్ చతుర్థి" }
    ];

    let translated = name;
    translations.forEach(({ en, te }) => {
      if (translated.includes(en)) translated = translated.replace(en, te);
    });

    return translated;
  };

  const translateAccountHolder = (name) => {
    if (!name) return "-";

    const replacements = [
      { en: "Kolli Vineeth", te: "కొల్లి వినీత్" },
      { en: "Kari Ranjith", te: "కరి రంజిత్" },
      { en: "NBK Youth", te: "ఎన్‌బికే యూత్" }
    ];

    let result = name;
    replacements.forEach(({ en, te }) => {
      if (result.includes(en)) result = result.replace(en, te);
    });

    return result;
  };

  const handlePrint = () => {
    const translatedEventName = getTranslatedEventName();
    const content = printRef.current.innerHTML;
    const printWindow = window.open("height=700,width=1000");

    printWindow.document.write(`
      <style>
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: center; font-size: 12px; }
        th { background: #e8f0fe; }

        /* Only spacing — removed page-break */
        .section { 
          margin: 34px 0;
        }

        .year-title { 
          font-size: 16px; 
          font-weight: bold; 
          margin: 16px 0 14px; 
        }

        .remarks { 
          text-align: left; 
          font-size: 12px; 
          margin-top: 10px;
          margin-bottom: 24px;
        }

        @media print { button { display: none; } }
      </style>
    `);

    printWindow.document.write("</head><body>");
    printWindow.document.write(
      `<div style="text-align:center;"><h2><span translate="no">ఆర్థిక కాలక్రమ నివేదిక</span></h2></div>`
    );

    if (translatedEventName) {
      printWindow.document.write(
        `<div style="text-align:center;margin-bottom:10px;color:#666;">${translatedEventName}</div>`
      );
    }

    printWindow.document.write(content);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
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

          const formatAmount = (val) =>
            typeof val === "number"
              ? new Intl.NumberFormat("te-IN").format(val)
              : "-";

          const formatDate = (date) => {
            if (!date) return "-";
            const d = new Date(date);
            return isNaN(d) ? "-" : d.toLocaleDateString("te-IN");
          };

          return (
            <div key={i} className="section">
              {rec.year && (
                <div className="year-title">{rec.year}</div>
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
                    <td><span translate="no">{formatAmount(rec.amountLeft)}</span></td>
                    <td>
                      <span translate="no">
                        {interest !== null
                          ? (interest > 0 ? "+" : "") + formatAmount(interest)
                          : "-"}
                      </span>
                    </td>
                    <td><span translate="no">{formatAmount(rec.maturityAmount)}</span></td>
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
                    <td><span translate="no">{formatDate(rec.fdStartDate)}</span></td>
                    <td><span translate="no">{formatDate(rec.fdMaturityDate)}</span></td>
                    <td><span translate="no">{translateAccountHolder(rec.fdAccount)}</span></td>
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
