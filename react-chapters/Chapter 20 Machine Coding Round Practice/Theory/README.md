# Chapter 20 — Machine Coding Round Practice

## What Is a Machine Coding Round?

In frontend interviews, a **machine coding round** tests your ability to build a small, functional UI component from scratch in 60–90 minutes. You're evaluated on:

- **Working functionality** — does it actually work?
- **Code structure** — components, hooks, separation of concerns.
- **React patterns** — proper state management, controlled components, effects.
- **Edge cases** — empty states, loading, errors, boundary conditions.
- **CSS/UX** — basic styling and usability.

---

## 1. Accordion

A collapsible accordion where only one section is open at a time.

```jsx
import { useState } from 'react';

const data = [
  { id: 1, title: 'What is React?', content: 'A JavaScript library for building user interfaces.' },
  { id: 2, title: 'What are hooks?', content: 'Functions that let you use state and lifecycle features in function components.' },
  { id: 3, title: 'What is JSX?', content: 'A syntax extension that lets you write HTML-like code in JavaScript.' },
];

function Accordion() {
  const [activeId, setActiveId] = useState(null);

  const toggle = (id) => {
    setActiveId(prev => (prev === id ? null : id));
  };

  return (
    <div className="accordion">
      {data.map(item => (
        <div key={item.id} className="accordion-item">
          <button
            className="accordion-header"
            onClick={() => toggle(item.id)}
            aria-expanded={activeId === item.id}
          >
            {item.title}
            <span>{activeId === item.id ? '−' : '+'}</span>
          </button>
          {activeId === item.id && (
            <div className="accordion-body">{item.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Key Points:**
- Single source of truth for open state.
- Use `aria-expanded` for accessibility.
- Toggle logic: clicking the same item closes it.

---

## 2. Star Rating

An interactive star rating component.

```jsx
import { useState } from 'react';

function StarRating({ maxStars = 5, onChange }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const handleClick = (value) => {
    setRating(value);
    onChange?.(value);
  };

  return (
    <div role="radiogroup" aria-label="Star rating">
      {Array.from({ length: maxStars }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          onClick={() => handleClick(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          style={{
            cursor: 'pointer',
            fontSize: '2rem',
            background: 'none',
            border: 'none',
            color: star <= (hover || rating) ? '#ffc107' : '#e0e0e0',
          }}
        >
          ★
        </button>
      ))}
      <p>{rating} / {maxStars}</p>
    </div>
  );
}
```

**Key Points:**
- Separate `hover` and `rating` state for preview effect.
- `onMouseLeave` resets hover so selected stars show.

---

## 3. Infinite Scroll

Load more items as the user scrolls to the bottom.

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

function useIntersectionObserver(callback) {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) callback();
      },
      { threshold: 1.0 }
    );

    const el = ref.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [callback]);

  return ref;
}

function InfiniteList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const res = await fetch(`/api/items?page=${page}&limit=20`);
    const data = await res.json();

    setItems(prev => [...prev, ...data.items]);
    setHasMore(data.hasMore);
    setPage(prev => prev + 1);
    setLoading(false);
  }, [page, loading, hasMore]);

  // Load first page
  useEffect(() => { loadMore(); }, []);

  const sentinelRef = useIntersectionObserver(loadMore);

  return (
    <div>
      {items.map(item => (
        <div key={item.id} className="item">{item.name}</div>
      ))}
      {loading && <p>Loading...</p>}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
      {!hasMore && <p>No more items</p>}
    </div>
  );
}
```

**Key Points:**
- Use `IntersectionObserver` instead of scroll events (more performant).
- Sentinel element at the bottom triggers loading.
- Guard against duplicate fetches with `loading` flag.

---

## 4. Autocomplete / Typeahead Search

Search with debounced API calls and keyboard navigation.

```jsx
import { useState, useEffect, useRef } from 'react';

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function Autocomplete({ fetchSuggestions, onSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }
    fetchSuggestions(debouncedQuery).then(results => {
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setActiveIndex(-1);
    });
  }, [debouncedQuery, fetchSuggestions]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      select(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const select = (item) => {
    setQuery(item.label);
    setIsOpen(false);
    onSelect?.(item);
  };

  return (
    <div className="autocomplete" style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        placeholder="Search..."
        role="combobox"
        aria-expanded={isOpen}
      />
      {isOpen && (
        <ul role="listbox" style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          border: '1px solid #ccc', background: '#fff', listStyle: 'none',
          padding: 0, margin: 0, maxHeight: 200, overflowY: 'auto',
        }}>
          {suggestions.map((item, i) => (
            <li
              key={item.id}
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => select(item)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                background: i === activeIndex ? '#e3f2fd' : 'transparent',
              }}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Key Points:**
- Debounce to avoid excessive API calls.
- Full keyboard navigation (arrow keys, enter, escape).
- ARIA roles (`combobox`, `listbox`, `option`) for accessibility.

---

## 5. Tic-Tac-Toe

Classic two-player tic-tac-toe game.

```jsx
import { useState } from 'react';

function calculateWinner(squares) {
  const lines = [
    [0,1,2], [3,4,5], [6,7,8], // rows
    [0,3,6], [1,4,7], [2,5,8], // columns
    [0,4,8], [2,4,6],          // diagonals
  ];
  for (const [a,b,c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  const handleClick = (index) => {
    if (board[index] || winner) return;
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const status = winner
    ? `Winner: ${winner}`
    : isDraw
    ? "It's a draw!"
    : `Next: ${isXNext ? 'X' : 'O'}`;

  return (
    <div>
      <p>{status}</p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 80px)',
        gap: 4,
      }}>
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            style={{
              width: 80, height: 80, fontSize: '2rem',
              cursor: cell || winner ? 'default' : 'pointer',
            }}
          >
            {cell}
          </button>
        ))}
      </div>
      <button onClick={reset} style={{ marginTop: 16 }}>Reset</button>
    </div>
  );
}
```

---

## 6. Multi-Step Form / Stepper

A form wizard with validation and navigation between steps.

```jsx
import { useState } from 'react';

const steps = [
  { title: 'Personal Info', fields: ['name', 'email'] },
  { title: 'Address', fields: ['street', 'city', 'zip'] },
  { title: 'Review', fields: [] },
];

function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const stepFields = steps[currentStep].fields;
    const newErrors = {};
    for (const field of stepFields) {
      if (!formData[field]?.trim()) {
        newErrors[field] = `${field} is required`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => {
    if (validate()) setCurrentStep(s => s + 1);
  };

  const prev = () => setCurrentStep(s => s - 1);

  const submit = () => {
    console.log('Submitted:', formData);
    alert('Form submitted!');
  };

  const step = steps[currentStep];

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              padding: '8px 16px',
              background: i === currentStep ? '#1976d2' : i < currentStep ? '#4caf50' : '#e0e0e0',
              color: i <= currentStep ? '#fff' : '#333',
              borderRadius: 4,
            }}
          >
            {s.title}
          </div>
        ))}
      </div>

      {/* Fields */}
      <h2>{step.title}</h2>
      {step.fields.map(field => (
        <div key={field} style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, textTransform: 'capitalize' }}>
            {field}
          </label>
          <input
            value={formData[field] || ''}
            onChange={e => updateField(field, e.target.value)}
            style={{ padding: 8, width: '100%', maxWidth: 300 }}
          />
          {errors[field] && <p style={{ color: 'red', fontSize: 12 }}>{errors[field]}</p>}
        </div>
      ))}

      {/* Review */}
      {currentStep === steps.length - 1 && (
        <pre style={{ background: '#f5f5f5', padding: 16 }}>
          {JSON.stringify(formData, null, 2)}
        </pre>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {currentStep > 0 && <button onClick={prev}>Back</button>}
        {currentStep < steps.length - 1
          ? <button onClick={next}>Next</button>
          : <button onClick={submit}>Submit</button>
        }
      </div>
    </div>
  );
}
```

---

## Tips for Machine Coding Rounds

1. **Start with a plan** — spend 5 minutes listing components, state, and data flow.
2. **Get it working first** — ugly code that works beats beautiful code that doesn't.
3. **Use semantic HTML** — `<button>`, `<form>`, `<label>`, `<ul>` — not `<div>` for everything.
4. **Handle edge cases** — empty states, loading, disabled states, boundary values.
5. **Keep components small** — extract when a component exceeds ~50 lines.
6. **Name things clearly** — `handleClick`, `isLoading`, `activeIndex`, not `x`, `flag`, `temp`.
7. **Add basic accessibility** — ARIA roles, labels, keyboard support.
8. **Don't over-engineer** — no need for Redux, complex abstractions, or perfect architecture in 90 minutes.
