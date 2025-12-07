import { useRef } from "react";
import { Printer } from "lucide-react";

const FinancialTeluguPrint = ({ records, selectedEvent }) => {
  const printRef = useRef();

  const getTranslatedEventName = () => {
    if (!selectedEvent) return "";
    const name = selectedEvent;
    if (name.includes("Sankranti")) {
      return name.replace("Sankranti", "సంక్రాంతి");
    } else if (name.includes("Ganesh Chaturthi")) {
      return name.replace("Ganesh Chaturthi", "గణేశ్ చతుర్థి");
    }
    return name;
  };

  const handlePrint = () => {
    const translatedEventName = getTranslatedEventName();
    const content = printRef.current.innerHTML;
    const printWindow = window.open("height=700,width=1000");
    printWindow.document.write(
      '<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ccc; padding: 6px; text-align: center; font-size: 12px; } th { background: #e8f0fe; } .remarks { text-align: left; font-size: 12px; margin-top: 6px; } @media print { button { display: none; } }</style>'
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write(
      '<div style="text-align: center;"><h2><span translate="no">ఆర్థిక కాలక్రమ నివేదిక</span></h2></div>'
    );
    if (translatedEventName) {
      printWindow.document.write(
        `<div class="event-label" style="text-align: center; margin-bottom: 10px; color: #666;">${translatedEventName}</div>`
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
            <div key={i}>
              {rec.year && (
                <div style={{ fontSize: "15px", fontWeight: "bold", margin: "12px 0 6px" }}>
                  {rec.year}
                </div>
              )}

              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "6px" }}>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center", background: "#e8f0fe" }}>
                      మిగిలిన మొత్తం
                    </th>
                    <th style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center", background: "#e8f0fe" }}>
                      వ్యాజ్యం
                    </th>
                    <th style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center", background: "#e8f0fe" }}>
                      చివరలో పొందే మొత్తం
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center", fontSize: "12px" }}>
                      <span translate="no">{formatAmount(rec.amountLeft)}</span>
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center", fontSize: "12px" }}>
                      <span translate="no">
                        {interest !== null
                          ? (interest > 0 ? "+" : "") + formatAmount(interest)
                          : "-"}
                      </span>
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center", fontSize: "12px" }}>
                      <span translate="no">{formatAmount(rec.maturityAmount)}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "6px" }}>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center", background: "#e8f0fe" }}>
                      డిపాజిట్ ప్రారంభం
                    </th>
                    <th style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center", background: "#e8f0fe" }}>
                      డిపాజిట్ పూర్తయ్యే తేదీ
                    </th>
                    <th style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center", background: "#e8f0fe" }}>
                      డిపాజిట్ ఖాతా
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center", fontSize: "12px" }}>
                      <span translate="no">{formatDate(rec.fdStartDate)}</span>
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center", fontSize: "12px" }}>
                      <span translate="no">{formatDate(rec.fdMaturityDate)}</span>
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center", fontSize: "12px" }}>
                      <span translate="no">{rec.fdAccount?.trim() || "-"}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {rec.remarks?.trim() && (
                <div style={{ textAlign: "left", fontSize: "12px", marginTop: "6px" }}>
                  {rec.remarks}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default FinancialTeluguPrint;
