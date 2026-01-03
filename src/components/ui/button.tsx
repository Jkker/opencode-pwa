import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

import { Spinner } from './spinner'

const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-lg border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost:
          'hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground',
        destructive:
          'bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        icon: 'size-8',
        'icon-xs':
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm':
          'size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>

type MaybePromise<T> = T | Promise<T>

interface PromiseButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => MaybePromise<unknown>
}

/** Button that handles async onClick with loading state and error toast */
function PromiseButton({ onClick, disabled, children, ...props }: PromiseButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      setLoading(true)
      await onClick(e)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      toast.error(error.message)
      console.error('PromiseButton error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button disabled={loading || disabled} onClick={handleClick} {...props}>
      {loading ? <Spinner /> : children}
    </Button>
  )
}

type CopyButtonData<T> = T | Promise<T> | (() => T | Promise<T>)

interface CopyButtonProps<T = string | object> extends Omit<ButtonProps, 'children'> {
  data: CopyButtonData<T>
  /** Label when not copied. Default: 'Copy'. Set to null for icon-only. */
  label?: string | null
  /** Label when copied. Default: 'Copied'. Set to null for icon-only. */
  successLabel?: string | null
  successMessage?: string
  errorMessage?: string
  stringify?: (data: unknown) => string
  /** Reset copied state after this timeout (ms). Default: 2500 */
  timeout?: number
  children?: React.ReactNode
  /** Callback when copy succeeds */
  onCopySuccess?: () => void
  /** Callback when copy fails */
  onCopyError?: (error: Error) => void
  icon?: React.ReactNode
  iconOnly?: boolean
}

const formatJson = (d: unknown) => JSON.stringify(d, null, 2)

/** Button that copies data to clipboard with loading/success states */
function CopyButton<T = string | object>({
  data,
  label = 'Copy',
  successLabel = 'Copied',
  successMessage,
  errorMessage = 'Failed to copy',
  stringify = formatJson,
  timeout = 2500,
  children,
  disabled,
  size,
  iconOnly = label === null || size?.toString().startsWith('icon'),
  onCopySuccess,
  onCopyError,
  icon = <CopyIcon />,
  ...props
}: CopyButtonProps<T>) {
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const copyToClipboard = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    try {
      let resolvedData: unknown = data

      if (typeof resolvedData === 'function') {
        resolvedData = resolvedData()
      }

      if (resolvedData instanceof Promise) {
        setIsLoading(true)
        resolvedData = await resolvedData
      }

      if (!resolvedData) throw new Error('No data to copy')
      if (typeof resolvedData === 'function') throw new TypeError('Cannot copy a function')

      const text = typeof resolvedData === 'string' ? resolvedData : stringify(resolvedData)

      await navigator.clipboard.writeText(text)
      if (successMessage) toast.success(successMessage)
      onCopySuccess?.()
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      onCopyError?.(error)
      toast.error(`${errorMessage}: ${error.message}`)
      console.error(errorMessage, e, data)
    } finally {
      setIsLoading(false)
    }
  }

  const Icon = isLoading ? Spinner : copied ? CheckIcon : CopyIcon

  return (
    <Button
      variant="ghost"
      disabled={!data || disabled}
      onClick={copyToClipboard}
      type="button"
      size={size ?? (iconOnly ? 'icon' : 'default')}
      {...props}
    >
      <Icon data-icon={iconOnly ? undefined : 'inline-start'} />
      {!iconOnly && (copied ? successLabel : (children ?? label))}
    </Button>
  )
}

export { Button, buttonVariants, PromiseButton, CopyButton }
export type { ButtonProps, PromiseButtonProps, CopyButtonProps }
