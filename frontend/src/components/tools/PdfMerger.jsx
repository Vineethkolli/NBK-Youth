import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ArrowUp, ArrowDown, Trash2, FolderIcon } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";import { GlobalWorkerOptions } from "pdfjs-dist/build/pdf";
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();


export default function PdfMergerTool() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const renderThumbnail = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 0.3 });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    return canvas.toDataURL(); // returns preview URL
  };

  const handleFileSelect = async (e) => {
    const selected = Array.from(e.target.files);
    const updatedFiles = [...files, ...selected];
    setFiles(updatedFiles);

    for (const file of selected) {
      const thumbnail = await renderThumbnail(file);
      setPreviews((prev) => [...prev, thumbnail]);
    }
  };

  const moveUp = (index) => {
    if (index === 0) return;

    const updatedFiles = [...files];
    const updatedPreviews = [...previews];

    [updatedFiles[index - 1], updatedFiles[index]] = [
      updatedFiles[index],
      updatedFiles[index - 1],
    ];

    [updatedPreviews[index - 1], updatedPreviews[index]] = [
      updatedPreviews[index],
      updatedPreviews[index - 1],
    ];

    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
  };

  const moveDown = (index) => {
    if (index === files.length - 1) return;

    const updatedFiles = [...files];
    const updatedPreviews = [...previews];

    [updatedFiles[index + 1], updatedFiles[index]] = [
      updatedFiles[index],
      updatedFiles[index + 1],
    ];

    [updatedPreviews[index + 1], updatedPreviews[index]] = [
      updatedPreviews[index],
      updatedPreviews[index + 1],
    ];

    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };
const mergePDFs = async () => {
  if (files.length < 2) {
    alert("Select at least 2 PDF files!");
    return;
  }

  // Ask user for a filename
  let name = prompt("Enter a name for the merged PDF:", "merged");

  // If user cancels or enters empty text → use default
  if (!name || name.trim() === "") {
    name = "merged";
  }

  // Remove illegal filename characters
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
};

return (
  <div className="space-y-6">

    {/* File Picker */}
    <label className="block w-full cursor-pointer">
      <div className="w-full border border-slate-300 bg-white rounded-xl p-4 text-center font-semibold 
                      flex items-center justify-center gap-2 text-slate-700
                      hover:bg-slate-100 active:scale-[0.98] transition shadow">
        <FolderIcon size={20} />
        Choose PDF Files
      </div>

      <input
        type="file"
        accept="application/pdf"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </label>

    {/* Thumbnails Grid */}
    {files.length > 0 && (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-5">
        {files.map((file, index) => (
          <div key={index} className="relative flex flex-col items-center">

            {/* Number Badge */}
            <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full z-10">
              {index + 1}
            </span>

            {/* Remove Button */}
            <button
              onClick={() => removeFile(index)}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 shadow z-10"
            >
              <Trash2 size={14} />
            </button>

            {/* Full-Page Thumbnail */}
            <div className="w-full bg-white rounded-lg border shadow overflow-hidden">
              <img
                src={previews[index]}
                alt="PDF preview"
                className="w-full aspect-[3/4] object-contain bg-white"
              />
            </div>

            {/* Reorder Buttons */}
            <div className="flex items-center justify-center gap-3 mt-2">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className={`p-1.5 rounded-full border shadow 
                            ${index === 0 ? "opacity-30" : "hover:bg-slate-200"}`}
              >
                <ArrowUp size={16} />
              </button>

              <button
                onClick={() => moveDown(index)}
                disabled={index === files.length - 1}
                className={`p-1.5 rounded-full border shadow 
                            ${index === files.length - 1 ? "opacity-30" : "hover:bg-slate-200"}`}
              >
                <ArrowDown size={16} />
              </button>
            </div>

            {/* Filename */}
            <div className="text-center mt-1 text-xs font-medium truncate px-1 w-full">
              {file.name}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Merge Button */}
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