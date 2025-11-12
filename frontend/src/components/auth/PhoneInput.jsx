import { useState, useEffect, useRef } from "react";
import { parsePhoneNumberFromString, getCountries, getCountryCallingCode } from "libphonenumber-js";
import * as Flags from "country-flag-icons/react/3x2";
import axios from "axios";
import { ChevronDown } from "lucide-react";

const COUNTRIES = getCountries().map((iso2) => ({
  iso2,
  name: new Intl.DisplayNames(["en"], { type: "region" }).of(iso2),
  code: `+${getCountryCallingCode(iso2)}`,
}));

export default function CustomPhoneInput({ value, onChange }) {
  const [country, setCountry] = useState({
    iso2: "IN",
    name: "India",
    code: "+91",
  });
  const [inputValue, setInputValue] = useState(value || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Detect user country from IP
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await axios.get("https://ipwho.is/");
        const iso = res.data?.country_code;
        if (iso) {
          const found = COUNTRIES.find((c) => c.iso2 === iso);
          if (found) setCountry(found);
          return;
        }
        throw new Error("Invalid ISO from ipwho.is");
      } catch {
        try {
          const res2 = await axios.get("https://get.geojs.io/v1/ip/country.json");
          const iso2 = res2.data?.country;
          const found = COUNTRIES.find((c) => c.iso2 === iso2);
          if (found) setCountry(found);
        } catch {
          console.warn("Country detection failed, defaulting to India.");
        }
      }
    };
    detectCountry();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (dropdownOpen && searchRef.current) {
      setTimeout(() => searchRef.current.focus(), 50);
    }
  }, [dropdownOpen]);

  // Handle all possible phone number inputs
  const handleInputChange = (e) => {
    const val = e.target.value.trim();
    setInputValue(val);

    // Detect if the user is typing a country code and jump instantly
    const matchCountryByCode = (input) => {
      let normalized = input.startsWith("00") ? input.replace(/^00/, "+") : input;
      if (!normalized.startsWith("+")) return null;

      for (const c of COUNTRIES) {
        if (normalized.startsWith(c.code)) return c;
      }
      return null;
    };

    const codeMatch = matchCountryByCode(val);
    if (codeMatch && codeMatch.iso2 !== country.iso2) {
      setCountry(codeMatch);
    }

    let parsed;

    // If user typed full code
    if (val.startsWith("+") || val.startsWith("00")) {
      parsed = parsePhoneNumberFromString(val.replace(/^00/, "+"));
      if (parsed && parsed.isValid()) {
        const iso = parsed.country;
        const found = COUNTRIES.find((c) => c.iso2 === iso);
        if (found) setCountry(found);
        onChange(parsed.number);
        return;
      }
    }

    // Only digits with possible code
    if (/^\d{6,15}$/.test(val)) {
      const plusPrefixed = `+${val}`;
      parsed = parsePhoneNumberFromString(plusPrefixed);
      if (parsed && parsed.isValid()) {
        const iso = parsed.country;
        const found = COUNTRIES.find((c) => c.iso2 === iso);
        if (found) setCountry(found);
        onChange(parsed.number);
        return;
      }
    }

    // Fallback — combine selected code
    const raw = `${country.code}${val.replace(/\D/g, "")}`;
    parsed = parsePhoneNumberFromString(raw);
    if (parsed && parsed.isValid()) {
      onChange(parsed.number);
    } else {
      onChange(raw);
    }
  };

  useEffect(() => {
  if (inputValue && !inputValue.startsWith("+") && !inputValue.startsWith("00")) {
    const raw = `${country.code}${inputValue.replace(/\D/g, "")}`;
    const parsed = parsePhoneNumberFromString(raw);

    if (parsed && parsed.isValid()) {
      onChange(parsed.number);
    } else {
      onChange(raw);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [country]);


  return (
    <div className="relative w-full">
      <div className="flex items-center border border-gray-300 rounded-md shadow-sm bg-white focus-within:ring-1 focus-within:ring-green-500 overflow-hidden">
 
        <div
          className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer border-r border-gray-200 select-none"
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
            setSearch("");
          }}
        >
          {Flags[country.iso2] &&
            (() => {
              const Flag = Flags[country.iso2];
              return <Flag className="w-6 h-4 rounded-sm" />;
            })()}
          <span className="font-medium text-gray-800 notranslate">{country.code}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              dropdownOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>

        <input
          type="tel"
          className="flex-1 p-2 outline-none text-base bg-transparent"
          placeholder="Phone Number"
          value={inputValue}
          onChange={handleInputChange}
          inputMode="tel"
        />
      </div>

      {dropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 max-h-80 overflow-y-auto bg-white border rounded-lg shadow-lg w-full z-50"
        >
          <input
            ref={searchRef}
            type="text"
            placeholder="Search country"
            className="w-full p-2 border-b outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto">
            {COUNTRIES.filter(
              (c) =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.code.includes(search)
            ).map((c) => {
              const Flag = Flags[c.iso2];
              return (
                <div
                  key={c.iso2}
                  onClick={() => {
                    setCountry(c);
                    setDropdownOpen(false);
                  }}
                  className="p-2 flex items-center gap-2 hover:bg-green-50 cursor-pointer transition-colors"
                >
                  {Flag && <Flag className="w-6 h-4 rounded-sm" />}
                  <span className="text-gray-700 ">{c.name}</span>
                  <span className="ml-auto text-gray-500 notranslate">{c.code}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
