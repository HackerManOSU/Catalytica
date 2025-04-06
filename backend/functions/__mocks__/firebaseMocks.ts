import { jest } from '@jest/globals';

export const db = {
    collection: jest.fn().mockReturnThis(),
    add: jest.fn(),
    get: jest.fn(),
    doc: jest.fn(),
  };