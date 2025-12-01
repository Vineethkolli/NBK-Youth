import { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, FolderIcon } from "lucide-react";

export default function PdfMergerTool() {
  const [files, setFiles] = useState([]);

  const handleFileSelect = async (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
  };

  const moveUp = (index) => {
    if (index === 0) return;

    const updated = [...files];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setFiles(updated);
  };

  const moveDown = (index) => {
    if (index === files.length - 1) return;

    const updated = [...files];
    [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
    setFiles(updated);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };
const mergePDFs = async () => {
  if (files.length < 2) {
    alert("Select at least 2 PDF files!");
    return;
  }

  const { PDFDocument } = await import("pdf-lib");

  let name = prompt("Enter a name for the merged PDF:");

  if (name === null) {
    return;
  }

  name = name.trim();
  if (name === "") name = "merged";
  name = name.replace(/[^a-zA-Z0-9-_ ]/g, "");

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((p) => mergedPdf.addPage(p));
  }

  const mergedBytes = await mergedPdf.save();
  const blob = new Blob([mergedBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.pdf`;
  a.click();

  URL.revokeObjectURL(url);

  setFiles([]);
};

  return (
    <div className="space-y-6">

      <label className="block w-full cursor-pointer">
        <div className="w-full border border-slate-300 bg-white rounded-xl p-4 text-center font-semibold 
                        flex items-center justify-center gap-2 text-slate-700
                        hover:bg-slate-100 active:scale-[0.98] transition shadow">
          <FolderIcon size={20} /> Choose PDF Files
        </div>

        <input
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </label>

      {files.length > 0 && (
        <div className="space-y-3 notranslate">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-100 rounded-lg shadow"
            >
              <div className="flex items-center gap-3">
                <span className="bg-slate-800 text-white text-xs px-2 py-1 rounded-full">
                  {index + 1}
                </span>
                <p className="text-sm font-medium truncate max-w-[150px] sm:max-w-[200px]">
                  {file.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className={`p-1 rounded hover:bg-slate-200 ${
                    index === 0 ? "opacity-30" : ""
                  }`}
                >
                  <ArrowUp size={17} />
                </button>

                <button
                  onClick={() => moveDown(index)}
                  disabled={index === files.length - 1}
                  className={`p-1 rounded hover:bg-slate-200 ${
                    index === files.length - 1 ? "opacity-30" : ""
                  }`}
                >
                  <ArrowDown size={17} />
                </button>

                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 1 && (
        <button
          onClick={mergePDFs}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold shadow hover:bg-indigo-700 active:scale-[0.98]"
        >
          Merge PDFs
        </button>
      )}
    </div>
  );
}
