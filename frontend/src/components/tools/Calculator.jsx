import { useEffect, useRef, useState, useLayoutEffect  } from "react";
import { Clock, X, Trash2, CalculatorIcon } from "lucide-react";

export default function Calculator() {
  const [input, setInput] = useState("0");
  const [cursorPos, setCursorPos] = useState(0);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const exprRef = useRef(null);
  const displayRef = useRef(null);
  const charRefs = useRef([]);

  const [cursorVisible, setCursorVisible] = useState(true);
  const [cursorCoords, setCursorCoords] = useState({ left: 0, top: 0, height: 36 });

const firstRender = useRef(true);
useLayoutEffect(() => {
  if (firstRender.current) {
    firstRender.current = false;
    setCursorPos(input.length);
  }
}, [input]);


  useLayoutEffect(() => {
  requestAnimationFrame(() => {
    updateCursorOverlay();
    ensureCursorVisible();
  });
}, [input, cursorPos]);

  const saveHistory = (exp, res) => {
  const item = { exp, res, time: Date.now() };

  const THREE_MONTHS = 90 * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - THREE_MONTHS;

  const filtered = history.filter(h => h.time >= cutoff);

  const newHistory = [item, ...filtered].slice(0, 100);
  setHistory(newHistory);
  localStorage.setItem("calc-history", JSON.stringify(newHistory));
};

useEffect(() => {
  const saved = localStorage.getItem("calc-history");
  if (saved) {
    const items = JSON.parse(saved);

    const THREE_MONTHS = 90 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - THREE_MONTHS;

    const filtered = items.filter(h => h.time >= cutoff);

    setHistory(filtered);
    localStorage.setItem("calc-history", JSON.stringify(filtered));
  }

  const id = setInterval(() => setCursorVisible((s) => !s), 600);
  return () => clearInterval(id);
}, []);

const formatDate = (ts) => {
  const d = new Date(ts);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

  const insertAtCursor = (text) => {
  const operators = ["+", "-", "×", "÷"];

  if (operators.includes(text)) {
    const prev = input[cursorPos - 1];

    if (operators.includes(prev)) {
      const left = input.slice(0, cursorPos - 1);
      const right = input.slice(cursorPos);
      const newVal = left + text + right;
      setInput(newVal);
      setCursorPos(cursorPos);
      return;
    }
  }

  const isNumberOrDot = /^[0-9.]$/.test(text);
  if (input === "0" && isNumberOrDot) {
    setInput(text);
    setCursorPos(text.length);
    return;
  }

  const left = input.slice(0, cursorPos);
  const right = input.slice(cursorPos);
  const newVal = left + text + right;
  setInput(newVal);
  setCursorPos(cursorPos + text.length);
};

  const deleteLeft = () => {
    if (input === "Error") {
      setInput("0");
      setCursorPos(1);
      return;
    }
    if (cursorPos <= 0) return;
    const left = input.slice(0, cursorPos - 1);
    const right = input.slice(cursorPos);
    const newVal = left + right;
    setInput(newVal === "" ? "0" : newVal);
    setCursorPos(Math.max(0, cursorPos - 1));
  };

  function safeEval(expr) {
    if (!/^[0-9+\-*/().\s]*$/.test(expr)) throw new Error();

    const tokens = expr.match(/[()+\-*/]|\d*\.?\d+/g);
    if (!tokens) throw new Error();

    const toRPN = (tokens) => {
      const out = [];
      const stack = [];
      const prec = { "+": 1, "-": 1, "*": 2, "/": 2 };
      for (let t of tokens) {
        if (!isNaN(t)) out.push(t);
        else if ("+-*/".includes(t)) {
          while (
            stack.length &&
            "+-*/".includes(stack.at(-1)) &&
            prec[stack.at(-1)] >= prec[t]
          )
            out.push(stack.pop());
          stack.push(t);
        } else if (t === "(") stack.push(t);
        else if (t === ")") {
          while (stack.length && stack.at(-1) !== "(") out.push(stack.pop());
          stack.pop();
        }
      }
      while (stack.length) out.push(stack.pop());
      return out;
    };

    const evalRPN = (rpn) => {
      const stack = [];
      for (let t of rpn) {
        if (!isNaN(t)) stack.push(parseFloat(t));
        else {
          const b = stack.pop();
          const a = stack.pop();
          if (t === "+") stack.push(a + b);
          else if (t === "-") stack.push(a - b);
          else if (t === "*") stack.push(a * b);
          else if (t === "/") stack.push(a / b);
        }
      }
      return stack[0];
    };

    return evalRPN(toRPN(tokens));
  }

  let liveResult = "";
  const isExpressionComplete = () => {
    if (input.trim() === "") return false;
    if (/[0-9)]$/.test(input)) return true;
    if (/%$/.test(input)) return true;
    return false;
  };
  try {
    if (isExpressionComplete()) {
      const expr = input.replace(/×/g, "*").replace(/÷/g, "/").replace(/(\d+)%/g, "($1 * 0.01)");
      const v = safeEval(expr);
      if (typeof v !== "undefined" && !Number.isNaN(v)) liveResult = v.toString();
    }
  } catch {
    liveResult = "";
  }

  const calculate = () => {
  try {
    const trimmed = input.trim();

    if (trimmed === "" || trimmed === "0") return;

    const hasOperator = /[+\-×÷%]/.test(trimmed);
    if (!hasOperator) {
      return;
    }

    const expr = trimmed
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/(\d+)%/g, "($1 * 0.01)");

    const res = safeEval(expr).toString();

    const last = history[0];
    if (!(last && last.exp === trimmed && last.res === res)) {
      saveHistory(trimmed, res);
    }

    setInput(res);
    setCursorPos(res.length);
  } catch {
    setInput("Error");
    setCursorPos(5);
  }
};

  useEffect(() => {
    const handleKey = (e) => {
      const key = e.key;

      if (key === "Backspace") {
        e.preventDefault();
        return deleteLeft();
      }
      if (key === "Enter" || key === "=") {
        e.preventDefault();
        return calculate();
      }

      if (/^[0-9+\-*/().%]$/.test(key)) {
        e.preventDefault();
        if (key === "*") return insertAtCursor("×");
        if (key === "/") return insertAtCursor("÷");
        return insertAtCursor(key);
      }

      if (key === "ArrowLeft") {
        e.preventDefault();
        setCursorPos((p) => Math.max(0, p - 1));
      }
      if (key === "ArrowRight") {
        e.preventDefault();
        setCursorPos((p) => Math.min(input.length, p + 1));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [input]);

  const updateCursorOverlay = () => {
  const exprEl = exprRef.current;
  if (!exprEl) return;

  const el = cursorPos > 0 ? charRefs.current[cursorPos - 1] : null;

  let left = 6;
  let top = 4;
  let height = 36;

  if (el) {
    left = el.offsetLeft + el.offsetWidth;
    top = el.offsetTop;
    height = el.offsetHeight;
  } else {
    const first = charRefs.current[0];
    if (first) {
      top = first.offsetTop;
      height = first.offsetHeight;
    }
    left = 6;
  }

  setCursorCoords({ left, top, height });
};

  const getLineHeight = (el) => {
    const cs = window.getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight);
    if (!Number.isNaN(lh)) return lh;
    return parseFloat(cs.fontSize) * 1.1;
  };

  const ensureCursorVisible = () => {
  const expr = exprRef.current;
  if (!expr) return;

  const cursorX = cursorCoords.left;
  const viewLeft = expr.scrollLeft;
  const viewRight = expr.scrollLeft + expr.clientWidth;
  const margin = 30;

  if (cursorX < viewLeft + margin) {
    expr.scrollLeft = Math.max(0, cursorX - margin);
  }

  else if (cursorX > viewRight - margin) {
    expr.scrollLeft = cursorX - expr.clientWidth + margin;
  }
};

  const draggingRef = useRef(false);

 const computePosFromPointer = (clientX, clientY) => {
  const exprEl = exprRef.current;
  if (!exprEl) return 0;

  const rect = exprEl.getBoundingClientRect();
  const x = clientX - rect.left + exprEl.scrollLeft;
  const y = clientY - rect.top + exprEl.scrollTop;

  let closestIndex = input.length;
  let bestDist = Infinity;

  for (let i = 0; i < input.length; i++) {
    const el = charRefs.current[i];
    if (!el) continue;

    const cx = el.offsetLeft + el.offsetWidth / 2;
    const cy = el.offsetTop + el.offsetHeight / 2;

    const dx = cx - x;
    const dy = cy - y;
    const dist = dx * dx + dy * dy;

    if (dist < bestDist) {
      bestDist = dist;
      closestIndex = i;
    }
  }

  const el = charRefs.current[closestIndex];
  if (el && x > el.offsetLeft + el.offsetWidth / 2) {
    return closestIndex + 1;
  }

  return closestIndex;
};

  const onPointerDown = (e) => {
  draggingRef.current = true;
  e.currentTarget.setPointerCapture(e.pointerId);
  const pos = computePosFromPointer(e.clientX, e.clientY);
  setCursorPos(pos);
};

const onPointerMove = (e) => {
  if (!draggingRef.current) return;
  const pos = computePosFromPointer(e.clientX, e.clientY);
  setCursorPos(pos);
};

  const onPointerUp = (e) => {
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handlePress = (lbl) => {
    if (lbl === "C") {
      setInput("0");
      setCursorPos(1);
      return;
    }
    if (lbl === "=") {
      calculate();
      return;
    }
    if (lbl === "()") {
      const open = (input.match(/\(/g) || []).length;
      const close = (input.match(/\)/g) || []).length;
      insertAtCursor(open === close ? "(" : ")");
      return;
    }
    if (lbl === "+/-") {
      let i = cursorPos;
      while (i > 0 && /[0-9.]/.test(input[i - 1])) i--;
      if (i === 0) {
        if (input.startsWith("-")) {
          setInput(input.slice(1));
          setCursorPos(Math.max(0, cursorPos - 1));
        } else {
          setInput("-" + input);
          setCursorPos(cursorPos + 1);
        }
      } else {
        const left = input.slice(0, i);
        const right = input.slice(i);
        setInput(left + "-" + right);
        setCursorPos(cursorPos + 1);
      }
      return;
    }
    insertAtCursor(lbl);
  };

  charRefs.current = Array.from({ length: input.length }).map(
    (v, i) => charRefs.current[i] || null
  );
  const historyRef = useRef(null);

useEffect(() => {
  if (showHistory && historyRef.current) {
    historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }
}, [showHistory, history]);


  return (
    <div className="select-none max-w-md mx-auto notranslate">
      <div
        ref={displayRef}
        className="w-full bg-white rounded-xl relative overflow-hidden"
        style={{
          height: 180,
          padding: 8,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          ref={exprRef}
          className="flex-1 overflow-y-auto"
          style={{
            textAlign: "right",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            direction: "ltr",
            fontSize: 40,
            fontWeight: 300,
            lineHeight: "1",
            paddingRight: 8,
            position: "relative",
            cursor: "text",
            userSelect: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div style={{ display: "inline-block" }}>
            {input.split("").map((ch, i) => (
              <span
                key={i}
                ref={(el) => (charRefs.current[i] = el)}
                onClick={() => setCursorPos(i + 1)}
                className="cursor-text"
                style={{ display: "inline-block" }}
              >
                {ch}
              </span>
            ))}
          </div>

          <div
            aria-hidden
            style={{
              position: "absolute",
              top: cursorCoords.top,
              left: cursorCoords.left,
              height: cursorCoords.height,
              width: 2,
              background: cursorVisible ? "#10B981" : "transparent",
              transition: "left 0.03s linear",
              pointerEvents: "none",
            }}
          />
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: "#111827",
            textAlign: "right",
            minHeight: 30,
            marginTop: 8,
          }}
        >
          {liveResult}
        </div>
      </div>

      <div className="flex justify-between items-center mt-2 px-4">
        <button
  onClick={() => setShowHistory(!showHistory)}
  className="w-8 h-8 flex justify-center items-center rounded-full bg-gray-200 text-gray-600"
>
  {showHistory ? (
    <CalculatorIcon size={24} strokeWidth={1.5} />
  ) : (
    <Clock size={24} strokeWidth={1.5} />
  )}
</button>
        <button
          onClick={deleteLeft}
          className="w-10 h-8 flex justify-center items-center rounded-full border-2 border-green-500 text-green-600"
        >
          <X size={24} strokeWidth={2.5} />
        </button>
      </div>

      {showHistory && (
  <div
    ref={historyRef}
    className="mt-4 p-4 rounded-xl space-y-4 h-80 overflow-y-auto scrollbar-thin"
  >
    {history.length === 0 ? (
      <div className="text-center py-4 text-lg">No history</div>
    ) : (
      [...history].reverse().map((h, i) => (
        <div
          key={i}
          onClick={() => {
            setInput(h.exp);
            setCursorPos(h.exp.length);
            setShowHistory(false);
          }}
          className="py-3 border-b border-gray-700 cursor-pointer"
        >
          <div className="text-lg">{h.exp}</div>
          <div className="text-xl font-bold">= {h.res}</div>
          <div className="text-gray-500 text-xs">{formatDate(h.time)}</div>
        </div>
      ))
    )}

    <button
      onClick={() => {
        setHistory([]);
        localStorage.removeItem("calc-history");
      }}
      className="bg-gray-800 py-2 px-4 rounded-full text-white text-center text-lg"
    >
      Clear history
    </button>
  </div>
)}

      {!showHistory && (
  <div className="grid grid-cols-4 gap-3 mt-4">
    {[
      "C",
      "()",
      "%",
      "÷",
      "7",
      "8",
      "9",
      "×",
      "4",
      "5",
      "6",
      "-",
      "1",
      "2",
      "3",
      "+",
      "+/-",
      "0",
      ".",
      "=",
    ].map((lbl, i) => {
      let style =
        "h-15 rounded-full flex items-center justify-center text-2xl active:scale-95 transition";

      if (["C", "()", "%"].includes(lbl))
        style += " bg-gray-200 text-gray-700";
      else if (["÷", "×", "-", "+"].includes(lbl))
        style += " bg-gray-700 text-white";
      else if (lbl === "=") style += " bg-green-600 text-white";
      else style += " bg-white text-gray-800";

      return (
        <button
          key={i}
          className={style}
          onClick={() => handlePress(lbl)}
        >
          {lbl}
        </button>
      );
    })}
  </div>
)}

    </div>
  );
}
