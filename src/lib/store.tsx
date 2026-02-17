"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";
import { CartItem, Product, AgentType, ChatMessage } from "./types";

interface AppState {
  cart: CartItem[];
  messages: ChatMessage[];
  activeAgent: AgentType;
  isChatOpen: boolean;
  customerName: string;
  customerEmail: string;
}

type Action =
  | { type: "ADD_TO_CART"; product: Product }
  | { type: "REMOVE_FROM_CART"; sku: string }
  | { type: "UPDATE_QUANTITY"; sku: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "SET_MESSAGES"; messages: ChatMessage[] }
  | { type: "SET_ACTIVE_AGENT"; agent: AgentType }
  | { type: "TOGGLE_CHAT" }
  | { type: "SET_CHAT_OPEN"; open: boolean }
  | { type: "SET_CUSTOMER"; name: string; email: string };

const initialState: AppState = {
  cart: [],
  messages: [],
  activeAgent: null,
  isChatOpen: false,
  customerName: "",
  customerEmail: "",
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existing = state.cart.find((c) => c.product.sku === action.product.sku);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((c) =>
            c.product.sku === action.product.sku
              ? { ...c, quantity: c.quantity + 1 }
              : c
          ),
        };
      }
      return { ...state, cart: [...state.cart, { product: action.product, quantity: 1 }] };
    }
    case "REMOVE_FROM_CART":
      return { ...state, cart: state.cart.filter((c) => c.product.sku !== action.sku) };
    case "UPDATE_QUANTITY":
      return {
        ...state,
        cart: state.cart
          .map((c) =>
            c.product.sku === action.sku ? { ...c, quantity: action.quantity } : c
          )
          .filter((c) => c.quantity > 0),
      };
    case "CLEAR_CART":
      return { ...state, cart: [] };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "SET_MESSAGES":
      return { ...state, messages: action.messages };
    case "SET_ACTIVE_AGENT":
      return { ...state, activeAgent: action.agent };
    case "TOGGLE_CHAT":
      return { ...state, isChatOpen: !state.isChatOpen };
    case "SET_CHAT_OPEN":
      return { ...state, isChatOpen: action.open };
    case "SET_CUSTOMER":
      return { ...state, customerName: action.name, customerEmail: action.email };
    default:
      return state;
  }
}

interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addToCart: (product: Product) => void;
  removeFromCart: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  addMessage: (message: ChatMessage) => void;
  cartTotal: number;
  cartCount: number;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const addToCart = useCallback(
    (product: Product) => dispatch({ type: "ADD_TO_CART", product }),
    []
  );

  const removeFromCart = useCallback(
    (sku: string) => dispatch({ type: "REMOVE_FROM_CART", sku }),
    []
  );

  const updateQuantity = useCallback(
    (sku: string, quantity: number) => dispatch({ type: "UPDATE_QUANTITY", sku, quantity }),
    []
  );

  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), []);

  const addMessage = useCallback(
    (message: ChatMessage) => dispatch({ type: "ADD_MESSAGE", message }),
    []
  );

  const cartTotal = state.cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const cartCount = state.cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <StoreContext.Provider
      value={{ state, dispatch, addToCart, removeFromCart, updateQuantity, clearCart, addMessage, cartTotal, cartCount }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
