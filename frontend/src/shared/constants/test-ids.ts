export const TEST_IDS = {
  loginForm: {
    usernameInput: 'login-form-username-input',
    passwordInput: 'login-form-password-input',
    submitButton: 'login-form-submit-button',
    switchButton: 'login-form-switch-button',
    authError: 'login-form-auth-error'
  },
  registerForm: {
    nameInput: 'register-form-name-input',
    emailInput: 'register-form-email-input',
    passwordInput: 'register-form-password-input',
    confirmPasswordInput: 'register-form-confirm-password-input',
    submitButton: 'register-form-submit-button',
    switchButton: 'register-form-switch-button',
    authError: 'register-form-auth-error'
  },
  createPostForm: {
    authError: 'create-post-auth-error',
    contentInput: 'create-post-content-input',
    submitButton: 'create-post-submit-button',
    characterCounter: 'create-post-character-counter'
  },
  confirmationDialog: {
    overlay: 'confirmation-dialog-overlay',
    panel: 'confirmation-dialog-panel',
    closeButton: 'confirmation-dialog-close-button',
    cancelButton: 'confirmation-dialog-cancel-button',
    confirmButton: 'confirmation-dialog-confirm-button'
  },
  deletePostDialog: {
    content: 'delete-post-dialog-content',
    cancelButton: 'delete-post-dialog-cancel-button',
    confirmButton: 'delete-post-dialog-confirm-button'
  }
} as const
