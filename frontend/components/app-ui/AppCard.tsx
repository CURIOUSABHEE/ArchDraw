import { HTMLAttributes, forwardRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface AppCardProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section';
}

const AppCard = forwardRef<HTMLDivElement, AppCardProps>(
  ({ className, as: Component = 'div', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
);
AppCard.displayName = 'AppCard';

const AppCardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardHeader
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
AppCardHeader.displayName = 'AppCardHeader';

const AppCardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <CardTitle
    ref={ref}
    className={cn('text-xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
AppCardTitle.displayName = 'AppCardTitle';

const AppCardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <CardDescription
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
AppCardDescription.displayName = 'AppCardDescription';

const AppCardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardContent ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
AppCardContent.displayName = 'AppCardContent';

const AppCardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardFooter
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
AppCardFooter.displayName = 'AppCardFooter';

export {
  AppCard,
  AppCardHeader,
  AppCardFooter,
  AppCardTitle,
  AppCardDescription,
  AppCardContent,
};
