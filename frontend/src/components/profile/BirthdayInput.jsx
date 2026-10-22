  import { useEffect, useMemo, useRef, useState } from 'react';
  import { CalendarDays, Check } from 'lucide-react';

  const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const currentYear = new Date().getFullYear();
  const FIRST_BIRTHDAY_YEAR = 1947;
  const YEARS = Array.from(
    { length: currentYear + 1 - FIRST_BIRTHDAY_YEAR + 1 },
    (_, index) => FIRST_BIRTHDAY_YEAR + index,
  );
  const getToday = () => {
    const today = new Date();
    return {
      day: today.getDate(),
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    };
  };

  export const parseBirthday = (value) => {
    const match = /^(\d{1,2})-(\d{1,2})(?:-(\d{4}))?$/.exec((value || '').trim());
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = match[3] ? Number(match[3]) : null;
    const testDate = new Date(year || 2000, month - 1, day);

    if (
      month < 1 || month > 12 || day < 1 || day > 31 ||
      testDate.getMonth() !== month - 1 || testDate.getDate() !== day ||
      (year !== null && (year < 1900 || year > currentYear))
    ) {
      return null;
    }

    return { day, month, year };
  };

  export const formatBirthday = (value) => {
    const birthday = parseBirthday(value);
    if (!birthday) return 'Not provided';
    return `${birthday.day} ${MONTHS[birthday.month - 1]}${birthday.year ? ` ${birthday.year}` : ''}`;
  };

  const serializeBirthday = ({ day, month, year }) =>
    `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}${year ? `-${year}` : ''}`;

  function ScrollColumn({ label, values, value, onChange, formatValue }) {
    const selectedRef = useRef(null);

    useEffect(() => {
      selectedRef.current?.scrollIntoView({ block: 'center' });
    }, [value]);

    return (
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 text-center mb-1">{label}</div>
        <div className="h-36 overflow-y-auto rounded-md bg-gray-50 snap-y snap-mandatory">
          {values.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => onChange(item)}
              ref={item === value ? selectedRef : undefined}
              className={`w-full h-12 snap-center text-lg transition ${
                item === value ? 'font-bold text-black' : 'text-gray-400'
              }`}
            >
              {formatValue ? formatValue(item) : item}
            </button>
          ))}
        </div>
      </div>
    );
  }

  export default function BirthdayInput({ value, onChange, id = 'birthday' }) {
    const parsed = parseBirthday(value);
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState(parsed || getToday);
    const [includeYear, setIncludeYear] = useState(Boolean(parsed?.year));

    useEffect(() => {
      const next = parseBirthday(value);
      if (next) {
        setDraft(next);
        setIncludeYear(Boolean(next.year));
      } else if (!value) {
        setDraft(getToday());
        setIncludeYear(false);
      }
    }, [value]);

    const days = useMemo(
      () => Array.from({ length: new Date(draft.year || 2000, draft.month, 0).getDate() }, (_, index) => index + 1),
      [draft.month, draft.year],
    );

    const updateDraft = (changes) => setDraft((previous) => ({ ...previous, ...changes }));

    const applyDraft = () => {
      const next = { ...draft, year: includeYear ? draft.year || currentYear : null };
      onChange(serializeBirthday(next));
      setIsOpen(false);
    };

    const handleInput = (event) => onChange(event.target.value.replace(/[^\d-]/g, '').slice(0, 10));

    return (
      <>
        <div className="relative">
          <input
            id={id}
            name="birthday"
            value={value || ''}
            onChange={handleInput}
            placeholder="DD-MM"
            inputMode="numeric"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-20 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            aria-label="Birthday in DD-MM or DD-MM-YYYY format"
          />
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 text-gray-500 hover:text-indigo-600"
            aria-label="Choose birthday"
          >
            <CalendarDays className="h-5 w-5" />
          </button>
        </div>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
              <div className="mb-4 text-center text-xl text-gray-700">
                {formatBirthday(serializeBirthday({ ...draft, year: includeYear ? draft.year : null }))}
              </div>
              <div className="flex gap-3">
                <ScrollColumn
                  label="Day"
                  values={days}
                  value={draft.day}
                  onChange={(day) => updateDraft({ day })}
                />
                <ScrollColumn
                  label="Month"
                  values={MONTHS.map((_, index) => index + 1)}
                  value={draft.month}
                  onChange={(month) => updateDraft({ month, day: Math.min(draft.day, new Date(draft.year || 2000, month, 0).getDate()) })}
                  formatValue={(month) => MONTHS[month - 1]}
                />
                {includeYear && (
                  <ScrollColumn
                    label="Year"
                    values={YEARS}
                    value={draft.year || currentYear}
                    onChange={(year) => updateDraft({ year })}
                  />
                )}
              </div>
              <label className="mt-5 flex items-center gap-3 text-lg">
                <input
                  type="checkbox"
                  checked={includeYear}
                  onChange={(event) => {
                    setIncludeYear(event.target.checked);
                    if (event.target.checked && !draft.year) updateDraft({ year: currentYear });
                  }}
                  className="h-5 w-5 rounded"
                />
                Enter year
                {includeYear}
              </label>
              <div className="mt-5 flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-gray-600">
                  Cancel
                </button>
                <button type="button" onClick={applyDraft} className="px-4 py-2 font-semibold text-indigo-600">
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
