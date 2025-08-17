# Testing Guide

This project uses Jest and React Testing Library for testing.

## Setup

Jest is configured with the following features:
- **TypeScript support** via `ts-jest`
- **Next.js integration** using `next/jest`
- **React component testing** with `@testing-library/react`
- **DOM assertions** with `@testing-library/jest-dom`
- **jsdom environment** for browser-like testing

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI (no watch, with coverage)
npm run test:ci
```

## Test Structure

Tests are organized in `__tests__` folders alongside the code they test:

```
src/
├── components/
│   ├── __tests__/
│   │   ├── CopyButton.test.tsx
│   │   └── PageLayout.test.tsx
│   └── CopyButton.tsx
├── utils/
│   ├── __tests__/
│   │   ├── calendar.test.ts
│   │   └── common.test.ts
│   └── calendar.ts
└── __tests__/
    └── utils/
        └── test-utils.tsx
```

## Test Utilities

### Custom Render Function

Use the custom render function from `test-utils.tsx` for testing components that need providers:

```tsx
import { render, screen } from '../../__tests__/utils/test-utils'

test('renders component with providers', () => {
  render(<MyComponent />)
  // Component is automatically wrapped with SessionProvider
})
```

### Mock Data Factories

```tsx
import { createMockTask, createMockTasks } from '../../__tests__/utils/test-utils'

const task = createMockTask({ number: 'T-123' })
const tasks = createMockTasks(5) // Creates 5 mock tasks
```

### Mock API Responses

```tsx
import { mockFetchSuccess, mockFetchError } from '../../__tests__/utils/test-utils'

// Mock successful API response
mockFetchSuccess({ tasks: [] })

// Mock API error
mockFetchError('Server error')
```

## Mocked Dependencies

The following are automatically mocked in `jest.setup.js`:

- **Next.js Router** (`next/router` and `next/navigation`)
- **NextAuth** (`next-auth/react`)
- **localStorage**
- **fetch API**
- **Clipboard API**
- **ResizeObserver**

## Writing Tests

### Component Tests

```tsx
import { render, screen, fireEvent } from '../../__tests__/utils/test-utils'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle clicks', () => {
    const mockClick = jest.fn()
    render(<MyComponent onClick={mockClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockClick).toHaveBeenCalled()
  })
})
```

### Hook Tests

```tsx
import { renderHook, act } from '@testing-library/react'
import { useMyHook } from '../useMyHook'

describe('useMyHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe(0)
  })

  it('should update state', () => {
    const { result } = renderHook(() => useMyHook())
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.value).toBe(1)
  })
})
```

### Utility Function Tests

```tsx
import { myUtilFunction } from '../utils'

describe('myUtilFunction', () => {
  it('should process input correctly', () => {
    const result = myUtilFunction('input')
    expect(result).toBe('expected output')
  })
})
```

## Coverage

Test coverage is configured to:
- Include all files in `src/` except test files and type definitions
- Exclude API routes (`src/pages/api/**`)
- Exclude Next.js special files (`_app.tsx`, `_document.tsx`)

Current coverage targets:
- **Statements**: Aim for >80%
- **Branches**: Aim for >80%
- **Functions**: Aim for >80%
- **Lines**: Aim for >80%

## Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Keep tests focused and isolated**
4. **Mock external dependencies**
5. **Test edge cases and error conditions**
6. **Use proper assertions with meaningful error messages**

## Debugging Tests

```bash
# Run specific test file
npm test MyComponent.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should handle clicks"

# Run with verbose output
npm test -- --verbose

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```