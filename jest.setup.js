import '@testing-library/jest-dom';
import * as zustand from 'zustand';
import { vi, beforeEach } from 'vitest';

const { create: actualCreate, ...rest } = zustand;

const stores = new Set();

const create = (...args) => {
  const store = actualCreate(...args);
  const initialState = store.getState();
  stores.add({ store, initialState });
  return store;
};

beforeEach(() => {
  stores.forEach(({ store, initialState }) => {
    store.setState(initialState, true);
  });
});

vi.spyOn(zustand, 'create').mockImplementation(create);
