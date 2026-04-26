import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'

import { server } from '@/tests/mocks/server'
import { authLoadingState, authWithError } from '@/tests/fixtures'
import { renderWithProviders } from '@/tests/utils/render'
import { RegisterForm } from '@/features/auth/ui/RegisterForm'
import { config } from '@/shared/config'
import { TEST_IDS } from '@/shared/constants'

async function fillValidForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Record<string, string> = {}
) {
  const values = {
    name: 'new-user',
    email: 'bob@example.com',
    password: 'secret123',
    confirmPassword: 'secret123',
    ...overrides
  }

  await user.type(
    screen.getByTestId(TEST_IDS.registerForm.nameInput),
    values.name
  )
  await user.type(
    screen.getByTestId(TEST_IDS.registerForm.emailInput),
    values.email
  )
  await user.type(
    screen.getByTestId(TEST_IDS.registerForm.passwordInput),
    values.password
  )
  await user.type(
    screen.getByTestId(TEST_IDS.registerForm.confirmPasswordInput),
    values.confirmPassword
  )
}

describe('RegisterForm', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  it('renders all form controls', () => {
    renderWithProviders(<RegisterForm />)

    expect(
      screen.getByTestId(TEST_IDS.registerForm.nameInput)
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(TEST_IDS.registerForm.emailInput)
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(TEST_IDS.registerForm.passwordInput)
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(TEST_IDS.registerForm.confirmPasswordInput)
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(TEST_IDS.registerForm.submitButton)
    ).toBeInTheDocument()
  })

  it('renders switch-to-login action when callback is provided', () => {
    renderWithProviders(<RegisterForm onSwitchToLogin={vi.fn()} />)

    expect(
      screen.getByTestId(TEST_IDS.registerForm.switchButton)
    ).toBeInTheDocument()
  })

  it('uses password input type for password fields', () => {
    renderWithProviders(<RegisterForm />)

    expect(
      screen.getByTestId(TEST_IDS.registerForm.passwordInput)
    ).toHaveAttribute('type', 'password')
    expect(
      screen.getByTestId(TEST_IDS.registerForm.confirmPasswordInput)
    ).toHaveAttribute('type', 'password')
  })

  it('blocks submit when name is too short', async () => {
    const onSuccess = vi.fn()

    renderWithProviders(<RegisterForm onSuccess={onSuccess} />)
    await user.type(screen.getByTestId(TEST_IDS.registerForm.nameInput), 'a')
    await user.type(
      screen.getByTestId(TEST_IDS.registerForm.emailInput),
      'valid@example.com'
    )
    await user.type(
      screen.getByTestId(TEST_IDS.registerForm.passwordInput),
      'validpass'
    )
    await user.type(
      screen.getByTestId(TEST_IDS.registerForm.confirmPasswordInput),
      'validpass'
    )
    await user.click(screen.getByTestId(TEST_IDS.registerForm.submitButton))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.length).toBeGreaterThan(0)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('blocks submit when email is invalid', async () => {
    const onSuccess = vi.fn()

    renderWithProviders(<RegisterForm onSuccess={onSuccess} />)
    await user.type(screen.getByTestId(TEST_IDS.registerForm.nameInput), 'bob')
    await user.type(
      screen.getByTestId(TEST_IDS.registerForm.emailInput),
      'not-an-email'
    )
    await user.type(
      screen.getByTestId(TEST_IDS.registerForm.passwordInput),
      'validpass'
    )
    await user.type(
      screen.getByTestId(TEST_IDS.registerForm.confirmPasswordInput),
      'validpass'
    )
    await user.click(screen.getByTestId(TEST_IDS.registerForm.submitButton))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.length).toBeGreaterThan(0)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('blocks submit when password is too short', async () => {
    const onSuccess = vi.fn()

    renderWithProviders(<RegisterForm onSuccess={onSuccess} />)
    await user.type(screen.getByTestId(TEST_IDS.registerForm.nameInput), 'bob')
    await user.type(
      screen.getByTestId(TEST_IDS.registerForm.emailInput),
      'bob@example.com'
    )
    await user.type(
      screen.getByTestId(TEST_IDS.registerForm.passwordInput),
      'abc'
    )
    await user.type(
      screen.getByTestId(TEST_IDS.registerForm.confirmPasswordInput),
      'abc'
    )
    await user.click(screen.getByTestId(TEST_IDS.registerForm.submitButton))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.length).toBeGreaterThan(0)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('blocks submit when passwords do not match', async () => {
    const onSuccess = vi.fn()

    renderWithProviders(<RegisterForm onSuccess={onSuccess} />)
    await user.type(screen.getByTestId(TEST_IDS.registerForm.nameInput), 'bob')
    await user.type(
      screen.getByTestId(TEST_IDS.registerForm.emailInput),
      'bob@example.com'
    )
    await user.type(
      screen.getByTestId(TEST_IDS.registerForm.passwordInput),
      'secret123'
    )
    await user.type(
      screen.getByTestId(TEST_IDS.registerForm.confirmPasswordInput),
      'different123'
    )
    await user.click(screen.getByTestId(TEST_IDS.registerForm.submitButton))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.length).toBeGreaterThan(0)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('calls onSwitchToLogin when switch action is clicked', async () => {
    const onSwitch = vi.fn()
    renderWithProviders(<RegisterForm onSwitchToLogin={onSwitch} />)

    await user.click(screen.getByTestId(TEST_IDS.registerForm.switchButton))

    expect(onSwitch).toHaveBeenCalledOnce()
  })

  it('disables submit button when auth state is loading', () => {
    renderWithProviders(<RegisterForm />, { preloadedState: authLoadingState })

    expect(
      screen.getByTestId(TEST_IDS.registerForm.submitButton)
    ).toBeDisabled()
  })

  it('renders redux auth error', () => {
    renderWithProviders(<RegisterForm />, {
      preloadedState: authWithError('Username already taken')
    })

    expect(
      screen.getByTestId(TEST_IDS.registerForm.authError)
    ).toHaveTextContent('Username already taken')
  })

  it('calls onSuccess after successful registration', async () => {
    const onSuccess = vi.fn()

    renderWithProviders(<RegisterForm onSuccess={onSuccess} />)
    await fillValidForm(user)
    await user.click(screen.getByTestId(TEST_IDS.registerForm.submitButton))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
    })
  })

  it('shows auth error when server rejects registration and does not call onSuccess', async () => {
    const onSuccess = vi.fn()

    server.use(
      http.post(`${config.api.baseUrl}/auth/register`, () =>
        HttpResponse.json(
          {
            success: false,
            message: 'Username already taken'
          },
          { status: 409 }
        )
      )
    )

    renderWithProviders(<RegisterForm onSuccess={onSuccess} />)
    await fillValidForm(user, { name: 'taken-user' })
    await user.click(screen.getByTestId(TEST_IDS.registerForm.submitButton))

    const errorNode = await screen.findByTestId(TEST_IDS.registerForm.authError)
    expect(errorNode).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
