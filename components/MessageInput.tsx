'use client'

import React, { useState, useRef, KeyboardEvent, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'

// Type definitions
export interface MessageInputProps {
  onSendMessage: (content: string) => void | Promise<void>
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  className?: string
  autoFocus?: boolean
  showCharacterCount?: boolean
}

/**
 * MessageInput Component
 * 
 * Provides a textarea input with send functionality:
 * - Enter to send, Shift+Enter for new lines
 * - Auto-resize textarea based on content
 * - Character limit handling with visual feedback
 * - Disabled state with visual indicators
 * - Accessible keyboard navigation
 */
export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  maxLength = 2000,
  className = '',
  autoFocus = false,
  showCharacterCount = true
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /**
   * Auto-resize textarea based on content
   */
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    
    // Set height based on scrollHeight, with min and max constraints
    const minHeight = 44 // Minimum height in pixels
    const maxHeight = 120 // Maximum height in pixels
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
    
    textarea.style.height = `${newHeight}px`
  }, [])

  /**
   * Handle input changes with auto-resize
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    
    // Enforce character limit
    if (value.length <= maxLength) {
      setMessage(value)
      // Adjust height after state update
      setTimeout(adjustTextareaHeight, 0)
    }
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendMessage()
  }

  /**
   * Send message logic with loading state
   */
  const sendMessage = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || disabled || isSending) return

    setIsSending(true)
    
    try {
      await onSendMessage(trimmedMessage)
      setMessage('')
      
      // Reset textarea height
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      }, 0)
    } catch (error) {
      console.error('Failed to send message:', error)
      // Keep the message in the input on error
    } finally {
      setIsSending(false)
      // Focus back to textarea after sending
      textareaRef.current?.focus()
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (without Shift), Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
      setMessage('')
      setTimeout(adjustTextareaHeight, 0)
    }
  }

  // Calculate character count styling
  const isNearLimit = message.length > maxLength * 0.8
  const isAtLimit = message.length >= maxLength
  const characterCountColor = isAtLimit 
    ? 'text-destructive' 
    : isNearLimit 
    ? 'text-yellow-600 dark:text-yellow-400' 
    : 'text-muted-foreground'

  const canSend = message.trim().length > 0 && !disabled && !isSending

  return (
    <div className={`space-y-2 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-end space-x-2">
          {/* Message textarea */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? "Chat is currently unavailable..." : placeholder}
              disabled={disabled || isSending}
              autoFocus={autoFocus}
              className={`min-h-[44px] max-h-[120px] resize-none py-3 pr-4 transition-all duration-200 ${
                disabled 
                  ? 'opacity-50 cursor-not-allowed bg-muted/50' 
                  : 'focus:ring-2 focus:ring-primary/20'
              } ${
                isAtLimit ? 'border-destructive focus-visible:ring-destructive' : ''
              }`}
              rows={1}
              maxLength={maxLength}
              aria-label="Message input"
              aria-describedby={showCharacterCount ? "character-count" : undefined}
              aria-invalid={isAtLimit}
            />
            
            {/* Loading indicator overlay */}
            {isSending && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-md">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>

          {/* Send button */}
          <Button
            type="submit"
            disabled={!canSend}
            className={`h-11 px-4 transition-all duration-200 ${
              canSend 
                ? 'hover:shadow-md hover:scale-105 active:scale-95' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            aria-label={isSending ? "Sending message..." : "Send message"}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isSending ? "Sending..." : "Send"}
            </span>
          </Button>
        </div>

        {/* Status bar with character count and hints */}
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center space-x-3">
            {/* Connection status */}
            {disabled && (
              <span className="text-destructive font-medium flex items-center">
                <span className="w-2 h-2 bg-destructive rounded-full mr-1.5" />
                Disconnected
              </span>
            )}
            
            {/* Sending status */}
            {isSending && (
              <span className="text-primary font-medium flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                Sending...
              </span>
            )}
            
            {/* Keyboard hints */}
            {!disabled && !isSending && (
              <span className="text-muted-foreground hidden sm:inline">
                Press Enter to send, Shift+Enter for new line
              </span>
            )}
          </div>
          
          {/* Character count */}
          {showCharacterCount && (
            <div className="flex items-center space-x-2">
              <span 
                id="character-count"
                className={`${characterCountColor} font-medium transition-colors`}
                aria-label={`${message.length} of ${maxLength} characters used`}
              >
                {message.length}/{maxLength}
              </span>
              
              {/* Warning indicator for character limit */}
              {isNearLimit && (
                <span className="w-2 h-2 rounded-full bg-current opacity-60" />
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}