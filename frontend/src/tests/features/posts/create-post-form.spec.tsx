import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  authenticatedUserState,
  anonymousUserState
} from '@/tests/fixtures'
import { renderWithProviders } from '@/tests/utils/render'
import { CreatePostForm } from '@/features/posts/ui/CreatePostForm'
import { POST_CONSTANTS, TEST_IDS } from '@/shared/constants'

describe('CreatePostForm', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  it('shows auth guard message when no user is present', () => {
    renderWithProviders(<CreatePostForm />, {
      preloadedState: anonymousUserState
    })

    expect(
      screen.getByTestId(TEST_IDS.createPostForm.authError)
    ).toBeInTheDocument()
  })

  it('does not render content controls when user is missing', () => {
    renderWithProviders(<CreatePostForm />, {
      preloadedState: anonymousUserState
    })

    expect(
      screen.queryByTestId(TEST_IDS.createPostForm.contentInput)
    ).not.toBeInTheDocument()
  })

  it('renders content input and submit action when user is logged in', () => {
    renderWithProviders(<CreatePostForm />, {
      preloadedState: authenticatedUserState
    })

    expect(
      screen.getByTestId(TEST_IDS.createPostForm.contentInput)
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(TEST_IDS.createPostForm.submitButton)
    ).toBeInTheDocument()
  })

  it('disables submit button while content is empty', () => {
    renderWithProviders(<CreatePostForm />, {
      preloadedState: authenticatedUserState
    })

    expect(
      screen.getByTestId(TEST_IDS.createPostForm.submitButton)
    ).toBeDisabled()
  })

  it('enables submit button after valid content is typed', async () => {
    renderWithProviders(<CreatePostForm />, {
      preloadedState: authenticatedUserState
    })

    await user.type(
      screen.getByTestId(TEST_IDS.createPostForm.contentInput),
      'Hello, world!'
    )

    expect(
      screen.getByTestId(TEST_IDS.createPostForm.submitButton)
    ).toBeEnabled()
  })

  it('shows initial character counter', () => {
    renderWithProviders(<CreatePostForm />, {
      preloadedState: authenticatedUserState
    })

    expect(
      screen.getByTestId(TEST_IDS.createPostForm.characterCounter)
    ).toHaveTextContent(`0/${POST_CONSTANTS.MAX_CONTENT_LENGTH}`)
  })

  it('updates character counter while typing', async () => {
    renderWithProviders(<CreatePostForm />, {
      preloadedState: authenticatedUserState
    })

    await user.type(
      screen.getByTestId(TEST_IDS.createPostForm.contentInput),
      'Hello'
    )

    expect(
      screen.getByTestId(TEST_IDS.createPostForm.characterCounter)
    ).toHaveTextContent(`5/${POST_CONSTANTS.MAX_CONTENT_LENGTH}`)
  })

  it('does not allow content beyond the maximum length', async () => {
    renderWithProviders(<CreatePostForm />, {
      preloadedState: authenticatedUserState
    })
    const textarea = screen.getByTestId(TEST_IDS.createPostForm.contentInput)

    await user.click(textarea)
    await user.paste('x'.repeat(POST_CONSTANTS.MAX_CONTENT_LENGTH))
    expect(
      screen.getByTestId(TEST_IDS.createPostForm.characterCounter)
    ).toHaveTextContent(
      `${POST_CONSTANTS.MAX_CONTENT_LENGTH}/${POST_CONSTANTS.MAX_CONTENT_LENGTH}`
    )

    await user.paste('x')
    expect(
      screen.getByTestId(TEST_IDS.createPostForm.characterCounter)
    ).toHaveTextContent(
      `${POST_CONSTANTS.MAX_CONTENT_LENGTH}/${POST_CONSTANTS.MAX_CONTENT_LENGTH}`
    )
  })

  it('clears content input after successful submit', async () => {
    renderWithProviders(<CreatePostForm />, {
      preloadedState: authenticatedUserState
    })

    await user.type(
      screen.getByTestId(TEST_IDS.createPostForm.contentInput),
      'My new post content'
    )
    await user.click(screen.getByTestId(TEST_IDS.createPostForm.submitButton))

    await waitFor(() => {
      expect(
        screen.getByTestId(TEST_IDS.createPostForm.contentInput)
      ).toHaveValue('')
    })
  })

  it('calls onSuccess after the post is created', async () => {
    const onSuccess = vi.fn()
    renderWithProviders(<CreatePostForm onSuccess={onSuccess} />, {
      preloadedState: authenticatedUserState
    })

    await user.type(
      screen.getByTestId(TEST_IDS.createPostForm.contentInput),
      'My new post'
    )
    await user.click(screen.getByTestId(TEST_IDS.createPostForm.submitButton))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
    })
  })

  it('keeps submit disabled for whitespace-only content', async () => {
    renderWithProviders(<CreatePostForm />, {
      preloadedState: authenticatedUserState
    })

    await user.click(screen.getByTestId(TEST_IDS.createPostForm.contentInput))
    await user.paste('   ')

    expect(
      screen.getByTestId(TEST_IDS.createPostForm.submitButton)
    ).toBeDisabled()
  })
})
