import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AICoachProps {
  courseId: number
  moduleIndex: number
}

export function AICoach({ courseId, moduleIndex }: AICoachProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (scrollViewportRef.current) {
      const viewport = scrollViewportRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim()
    }

    // Add user message immediately
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          course_id: courseId,
          module_index: moduleIndex,
          messages: [...messages, userMessage]
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      let assistantMessage = ''
      let buffer = ''

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        // Decode the chunk
        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE messages (split by double newline)
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || '' // Keep incomplete message in buffer

        for (const part of parts) {
          if (!part.trim()) continue

          const lines = part.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6) // Remove 'data: ' prefix

              if (data === '[DONE]') {
                continue
              }

              // Check if it's an error
              if (data.startsWith('{')) {
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.error) {
                    console.error('Stream error:', parsed.error)
                    continue
                  }
                } catch {
                  // Not JSON, treat as text
                }
              }

              // Unescape newlines and append token to assistant message
              const unescapedData = data.replace(/\\n/g, '\n').replace(/\\r/g, '\r')
              assistantMessage += unescapedData

              // Update the last message (assistant's response)
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantMessage
                }
                return updated
              })

              // Scroll to bottom during streaming
              scrollToBottom()
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted')
      } else {
        console.error('Error streaming response:', error)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }])
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="border rounded-lg bg-white flex flex-col h-[600px]">
      {/* Header */}
      <div className="border-b p-4 bg-accent/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-full bg-primary text-white">
            <Bot className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold">AI Learning Coach</h3>
            <p className="text-sm text-muted-foreground">
              Ask me anything about this module
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollViewportRef}>
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Bot className="size-12 mx-auto mb-4 opacity-20" />
            <p>Start a conversation to learn more about this topic</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center justify-center size-8 rounded-full bg-primary text-white flex-shrink-0">
                    <Bot className="size-4" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-accent/10 text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="flex items-center justify-center size-8 rounded-full bg-accent text-foreground flex-shrink-0">
                    <User className="size-4" />
                  </div>
                )}
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-3">
                <div className="bg-accent/10 rounded-lg px-4 py-2">
                  <Loader2 className="size-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask a question about this module..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isStreaming}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="size-[60px] flex-shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
