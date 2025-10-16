// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock Firebase config to avoid initialization errors in tests
jest.mock("@/lib/firebase/config", () => ({
    auth: {},
    db: {},
}));
