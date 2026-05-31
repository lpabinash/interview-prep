# Chapter 12 — Let's Build Our Store

## Why State Management?

As applications grow, managing state across many components becomes complex. Props work for simple trees, Context works for moderate sharing, but for large apps with frequent state updates and complex logic, you need a **dedicated state management solution**.

---

## Redux — Core Concepts

Redux is a **predictable state container** for JavaScript apps. It follows three principles:

1. **Single Source of Truth** — The entire app state lives in one store.
2. **State is Read-Only** — The only way to change state is to dispatch an action.
3. **Pure Reducers** — State changes are made by pure functions (reducers).

### The Redux Flow

```
UI → dispatch(action) → Reducer → New State → UI re-renders
```

```
┌──────────┐    dispatch    ┌──────────┐    returns    ┌──────────┐
│   View   │ ──────────────→│ Reducer  │ ─────────────→│  Store   │
│ (React)  │                │ (pure fn)│               │ (state)  │
└──────────┘                └──────────┘               └──────────┘
     ↑                                                       │
     └───────────── useSelector (subscribe) ─────────────────┘
```

---

## Redux Toolkit (RTK)

Redux Toolkit is the **official, recommended way** to write Redux. It eliminates boilerplate and includes sensible defaults.

```bash
npm install @reduxjs/toolkit react-redux
```

### Step 1: Create a Slice

A **slice** is a collection of reducer logic and actions for a single feature.

```jsx
// features/cart/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalQuantity: 0,
  },
  reducers: {
    addItem(state, action) {
      // RTK uses Immer — you can "mutate" state directly
      const existingItem = state.items.find(i => i.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
      state.totalQuantity += 1;
    },

    removeItem(state, action) {
      const index = state.items.findIndex(i => i.id === action.payload);
      if (index !== -1) {
        state.totalQuantity -= state.items[index].quantity;
        state.items.splice(index, 1);
      }
    },

    clearCart(state) {
      state.items = [];
      state.totalQuantity = 0;
    },
  },
});

export const { addItem, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
```

**Key Point:** RTK uses **Immer** internally. You can write "mutating" code (`state.items.push(...)`) and Immer creates an immutable update behind the scenes.

### Step 2: Configure the Store

```jsx
// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../features/cart/cartSlice';
import userReducer from '../features/user/userSlice';

const store = configureStore({
  reducer: {
    cart: cartReducer,
    user: userReducer,
  },
});

export default store;
```

`configureStore` automatically:
- Combines reducers.
- Adds Redux DevTools support.
- Adds `redux-thunk` middleware for async actions.
- Adds development checks for accidental mutations.

### Step 3: Provide the Store

```jsx
// App.jsx
import { Provider } from 'react-redux';
import store from './store/store';

function App() {
  return (
    <Provider store={store}>
      <Router />
    </Provider>
  );
}
```

### Step 4: Read State with useSelector

```jsx
import { useSelector } from 'react-redux';

function CartIcon() {
  const totalQuantity = useSelector(state => state.cart.totalQuantity);
  return <span>Cart ({totalQuantity})</span>;
}

function CartItems() {
  const items = useSelector(state => state.cart.items);
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.name} × {item.quantity} — ₹{item.price * item.quantity}
        </li>
      ))}
    </ul>
  );
}
```

**Important:** `useSelector` uses **strict equality** (`===`) by default. Return the **smallest piece of state** needed to avoid unnecessary re-renders.

### Step 5: Dispatch Actions with useDispatch

```jsx
import { useDispatch } from 'react-redux';
import { addItem, removeItem, clearCart } from '../features/cart/cartSlice';

function FoodItem({ item }) {
  const dispatch = useDispatch();

  return (
    <div>
      <h3>{item.name}</h3>
      <p>₹{item.price}</p>
      <button onClick={() => dispatch(addItem(item))}>Add to Cart</button>
    </div>
  );
}

function Cart() {
  const dispatch = useDispatch();
  const items = useSelector(state => state.cart.items);

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          <span>{item.name}</span>
          <button onClick={() => dispatch(removeItem(item.id))}>Remove</button>
        </div>
      ))}
      <button onClick={() => dispatch(clearCart())}>Clear Cart</button>
    </div>
  );
}
```

---

## Async Actions with createAsyncThunk

For API calls, use `createAsyncThunk`:

```jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchMenu = createAsyncThunk(
  'menu/fetchMenu',
  async (restaurantId) => {
    const response = await fetch(`/api/restaurants/${restaurantId}/menu`);
    return response.json();
  }
);

const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    items: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenu.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

// In a component:
function Menu({ restaurantId }) {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector(state => state.menu);

  useEffect(() => {
    dispatch(fetchMenu(restaurantId));
  }, [dispatch, restaurantId]);

  if (status === 'loading') return <Shimmer />;
  if (status === 'failed') return <p>Error: {error}</p>;

  return (
    <ul>
      {items.map(item => <MenuItem key={item.id} item={item} />)}
    </ul>
  );
}
```

---

## Selectors and Reselect

For **derived data**, create memoized selectors:

```jsx
import { createSelector } from '@reduxjs/toolkit';

// Input selectors
const selectCartItems = (state) => state.cart.items;

// Memoized selector — only recomputes when items change
export const selectCartTotal = createSelector(
  [selectCartItems],
  (items) => items.reduce((total, item) => total + item.price * item.quantity, 0)
);

// Usage
function CartTotal() {
  const total = useSelector(selectCartTotal);
  return <p>Total: ₹{total}</p>;
}
```

---

## Redux vs Context API

| Feature | Context API | Redux Toolkit |
|---|---|---|
| Setup | Minimal | More boilerplate |
| Performance | Re-renders all consumers | Selective re-renders with useSelector |
| DevTools | No | Yes (time-travel debugging) |
| Middleware | No | Yes (thunks, sagas) |
| Best for | Theme, auth, locale | Complex state, frequent updates |
| Async | Manual | createAsyncThunk |

**Use Context for:** Theme, locale, auth status — values that change rarely.
**Use Redux for:** Shopping cart, feed data, complex forms — values that change often and are used by many components.

---

## Other State Management Libraries

| Library | Approach | Bundle Size |
|---|---|---|
| **Redux Toolkit** | Flux pattern, single store | ~11 KB |
| **Zustand** | Hook-based, minimal API | ~1 KB |
| **Jotai** | Atomic state, bottom-up | ~3 KB |
| **Recoil** | Atomic state, by Meta | ~20 KB |
| **MobX** | Observable, mutable | ~15 KB |

### Zustand (Popular lightweight alternative)

```jsx
import { create } from 'zustand';

const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
  })),
  clearCart: () => set({ items: [] }),
}));

// Usage — no Provider needed!
function Cart() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  return (
    <div>
      {items.map(item => <p key={item.id}>{item.name}</p>)}
      <button onClick={clearCart}>Clear</button>
    </div>
  );
}
```

---

## Interview Questions

**Q: What is the difference between `useSelector` and `useContext`?**
A: `useSelector` subscribes to specific parts of the Redux store and only re-renders when that selected value changes. `useContext` re-renders the component whenever **any** value in the context changes.

**Q: Can you mutate state directly in Redux Toolkit?**
A: Yes, but only inside `createSlice` reducers. RTK uses Immer under the hood, so what looks like mutation actually produces an immutable update. Outside of slices, you must never mutate state.

**Q: When would you choose Redux over Context?**
A: When you have frequent state updates (e.g., shopping cart, real-time data), need DevTools for debugging, require middleware for async logic, or have complex state transitions. Context is better for infrequent changes like theme or auth.