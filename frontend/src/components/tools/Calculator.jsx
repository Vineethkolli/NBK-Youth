import { useEffect, useRef, useState, useLayoutEffect  } from "react";
import { Clock, X, Trash2 } from "lucide-react";

export default function Calculator() {
  const [input, setInput] = useState("0");
  // logical cursor position: 0..input.length (position between characters)
  const [cursorPos, setCursorPos] = useState(0);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // refs
  const exprRef = useRef(null); // expression area (lines 1 & 2)
  const displayRef = useRef(null); // whole display wrapper
  const charRefs = useRef([]); // array of span nodes for each char

  // cursor overlay state
  const [cursorVisible, setCursorVisible] = useState(true);
  const [cursorCoords, setCursorCoords] = useState({ left: 0, top: 0, height: 36 });

  // -------------------- lifecycle --------------------
  useEffect(() => {
    // load history
    const saved = localStorage.getItem("calc-history");
    if (saved) setHistory(JSON.parse(saved));

    // start blink
    const id = setInterval(() => setCursorVisible((s) => !s), 600);
    return () => clearInterval(id);
  }, []);

  // ensure cursor starts at end on mount / when input resets initially
  useEffect(() => {
    setCursorPos(() => Math.max(0, input.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // whenever input or cursor changes, update overlay coords and keep cursor visible by scrolling
  useLayoutEffect(() => {
  requestAnimationFrame(() => {
    updateCursorOverlay();
    ensureCursorVisible();
  });
}, [input, cursorPos]);


  // -------------------- helpers --------------------
  const saveHistory = (exp, res) => {
    const item = { exp, res, time: new Date().toLocaleString() };
    const newHistory = [item, ...history].slice(0, 100);
    setHistory(newHistory);
    localStorage.setItem("calc-history", JSON.stringify(newHistory));
  };

  // Insert at logical cursor
  const insertAtCursor = (text) => {
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

  // -------------------- safe evaluator (RPN) --------------------
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

  // live result
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
      // show as empty if NaN/undefined
      if (typeof v !== "undefined" && !Number.isNaN(v)) liveResult = v.toString();
    }
  } catch {
    liveResult = "";
  }

  const calculate = () => {
    try {
      const expr = input.replace(/×/g, "*").replace(/÷/g, "/").replace(/(\d+)%/g, "($1 * 0.01)");
      const res = safeEval(expr).toString();
      saveHistory(input, res);
      setInput(res);
      setCursorPos(res.length);
    } catch {
      setInput("Error");
      setCursorPos(5);
    }
  };

  // -------------------- keyboard --------------------
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
  }, [input]); // depends on input only

  // -------------------- cursor overlay math & scrolling --------------------
  const updateCursorOverlay = () => {
    const exprEl = exprRef.current;
    if (!exprEl) return;

    const len = input.length;
    let left = 6; // fallback padding
    let height = 36;
    // if cursor is at 0 (before first char)
    if (cursorPos === 0) {
      // leave left at small padding (offset 6)
      left = 6;
      height = getLineHeight(exprEl) || 36;
    } else {
      const el = charRefs.current[cursorPos - 1];
      if (el && typeof el.offsetLeft === "number") {
        left = el.offsetLeft + el.offsetWidth; // position after that char
        height = el.offsetHeight || getLineHeight(exprEl) || 36;
      } else {
        // fallback to end of container
        left = exprEl.scrollWidth;
        height = getLineHeight(exprEl) || 36;
      }
    }

    setCursorCoords({ left, top: 4, height });
  };

  // compute line height
  const getLineHeight = (el) => {
    const cs = window.getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight);
    if (!Number.isNaN(lh)) return lh;
    return parseFloat(cs.fontSize) * 1.1;
  };

  // ensure cursor visible by adjusting scrollLeft of expr container
  const ensureCursorVisible = () => {
  const expr = exprRef.current;
  if (!expr) return;

  const cursorX = cursorCoords.left;  // cursor visual x relative to content
  const viewLeft = expr.scrollLeft;
  const viewRight = expr.scrollLeft + expr.clientWidth;
  const margin = 30;

  // If cursor goes left off-screen
  if (cursorX < viewLeft + margin) {
    expr.scrollLeft = Math.max(0, cursorX - margin);
  }

  // If cursor goes right off-screen
  else if (cursorX > viewRight - margin) {
    expr.scrollLeft = cursorX - expr.clientWidth + margin;
  }
};


  // pointer/drag support to place cursor
  const draggingRef = useRef(false);

  const computePosFromPointer = (clientX) => {
    const exprEl = exprRef.current;
    if (!exprEl) return 0;
    const rect = exprEl.getBoundingClientRect();
    const relativeX = clientX - rect.left + exprEl.scrollLeft; // position in content coords

    // find first char center greater than relativeX -> position is that index
    const len = input.length;
    let pos = len; // default after last
    for (let i = 0; i < len; i++) {
      const el = charRefs.current[i];
      if (!el) continue;
      const center = el.offsetLeft + el.offsetWidth / 2;
      if (relativeX < center) {
        pos = i;
        break;
      }
    }
    return pos;
  };

  const onPointerDown = (e) => {
    // only left button or touch/pointer
    if (e.pointerType && e.button !== 0 && e.pointerType === "mouse") return;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pos = computePosFromPointer(e.clientX);
    setCursorPos(pos);
  };
  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    const pos = computePosFromPointer(e.clientX);
    setCursorPos(pos);
  };
  const onPointerUp = (e) => {
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // -------------------- UI event handlers --------------------
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
      // toggle sign for last number (simple)
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
    // default: insert
    insertAtCursor(lbl);
  };

  // -------------------- rendering --------------------
  // prepare char refs array length
  charRefs.current = Array.from({ length: input.length }).map(
    (v, i) => charRefs.current[i] || null
  );

  return (
    <div className="px-4 pb-10 select-none max-w-md mx-auto">
      {/* DISPLAY */}
      <div
        ref={displayRef}
        className="w-full bg-white rounded-xl mt-3 relative overflow-hidden"
        style={{
          height: 180,
          padding: 16,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* SCROLLABLE EXPRESSION AREA (2 lines) */}
        <div
          ref={exprRef}
          className="flex-1 overflow-y-auto"
          style={{
            textAlign: "right",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            direction: "ltr",
            fontSize: 44,
            fontWeight: 300,
            lineHeight: "1.05",
            paddingRight: 6,
            position: "relative", // cursor overlay is positioned inside this
            cursor: "text",
            userSelect: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* character spans (no cursor injected inside them) */}
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

          {/* cursor overlay (absolute inside exprRef) */}
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
              pointerEvents: "none", // doesn't block pointer events to characters
            }}
          />
        </div>

        {/* FIXED RESULT LINE (3rd line) */}
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

      {/* Icons Row */}
      <div className="flex justify-between items-center mt-3 px-2">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-10 h-10 flex justify-center items-center rounded-full bg-gray-200 text-gray-600"
        >
          <Clock size={22} strokeWidth={1.5} />
        </button>

        <button
          onClick={deleteLeft}
          className="w-10 h-10 flex justify-center items-center rounded-full border-2 border-green-500 text-green-600"
        >
          <X size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* History Drawer */}
      {showHistory && (
        <div className="bg-white rounded-lg shadow p-3 mt-3 max-h-48 overflow-y-auto border">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">History</div>
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
                onClick={() => {
                  setInput(h.res);
                  setCursorPos(h.res.length);
                }}
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
            "h-16 rounded-full flex items-center justify-center text-2xl active:scale-95 transition";

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
    </div>
  );
}
