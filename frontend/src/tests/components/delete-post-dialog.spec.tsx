import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/tests/utils/render'
import { DeletePostDialog } from '@/shared/components/DeletePostDialog'
import { TEST_IDS } from '@/shared/constants'

describe('DeletePostDialog', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  it('renders trigger content without opening dialog', () => {
    const onConfirm = vi.fn()

    renderWithProviders(
      <DeletePostDialog onConfirm={onConfirm}>
        <button>Delete post</button>
      </DeletePostDialog>
    )

    expect(
      screen.getByRole('button', { name: 'Delete post' })
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId(TEST_IDS.deletePostDialog.content)
    ).not.toBeInTheDocument()
  })

  it('opens dialog when trigger is clicked', async () => {
    const onConfirm = vi.fn()

    renderWithProviders(
      <DeletePostDialog onConfirm={onConfirm}>
        <button>Delete post</button>
      </DeletePostDialog>
    )
    await user.click(screen.getByRole('button', { name: 'Delete post' }))

    expect(
      await screen.findByTestId(TEST_IDS.deletePostDialog.content)
    ).toBeInTheDocument()
  })

  it('closes dialog without confirming when cancel is clicked', async () => {
    const onConfirm = vi.fn()

    renderWithProviders(
      <DeletePostDialog onConfirm={onConfirm}>
        <button>Delete post</button>
      </DeletePostDialog>
    )

    await user.click(screen.getByRole('button', { name: 'Delete post' }))
    expect(
      await screen.findByTestId(TEST_IDS.deletePostDialog.content)
    ).toBeInTheDocument()

    await user.click(screen.getByTestId(TEST_IDS.deletePostDialog.cancelButton))

    expect(
      screen.queryByTestId(TEST_IDS.deletePostDialog.content)
    ).not.toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onConfirm and closes dialog when confirm is clicked', async () => {
    const onConfirm = vi.fn()

    renderWithProviders(
      <DeletePostDialog onConfirm={onConfirm}>
        <button>Delete post</button>
      </DeletePostDialog>
    )

    await user.click(screen.getByRole('button', { name: 'Delete post' }))
    expect(
      await screen.findByTestId(TEST_IDS.deletePostDialog.content)
    ).toBeInTheDocument()

    await user.click(
      screen.getByTestId(TEST_IDS.deletePostDialog.confirmButton)
    )

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(
      screen.queryByTestId(TEST_IDS.deletePostDialog.content)
    ).not.toBeInTheDocument()
  })

  it('disables action buttons when loading', async () => {
    const onConfirm = vi.fn()

    renderWithProviders(
      <DeletePostDialog onConfirm={onConfirm} isLoading>
        <button>Delete post</button>
      </DeletePostDialog>
    )

    await user.click(screen.getByRole('button', { name: 'Delete post' }))
    expect(
      await screen.findByTestId(TEST_IDS.deletePostDialog.content)
    ).toBeInTheDocument()

    expect(
      screen.getByTestId(TEST_IDS.deletePostDialog.cancelButton)
    ).toBeDisabled()
    expect(
      screen.getByTestId(TEST_IDS.deletePostDialog.confirmButton)
    ).toBeDisabled()
  })
})
