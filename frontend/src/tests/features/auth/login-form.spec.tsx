import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'

import { server } from '@/tests/mocks/server'
import { authLoadingState, authWithError } from '@/tests/fixtures'
import { renderWithProviders } from '@/tests/utils/render'
import { LoginForm } from '@/features/auth/ui/LoginForm'
import { config } from '@/shared/config'
import { TEST_IDS } from '@/shared/constants'

describe('LoginForm', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  it('renders form controls', () => {
    renderWithProviders(<LoginForm />)

    expect(
      screen.getByTestId(TEST_IDS.loginForm.usernameInput)
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(TEST_IDS.loginForm.passwordInput)
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(TEST_IDS.loginForm.submitButton)
    ).toBeInTheDocument()
  })

  it('renders switch-to-register action when callback is provided', () => {
    renderWithProviders(<LoginForm onSwitchToRegister={vi.fn()} />)

    expect(
      screen.getByTestId(TEST_IDS.loginForm.switchButton)
    ).toBeInTheDocument()
  })

  it('does not render switch-to-register action without callback', () => {
    renderWithProviders(<LoginForm />)

    expect(
      screen.queryByTestId(TEST_IDS.loginForm.switchButton)
    ).not.toBeInTheDocument()
  })

  it('uses a password input type', () => {
    renderWithProviders(<LoginForm />)

    expect(
      screen.getByTestId(TEST_IDS.loginForm.passwordInput)
    ).toHaveAttribute('type', 'password')
  })

  it('shows validation alerts and does not submit empty form', async () => {
    const onSuccess = vi.fn()
    renderWithProviders(<LoginForm onSuccess={onSuccess} />)

    await user.click(screen.getByTestId(TEST_IDS.loginForm.submitButton))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts).toHaveLength(2)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('calls onSuccess after successful login', async () => {
    const onSuccess = vi.fn()
    renderWithProviders(<LoginForm onSuccess={onSuccess} />)

    await user.type(
      screen.getByTestId(TEST_IDS.loginForm.usernameInput),
      'alice'
    )
    await user.type(
      screen.getByTestId(TEST_IDS.loginForm.passwordInput),
      'secret123'
    )
    await user.click(screen.getByTestId(TEST_IDS.loginForm.submitButton))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
    })
  })

  it('shows auth error and does not call onSuccess for failed login', async () => {
    const onSuccess = vi.fn()

    server.use(
      http.post(`${config.api.baseUrl}/auth/login`, () => {
        return HttpResponse.json(
          { success: false, message: 'Invalid credentials' },
          { status: 401 }
        )
      })
    )

    renderWithProviders(<LoginForm onSuccess={onSuccess} />)

    await user.type(
      screen.getByTestId(TEST_IDS.loginForm.usernameInput),
      'alice'
    )
    await user.type(
      screen.getByTestId(TEST_IDS.loginForm.passwordInput),
      'wrong-pass'
    )
    await user.click(screen.getByTestId(TEST_IDS.loginForm.submitButton))

    const errorNode = await screen.findByTestId(TEST_IDS.loginForm.authError)
    expect(errorNode).toBeInTheDocument()
    expect(errorNode).not.toBeEmptyDOMElement()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('calls onSwitchToRegister when switch action is clicked', async () => {
    const onSwitch = vi.fn()
    renderWithProviders(<LoginForm onSwitchToRegister={onSwitch} />)

    await user.click(screen.getByTestId(TEST_IDS.loginForm.switchButton))

    expect(onSwitch).toHaveBeenCalledOnce()
  })

  it('disables submit button when auth state is loading', () => {
    renderWithProviders(<LoginForm />, { preloadedState: authLoadingState })

    expect(screen.getByTestId(TEST_IDS.loginForm.submitButton)).toBeDisabled()
  })

  it('renders redux auth error', () => {
    renderWithProviders(<LoginForm />, {
      preloadedState: authWithError('Invalid credentials')
    })

    expect(screen.getByTestId(TEST_IDS.loginForm.authError)).toHaveTextContent(
      'Invalid credentials'
    )
  })
})
