'use client'

import React, { useState, useRef, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Smile, Paperclip } from 'lucide-react'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type a message..." 
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // TODO: Replace with LiveKit typing indicators
  // TODO: Add emoji picker integration
  // TODO: Add file upload functionality
  // TODO: Add message formatting (bold, italic, etc.)
  // TODO: Add @mentions and #channels

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  const sendMessage = () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || disabled) return

    onSendMessage(trimmedMessage)
    setMessage('')
    setIsTyping(false)
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }

    // TODO: Implement typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      // Send typing start event
    } else if (!value.trim() && isTyping) {
      setIsTyping(false)
      // Send typing stop event
    }
  }

  const handleEmojiClick = () => {
    // TODO: Implement emoji picker
    console.log('Emoji picker clicked')
  }

  const handleFileUpload = () => {
    // TODO: Implement file upload
    console.log('File upload clicked')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-end space-x-2">
        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Disconnected..." : placeholder}
            disabled={disabled}
            className="min-h-[44px] max-h-[120px] resize-none pr-20 py-3"
            rows={1}
            aria-label="Message input"
          />
          
          {/* Input Actions */}
          <div className="absolute right-2 bottom-2 flex items-center space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleEmojiClick}
              disabled={disabled}
              aria-label="Add emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleFileUpload}
              disabled={disabled}
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          className="h-11 px-4"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>

      {/* Character Count and Status */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center space-x-2">
          {isTyping && (
            <span className="text-primary">Typing...</span>
          )}
          {disabled && (
            <span className="text-destructive">Disconnected</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`${message.length > 1000 ? 'text-destructive' : ''}`}>
            {message.length}/2000
          </span>
        </div>
      </div>
    </form>
  )
}