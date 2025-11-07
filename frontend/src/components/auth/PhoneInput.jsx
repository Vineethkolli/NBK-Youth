import { useState, useEffect, useRef } from "react";
import { AsYouType, parsePhoneNumberFromString, getCountries, getCountryCallingCode } from "libphonenumber-js";
import * as Flags from "country-flag-icons/react/3x2";
import axios from "axios";
import { ChevronDown } from "lucide-react"; // for dropdown icon

const COUNTRIES = getCountries().map((iso2) => ({
  iso2,
  name: new Intl.DisplayNames(["en"], { type: "region" }).of(iso2),
  code: `+${getCountryCallingCode(iso2)}`,
}));

export default function CustomPhoneInput({ value, onChange }) {
  const [country, setCountry] = useState({ iso2: "IN", name: "India", code: "+91" });
  const [phone, setPhone] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Auto-detect user country from IP
  useEffect(() => {
    axios
      .get("https://ipapi.co/json/")
      .then((res) => {
        const iso = res.data?.country_code;
        if (iso) {
          const found = COUNTRIES.find((c) => c.iso2 === iso);
          if (found) setCountry(found);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchRef.current) {
      setTimeout(() => searchRef.current.focus(), 50);
    }
  }, [dropdownOpen]);

  const handleInputChange = (e) => {
    const input = e.target.value;
const formatter = new AsYouType(country.iso2);
const formatted = formatter.input(input);

    setPhone(formatted);
    onChange(parsed ? parsed.number : "");
  };

  return (
    <div className="relative w-full">
      {/* Main input box */}
      <div className="flex items-center border border-gray-300 rounded-md shadow-sm py-2 px-3 focus-within:ring-1 focus-within:ring-green-500 bg-white gap-2">
        {/* Flag + dropdown icon */}
        <div
          className="flex items-center gap-1 cursor-pointer select-none"
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
            setSearch(""); // reset search each time
          }}
        >
          {Flags[country.iso2] ? (() => {
            const Flag = Flags[country.iso2];
            return <Flag className="w-6 h-4 rounded-sm object-cover" />;
          })() : null}
          <span className="font-medium">{country.code}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              dropdownOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>

        {/* Phone number field */}
        <input
          type="tel"
          className="flex-1 outline-none bg-transparent text-base"
          placeholder="Phone Number *"
          value={phone}
          onChange={handleInputChange}
        />
      </div>

      {/* Dropdown menu */}
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
