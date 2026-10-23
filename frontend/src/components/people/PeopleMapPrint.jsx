import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { LoaderCircle, Printer, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

function PeopleMapPrint({ people, onSearchChange, mapElementRef }) {
  const [query, setQuery] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const filteredPeople = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return people;
    return people.filter((person) =>
      [person.name, person.street].some((value) => value?.toLowerCase().includes(normalizedQuery))
    );
  }, [people, query]);

  const handleSearch = (event) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    onSearchChange(nextQuery);
  };

  const captureMap = async (ignoreTiles = false) => html2canvas(mapElementRef.current, {
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    scale: 2,
    imageTimeout: 20000,
    onclone: (clonedDocument) => {
      const clonedMap = clonedDocument.querySelector('.leaflet-container');
      if (!clonedMap) return;

      clonedMap.style.backgroundColor = '#ffffff';
      clonedMap.querySelectorAll('svg').forEach((element) => element.remove());
      clonedMap.querySelectorAll('*').forEach((element) => {
        const computedStyle = clonedDocument.defaultView.getComputedStyle(element);
        if (computedStyle.color.includes('oklch')) element.style.setProperty('color', '#111827', 'important');
        if (computedStyle.backgroundColor.includes('oklch')) element.style.setProperty('background-color', 'transparent', 'important');
        if (computedStyle.borderColor.includes('oklch')) element.style.setProperty('border-color', 'transparent', 'important');
        if (computedStyle.boxShadow.includes('oklch')) element.style.setProperty('box-shadow', 'none', 'important');
      });
    },
    ignoreElements: (element) =>
      element.classList?.contains('leaflet-control-container') ||
      (ignoreTiles && element.classList?.contains('leaflet-tile'))
  });

  const handlePrint = async () => {
    if (!mapElementRef.current) {
      toast.error('Map is not ready to export');
      return;
    }

    setIsPrinting(true);
    try {
      let mapCanvas;
      try {
        mapCanvas = await captureMap();
      } catch {
        mapCanvas = await captureMap(true);
      }
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imageHeight = Math.min((mapCanvas.height * (pageWidth - 20)) / mapCanvas.width, 125);
      doc.setFontSize(16);
      doc.text('People Map - Visible Locations', pageWidth / 2, 12, { align: 'center' });
      doc.addImage(mapCanvas.toDataURL('image/jpeg', 0.9), 'JPEG', 10, 18, pageWidth - 20, imageHeight);
      autoTable(doc, {
        head: [['S.No', 'PID', 'Name', 'Category', 'Street', 'Location']],
        body: filteredPeople.map((person, index) => [
          index + 1, person.pid, person.name, person.category, person.street,
          person.location ? `${person.location.lat}, ${person.location.lng}` : '-'
        ]),
        startY: 25 + imageHeight,
        margin: { left: 10, right: 10 }
      });
      doc.save('People-Map.pdf');
    } catch (error) {
      console.error('People map PDF export failed', error);
      toast.error('Unable to save the map as PDF. Please wait for the map tiles to load and try again.');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={handleSearch}
          placeholder="Search name or street"
          aria-label="Search people by name or street"
          className="w-44 rounded-md border py-1 pl-8 pr-2 text-sm"
        />
      </div>
      <button onClick={handlePrint} disabled={isPrinting} className="btn-secondary flex items-center disabled:opacity-60">
        {isPrinting ? <LoaderCircle className="mr-1 h-4 w-4 animate-spin" /> : <Printer className="mr-1 h-4 w-4" />}
        {isPrinting ? 'Saving...' : 'Print'}
      </button>
    </div>
  );
}

export default PeopleMapPrint;
