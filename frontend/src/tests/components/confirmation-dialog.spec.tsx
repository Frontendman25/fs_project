import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConfirmationDialog } from '@/shared/components/ConfirmationDialog'
import { TEST_IDS } from '@/shared/constants'

const defaultProps = {
  isOpen: true,
  title: 'Delete account',
  message: 'This action cannot be undone.',
  onClose: vi.fn(),
  onConfirm: vi.fn(),
}

describe('ConfirmationDialog', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  it('does not render dialog when closed', () => {
    render(<ConfirmationDialog {...defaultProps} isOpen={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders title and message when open', async () => {
    render(<ConfirmationDialog {...defaultProps} />)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Delete account')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('renders custom action labels', () => {
    render(
      <ConfirmationDialog
        {...defaultProps}
        confirmText="Yes, delete"
        cancelText="No, keep it"
      />
    )

    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No, keep it' })).toBeInTheDocument()
  })

  it('uses default action labels', () => {
    render(<ConfirmationDialog {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('calls onClose when close icon button is clicked', async () => {
    render(<ConfirmationDialog {...defaultProps} />)

    await user.click(screen.getByTestId(TEST_IDS.confirmationDialog.closeButton))

    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when cancel button is clicked', async () => {
    render(<ConfirmationDialog {...defaultProps} cancelText="Cancel" />)

    await user.click(screen.getByTestId(TEST_IDS.confirmationDialog.cancelButton))

    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    render(<ConfirmationDialog {...defaultProps} confirmText="Confirm" />)

    await user.click(screen.getByTestId(TEST_IDS.confirmationDialog.confirmButton))

    expect(defaultProps.onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onClose when overlay is clicked', async () => {
    render(<ConfirmationDialog {...defaultProps} />)

    await user.click(screen.getByTestId(TEST_IDS.confirmationDialog.overlay))

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('does not call onClose when panel content is clicked', async () => {
    render(<ConfirmationDialog {...defaultProps} />)

    await user.click(screen.getByTestId(TEST_IDS.confirmationDialog.panel))

    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when escape is pressed', async () => {
    render(<ConfirmationDialog {...defaultProps} />)

    await user.keyboard('{Escape}')

    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })

  it('disables action buttons when loading', () => {
    render(<ConfirmationDialog {...defaultProps} isLoading />)

    expect(screen.getByTestId(TEST_IDS.confirmationDialog.cancelButton)).toBeDisabled()
    expect(screen.getByTestId(TEST_IDS.confirmationDialog.confirmButton)).toBeDisabled()
  })

  it('renders loading text in confirm button when loading', () => {
    render(<ConfirmationDialog {...defaultProps} isLoading />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders in both destructive and non-destructive variants', () => {
    const { rerender } = render(
      <ConfirmationDialog {...defaultProps} isDestructive={false} />
    )

    expect(screen.getByText('Delete account')).toBeInTheDocument()

    rerender(<ConfirmationDialog {...defaultProps} isDestructive />)
    expect(screen.getByText('Delete account')).toBeInTheDocument()
  })
})
