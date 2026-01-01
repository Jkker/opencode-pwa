import { forwardRef, type ElementRef, type HTMLAttributes } from 'react'
import { SendHorizontal, Square, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ComposerProps extends Omit<HTMLAttributes<HTMLFormElement>, 'onChange' | 'onSubmit'> {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel?: () => void
  isLoading?: boolean
  placeholder?: string
  disabled?: boolean
}

/** Chat message composer with mobile-first design */
export const Composer = forwardRef<ElementRef<'form'>, ComposerProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      onCancel,
      isLoading,
      placeholder = 'Ask anything...',
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (isLoading && onCancel) {
        onCancel()
      } else if (value.trim() && !disabled) {
        onSubmit()
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e)
      }
    }

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn(
          'flex flex-col gap-2 p-3 bg-background border-t border-border',
          'sticky bottom-0 left-0 right-0',
          className
        )}
        {...props}
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className={cn(
                'min-h-[44px] max-h-[200px] resize-none',
                'rounded-2xl px-4 py-3 pr-12',
                'bg-muted/50 border-0 focus-visible:ring-1',
                'text-base'
              )}
              rows={1}
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full shrink-0"
              disabled={disabled}
            >
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Attach file</span>
            </Button>

            <Button
              type="submit"
              size="icon"
              className={cn(
                'h-10 w-10 rounded-full shrink-0',
                isLoading && 'bg-destructive hover:bg-destructive/90'
              )}
              disabled={disabled || (!isLoading && !value.trim())}
            >
              {isLoading ? (
                <Square className="h-4 w-4" />
              ) : (
                <SendHorizontal className="h-5 w-5" />
              )}
              <span className="sr-only">{isLoading ? 'Stop' : 'Send'}</span>
            </Button>
          </div>
        </div>
      </form>
    )
  }
)

Composer.displayName = 'Composer'
