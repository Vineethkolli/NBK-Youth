import { useEffect, useState } from "react";
import { Clock, X, Trash2 } from "lucide-react";

export default function Calculator() {
  const [input, setInput] = useState("0");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  // Blink the green cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem("calc-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (exp, res) => {
    const item = { exp, res, time: new Date().toLocaleString() };
    const newHistory = [item, ...history].slice(0, 100);
    setHistory(newHistory);
    localStorage.setItem("calc-history", JSON.stringify(newHistory));
  };

  const clearAll = () => setInput("0");

  const deleteLast = () => {
    if (input === "Error") return setInput("0");
    if (input.length <= 1) return setInput("0");
    setInput((s) => s.slice(0, -1));
  };

  const toggleSign = () => {
    if (input === "0") return;
    if (input.startsWith("-")) setInput(input.slice(1));
    else setInput("-" + input);
  };

  const calculate = () => {
    try {
      const expr = input
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/(\d+)%/g, "($1*0.01)");

      // eslint-disable-next-line no-eval
      const res = eval(expr).toString();
      saveHistory(input, res);
      setInput(res);
    } catch {
      setInput("Error");
    }
  };

  const handleInput = (val) => {
    if (input === "0" && !["+", "-", "×", "÷", ".", "%"].includes(val)) {
      setInput(val);
      return;
    }

    if (/[+\-×÷%]$/.test(input) && /[+\-×÷%]/.test(val)) return;

    if (val === ".") {
      const parts = input.split(/[+\-×÷%]/);
      if (parts[parts.length - 1].includes(".")) return;
    }

    setInput((s) => s + val);
  };

  const handleParen = () => {
    const open = (input.match(/\(/g) || []).length;
    const close = (input.match(/\)/g) || []).length;
    if (open === close) setInput((s) => s + "(");
    else setInput((s) => s + ")");
  };

  const buttons = [
    { label: "C", type: "top" },
    { label: "()", type: "top" },
    { label: "%", type: "top" },
    { label: "÷", type: "op" },

    { label: "7", type: "num" },
    { label: "8", type: "num" },
    { label: "9", type: "num" },
    { label: "×", type: "op" },

    { label: "4", type: "num" },
    { label: "5", type: "num" },
    { label: "6", type: "num" },
    { label: "-", type: "op" },

    { label: "1", type: "num" },
    { label: "2", type: "num" },
    { label: "3", type: "num" },
    { label: "+", type: "op" },

    { label: "+/-", type: "num" },
    { label: "0", type: "num" },
    { label: ".", type: "num" },
    { label: "=", type: "equal" },
  ];

  const handlePress = (lbl) => {
    if (lbl === "C") return clearAll();
    if (lbl === "=") return calculate();
    if (lbl === "+/-") return toggleSign();
    if (lbl === "()") return handleParen();
    handleInput(lbl);
  };

  return (
    <div className="px-4 pb-10 select-none max-w-md mx-auto">

      {/* Display */}
      <div className="h-30 flex items-end justify-end text-[54px] font-light text-gray-700 pr-2">
        <span className="flex items-end gap-1">
          {input}
          {/* Blinking cursor */}
          <span
            className={`w-0.5 h-18 bg-green-500 ${
              cursorVisible ? "opacity-100" : "opacity-0"
            }`}
          />
        </span>
      </div>

      {/* Icons Row */}
      <div className="flex justify-between items-center mt-2 px-2">

        {/* History Button */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-10 h-10 flex justify-center items-center rounded-full bg-gray-200 text-gray-600"
        >
          <Clock size={22} strokeWidth={1.5} />
        </button>

        {/* Backspace Button */}
        <button
          onClick={deleteLast}
          className="w-10 h-10 flex justify-center items-center rounded-full border-2 border-green-500 text-green-600"
        >
          <X size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* History Drawer */}
      {showHistory && (
        <div className="bg-white rounded-lg shadow p-3 mt-3 max-h-48 overflow-y-auto border">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">History</div>

            {/* Delete All */}
            <button
              onClick={() => {
                setHistory([]);
                localStorage.removeItem("calc-history");
              }}
              className="text-red-500"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {history.length === 0 ? (
            <div className="text-gray-400 text-sm">No history</div>
          ) : (
            history.map((h, i) => (
              <div
                key={i}
                onClick={() => setInput(h.res)}
                className="py-2 border-b cursor-pointer"
              >
                <div className="text-gray-500 text-sm">{h.exp}</div>
                <div className="font-semibold text-lg">{h.res}</div>
                <div className="text-gray-400 text-xs">{h.time}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-3 mt-6">
        {buttons.map((b, i) => {
          let base =
            "h-16 rounded-full flex items-center justify-center text-2xl active:scale-95 transition";

          if (b.type === "top") base += " bg-gray-200 text-gray-700";
          else if (b.type === "op") base += " bg-gray-700 text-white";
          else if (b.type === "equal") base += " bg-green-600 text-white";
          else base += " bg-white text-gray-800";

          return (
            <button key={i} onClick={() => handlePress(b.label)} className={base}>
              {b.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
