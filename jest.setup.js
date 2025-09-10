import '@testing-library/jest-dom';
import * as zustand from 'zustand';
import { jest } from '@jest/globals';

const { create: actualCreate, ...rest } = jest.requireActual('zustand');

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

jest.spyOn(zustand, 'create').mockImplementation(create);
