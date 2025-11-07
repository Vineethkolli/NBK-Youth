import { useState, useEffect, useRef, useMemo } from "react";
import {
  parsePhoneNumberFromString,
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js";
import * as Flags from "country-flag-icons/react/3x2";
import axios from "axios";
import { ChevronDown } from "lucide-react";

// 🌍 Memoized country list for performance
const COUNTRIES = getCountries().map((iso2) => ({
  iso2,
  name: new Intl.DisplayNames(["en"], { type: "region" }).of(iso2),
  code: `+${getCountryCallingCode(iso2)}`,
}));

export default function SmartAuthInput({ value = "", onChange }) {
  const [mode, setMode] = useState("email"); // 'email' | 'phone'
  const [country, setCountry] = useState({ iso2: "IN", name: "India", code: "+91" });
  const [inputValue, setInputValue] = useState(value);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // 🌍 Detect user country (via ipwho.is with fallback)
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
        throw new Error("Invalid ISO");
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

  // 🧹 Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔍 Auto focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchRef.current) {
      setTimeout(() => searchRef.current.focus(), 50);
    }
  }, [dropdownOpen]);

  // 🧠 Detect mode (lightweight + consistent)
  const detectMode = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return "email";
    if (/[a-zA-Z@]/.test(trimmed)) return "email";
    if (/^\+|^00|\d+$/.test(trimmed)) return "phone";
    return "email";
  };

  // 📞 Handle input changes
  const handleInputChange = (e) => {
    const val = e.target.value;
    const newMode = detectMode(val);
    setInputValue(val);

    // Auto-switch and retain focus
    if (mode !== newMode) setMode(newMode);

    if (newMode === "email") {
      onChange(val);
      return;
    }

    const clean = val.replace(/^00/, "+").trim();
    let parsed;

    // +countryCode → no dropdown
    if (clean.startsWith("+")) {
      parsed = parsePhoneNumberFromString(clean);
      if (parsed && parsed.isValid()) {
        onChange(parsed.number);
      } else {
        onChange(clean);
      }
      return;
    }

    // Digits only → combine with country
    if (/^\d+$/.test(clean)) {
      const full = `${country.code}${clean}`;
      parsed = parsePhoneNumberFromString(full);
      if (parsed && parsed.isValid()) {
        onChange(parsed.number);
      } else {
        onChange(clean);
      }
      return;
    }

    onChange(clean);
  };

  const handleBlur = () => {
    if (!inputValue.trim()) setMode("email");
  };

  // 🧲 Keep focus when mode changes
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [mode]);
return (
  <div className="relative w-full">
    {/* 📧 Email Mode */}
    {mode === "email" ? (
      <input
        ref={inputRef}
        type="text"
        placeholder="Email or Phone Number"
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
                   focus:outline-none focus:ring-green-500 focus:border-green-500 text-base"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
      />
    ) : (
      // 📞 Phone Mode
      <div
        className={`mt-1 flex items-center w-full border border-gray-300 rounded-md shadow-sm 
                    focus-within:ring-green-500 focus-within:border-green-500 
                    bg-white overflow-hidden`}
      >
        {/* 🌐 Flag + Code (only if not starting with '+') */}
        {!inputValue.startsWith("+") && (
          <div
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer border-r border-gray-200 select-none"
            onClick={() => setDropdownOpen((prev) => !prev)}
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
        )}

        <input
          ref={inputRef}
          type="tel"
          placeholder="Phone Number"
          className="flex-1 py-2 px-3 outline-none text-base bg-transparent"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          inputMode="tel"
        />
      </div>
    )}

    {/* 🌍 Dropdown */}
    {mode === "phone" && dropdownOpen && !inputValue.startsWith("+") && (
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