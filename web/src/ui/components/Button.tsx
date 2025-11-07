import { cva, type VariantProps } from 'class-variance-authority'

const buttonStyles = cva(
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-black hover:bg-teal-300',
        ghost: 'bg-white/5 text-foreground hover:bg-white/10',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>

export function Button({ variant, className, ...props }: ButtonProps) {
  return <button className={buttonStyles({ variant, className })} {...props} />
}


