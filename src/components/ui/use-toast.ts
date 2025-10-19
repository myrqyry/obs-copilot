import { useToast, toast as _toast } from './toast'

// Re-export both named utilities to preserve existing import paths in the codebase
export const toast = _toast
export { useToast }

export default useToast
