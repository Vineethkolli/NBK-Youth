import { useState } from "react";
import { Trash2, FolderIcon, Image as ImageIcon } from "lucide-react";

export default function ImageToPdfTool() {
  const [image, setImage] = useState(null);

  const handleFileSelect = async (e) => {
    const selected = e.target.files[0];
    
    if (selected && selected.type.startsWith("image/")) {
      setImage(selected);
    } else {
      alert("Please select a valid image file");
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const convertToPdf = async () => {
    if (!image) {
      alert("Select an image first!");
      return;
    }

    const { jsPDF } = await import("jspdf");

    let name = prompt("Enter a name for the PDF:");

    if (name === null) {
      return;
    }

    name = name.trim();
    if (name === "") name = "document";
    name = name.replace(/[^a-zA-Z0-9-_ ]/g, "");

    // Create PDF (A4 size by default)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 5; // 5mm margin

    const imgData = await getImageData(image);

    // Wait for image to load before accessing dimensions
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = pageWidth - 2 * margin;
        const maxHeight = pageHeight - 2 * margin;
        let imgWidth = maxWidth;
        let imgHeight = (img.height / img.width) * imgWidth;

        // If image is taller than page, scale down
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = (img.width / img.height) * imgHeight;
        }

        // Center image on page
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);
        pdf.save(`${name}.pdf`);
        setImage(null);
        resolve();
      };
      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
      img.src = imgData;
    });
  };

  const getImageData = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-6">
      <label className="block w-full cursor-pointer">
        <div
          className="w-full border border-slate-300 bg-white rounded-xl p-4 text-center font-semibold 
                        flex items-center justify-center gap-2 text-slate-700
                        hover:bg-slate-100 active:scale-[0.98] transition shadow"
        >
          <FolderIcon size={20} /> Choose Image
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </label>

      {image && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-100 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium truncate max-w-[200px]">
                  {image.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(image.size / 1024).toFixed(2)} KB
                </p>
              </div>

              <button
                onClick={removeImage}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>

          <button
            onClick={convertToPdf}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold shadow hover:bg-indigo-700 active:scale-[0.98]"
          >
            <ImageIcon size={18} className="inline mr-2" />
            Convert to PDF
          </button>
        </div>
      )}
    </div>
  );
}
