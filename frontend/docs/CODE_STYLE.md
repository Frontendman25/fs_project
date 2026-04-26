# Code Style Guide (Frontend)

This document outlines the coding standards and conventions for the React/Next.js frontend application.

## � Documentation Requirements

### JSDoc Documentation (REQUIRED)
Every file MUST include proper JSDoc documentation:

#### File Level
```typescript
/**
 * @fileoverview Brief description of the file's purpose
 * @module path/to/module
 * @layer [shared | entities | features | widgets | pages]
 */
```

#### Components
```typescript
/**
 * @component ComponentName
 * @description Detailed description of what this component does
 * @example
 * ```tsx
 * <ComponentName
 *   requiredProp="value"
 *   optionalProp={123}
 * />
 * ```
 */
```

#### Props Interface
```typescript
/**
 * Props for the ComponentName component
 * @interface ComponentNameProps
 */
interface ComponentNameProps {
  /**
   * Description of what this prop does
   * @type {string}
   * @required
   */
  requiredProp: string;

  /**
   * Description of what this prop does
   * @type {number}
   * @default 0
   */
  optionalProp?: number;
}
```

#### Functions & Hooks
```typescript
/**
 * Description of what the function does
 * @function functionName
 * @param {ParamType} paramName - Description of the parameter
 * @returns {ReturnType} Description of what is returned
 * @throws {ErrorType} Description of when errors occur
 */
```

### Documentation Example
```typescript
/**
 * @fileoverview Auth form component for handling user login
 * @module features/auth/ui/LoginForm
 * @layer features
 */

/**
 * Props for the LoginForm component
 * @interface LoginFormProps
 */
interface LoginFormProps {
  /**
   * Callback fired when login is successful
   * @type {() => void}
   */
  onSuccess?: () => void;

  /**
   * Callback to switch to registration form
   * @type {() => void}
   */
  onSwitchToRegister?: () => void;
}

/**
 * @component LoginForm
 * @description Handles user authentication through a login form
 * @example
 * ```tsx
 * <LoginForm
 *   onSuccess={() => router.push('/dashboard')}
 *   onSwitchToRegister={() => setMode('register')}
 * />
 * ```
 */
export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  // Component implementation
}
```

## �🔹 General Rules

### Imports
- **Libraries first**: Import external libraries (react, axios, redux, shadcn/ui, etc.) at the top
- **Local imports after one empty line**: Import local files (@/entities/..., @/features/...) after external libraries
- **Example**:
```tsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LogIn } from 'lucide-react';

import { AppDispatch, RootState } from '../../../app/store';
import { loginUser } from '../../../entities/auth/model/authSlice';
```

### Hooks
- Always use hooks directly from React: `useEffect`, `useState`, `useCallback`, etc.
- **Never** use `React.useEffect` - always use `useEffect`
- Import hooks at the top with other React imports

### Events
- **Never** use `e` as parameter name
- **Always** use `event` with proper TypeScript typing
- **Example**:
```tsx
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  // ...
};

const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setValue(event.target.value);
};
```

### API Requests
- **Always** use axios for HTTP requests
- **Never** use fetch directly
- Use shared `apiClient` with axios.create and interceptors for tokens and error handling
- All API calls should go through the shared API layer

### Redux Error Handling
- **Never** leave `// Error handled by Redux` comments without implementation
- Actually implement error handling in Redux Slice (e.g., `setError` in authSlice)
- Store error states in Redux, not in components
- UI components should read error state from Redux store

### UI/UX

### Next.js Server Components
- If you see error: `This function is not supported in React Server Components...`
- Fix by adding `"use client";` at the top of the file
- Client components are needed for interactivity, hooks, and browser APIs

### Documentation
- Add JSDoc-style comments above all functions, classes, and components
- Document parameters, return types, and possible errors
- **Example**:`````````````````````````                                                                                                                                                             ```````````````````````````~~~
```tsx
/**
 * Login form component for user authentication
 * @param onSuccess - Callback function called on successful login
 * @param onSwitchToRegister - Callback function to switch to register form
 * @returns JSX element representing the login form
 */
export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  // ...
};
```

## 📘 Architecture Guidelines

### Feature-Sliced Design (FSD)
- Follow FSD architecture principles
- Organize code by features, not by file types
- Structure: `shared/` → `entities/` → `features/` → `widgets/` → `pages/` → `app/`

### Component Structure
- Use functional components with TypeScript
- Define interfaces for props
- Use proper typing for all parameters and return values
- Keep components focused and single-responsibility

### State Management
- Use Redux Toolkit for global state
- Store loading states, errors, and data in Redux
- Use proper async thunks for API calls
- Handle errors in Redux slices, not components

### Styling
- Use Tailwind CSS for styling
- Follow design system variables
- Use shadcn/ui components when possible
- Maintain consistent spacing and typography

## 🧪 Testing & Storybook

### Storybook
- Use Storybook for all UI components
- Every new component must have a `.stories.tsx` file
- Document component variants and states
- Include examples of different prop combinations

### Testing
- Write unit tests for utility functions
- Test component behavior, not implementation details
- Mock API calls in tests
- Use React Testing Library for component tests

## 🚀 Performance

### Optimization
- Use `React.memo` for expensive components
- Implement proper dependency arrays in hooks
- Avoid unnecessary re-renders
- Use `useCallback` and `useMemo` appropriately

### Bundle Size
- Import only what you need from libraries
- Use dynamic imports for large components
- Optimize images and assets
- Monitor bundle size regularly

## 📝 Examples

### Complete Component Example
```tsx
'use client';

import React, { FC, FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LogIn } from 'lucide-react'

import { AppDispatch, RootState } from '../../../app/store'
import { loginUser, clearError } from '../../../entities/auth/model/authSlice'
import { Button } from '../../../shared/ui/Button'
import { useToast } from '../../../shared/ui/use-toast'

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

/**
 * Login form component for user authentication
 * @param onSuccess - Callback function called on successful login
 * @param onSwitchToRegister - Callback function to switch to register form
 */
export const LoginForm: FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading, error } = useSelector((state: RootState) => state.auth)
  const { toast } = useToast()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    try {
      const result = await dispatch(loginUser(credentials))
      if (loginUser.fulfilled.match(result)) {
        toast({
          title: 'Success',
          description: 'You have been logged in successfully.'
        })
        onSuccess?.()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Login failed. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    // Component JSX
  )
}
```

This style guide ensures consistency, maintainability, and best practices across the entire frontend codebase.
