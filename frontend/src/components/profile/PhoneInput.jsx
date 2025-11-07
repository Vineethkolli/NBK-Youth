import { useState, useEffect, useRef } from "react";
import {
  parsePhoneNumberFromString,
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js";
import * as Flags from "country-flag-icons/react/3x2";
import { ChevronDown } from "lucide-react";

const COUNTRIES = getCountries().map((iso2) => ({
  iso2,
  name: new Intl.DisplayNames(["en"], { type: "region" }).of(iso2),
  code: `+${getCountryCallingCode(iso2)}`,
}));

export default function ProfilePhoneInput({ value, onChange }) {
  const [country, setCountry] = useState({ iso2: "IN", name: "India", code: "+91" });
  const [nationalNumber, setNationalNumber] = useState(""); // 👈 only national number (no +91)
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // 🧠 On load → detect country and extract national number
  useEffect(() => {
    if (value) {
      const parsed = parsePhoneNumberFromString(value);
      if (parsed && parsed.isValid()) {
        const found = COUNTRIES.find((c) => c.iso2 === parsed.country);
        if (found) setCountry(found);
        setNationalNumber(parsed.nationalNumber || "");
      } else {
        // Handle unparseable values - extract digits after country code
        const cleanValue = value.replace(/^\+/, "");
        const currentCode = country.code.replace(/^\+/, "");
        if (cleanValue.startsWith(currentCode)) {
          setNationalNumber(cleanValue.slice(currentCode.length));
        } else {
          setNationalNumber(cleanValue);
        }
      }
    } else {
      setNationalNumber("");
    }
  }, [value, country.code]);

  // 🧹 Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔍 Focus search when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchRef.current) {
      setTimeout(() => searchRef.current.focus(), 50);
    }
  }, [dropdownOpen]);

  // 📞 Handle typing (no + code shown)
  const handleInputChange = (e) => {
    const digits = e.target.value.replace(/\D/g, ""); // only numbers
    setNationalNumber(digits);

    // Build the full number with country code
    const fullNumber = digits ? `${country.code}${digits}` : "";
    
    // Only validate and format if there are digits
    if (digits) {
      const parsed = parsePhoneNumberFromString(fullNumber);
      if (parsed && parsed.isValid()) {
        onChange(parsed.number); // send E.164 like +14155552671
      } else {
        onChange(fullNumber);
      }
    } else {
      onChange(""); // Clear the value when input is empty
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center border border-gray-300 rounded-md shadow-sm bg-white focus-within:ring-1 focus-within:ring-indigo-500 overflow-hidden">
        {/* 🌐 Flag + Country Code (prefix only) */}
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
          <span className="font-medium text-gray-800">{country.code}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              dropdownOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>

        {/* 📞 Input field (no country code) */}
        <input
          type="tel"
          className="flex-1 p-2 outline-none text-base bg-transparent"
          placeholder="Enter phone number"
          value={nationalNumber}
          onChange={handleInputChange}
          inputMode="tel"
        />
      </div>

      {/* 🌍 Country Dropdown */}
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

                    const fullNumber = `${c.code}${nationalNumber}`;
                    const parsed = parsePhoneNumberFromString(fullNumber);
                    if (parsed && parsed.isValid()) {
                      onChange(parsed.number);
                    } else {
                      onChange(fullNumber);
                    }
                  }}
                  className="p-2 flex items-center gap-2 hover:bg-indigo-50 cursor-pointer transition-colors"
                >
                  {Flag && <Flag className="w-6 h-4 rounded-sm" />}
                  <span className="text-gray-700">{c.name}</span>
                  <span className="ml-auto text-gray-500">{c.code}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
