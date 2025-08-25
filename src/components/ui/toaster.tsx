"use client"

import * as React from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"
import { useToast } from "./toast"

// Simple memoized toast item component to prevent unnecessary re-renders
const ToastItem = React.memo(function ToastItem({
  id,
  title,
  description,
  ...props
}: {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  [key: string]: any
}) {
  return (
    <Toast key={id} {...props}>
      <div className="grid gap-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && (
          <ToastDescription>{description}</ToastDescription>
        )}
      </div>
      <ToastClose />
    </Toast>
  )
})

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, ...props }) {
        return (
          <ToastItem
            key={id}
            id={id}
            title={title}
            description={description}
            {...props}
          />
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
