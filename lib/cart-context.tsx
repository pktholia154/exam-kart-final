"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Book } from './books-store';

interface CartItem {
  book: Book;
  quantity: number; // usually 1 for ebooks
}

interface CartContextType {
  items: CartItem[];
  addToCart: (book: Book) => void;
  removeFromCart: (bookId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        // eslint-disable-next-line
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load cart", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (book: Book) => {
    setItems((prev) => {
      const existing = prev.find((item) => (item.book.id || item.book.seoslug) === (book.id || book.seoslug));
      if (existing) {
        return prev;
      }
      return [...prev, { book, quantity: 1 }];
    });
  };

  const removeFromCart = (bookId: string) => {
    setItems((prev) => prev.filter((item) => (item.book.id || item.book.seoslug) !== bookId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.length;
  const totalPrice = items.reduce((total, item) => total + (parseFloat(item.book.buyprice) || 0), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
