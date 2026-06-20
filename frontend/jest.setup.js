import '@testing-library/jest-dom';

// Mock window.matchMedia which is required by Ant Design layout components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver which is required by Recharts
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock;

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Mock scrollbar measurement which throws "not implemented" in JSDOM
jest.mock('rc-util/lib/getScrollBarSize', () => {
  const mockFn = () => 0;
  return {
    __esModule: true,
    default: mockFn,
    getTargetScrollBarSize: mockFn,
  };
});
jest.mock('rc-util/es/getScrollBarSize', () => {
  const mockFn = () => 0;
  return {
    __esModule: true,
    default: mockFn,
    getTargetScrollBarSize: mockFn,
  };
});

// Mock rc-motion to bypass animations in tests and unmount hidden modals immediately
jest.mock('rc-motion', () => {
  const React = require('react');

  const CSSMotion = ({ children, visible }) => {
    if (visible === false) return null;
    if (typeof children === 'function') {
      return children({ style: {} }, null);
    }
    return children || null;
  };

  const CSSMotionList = ({ children, keys }) => {
    if (typeof children === 'function') {
      const items = keys || [];
      return (
        React.createElement(React.Fragment, null,
          items.map((item) => {
            const itemKey = typeof item === 'object' && item !== null ? item.key : item;
            const itemData = typeof item === 'object' && item !== null ? item : { key: item };
            return React.createElement(
              React.Fragment,
              { key: itemKey },
              children({ ...itemData, visible: true }, null)
            );
          })
        )
      );
    }
    return children || null;
  };

  return {
    __esModule: true,
    default: CSSMotion,
    CSSMotion,
    CSSMotionList,
  };
});

// Mock react-router-dom globally for useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));
