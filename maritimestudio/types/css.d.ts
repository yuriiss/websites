import 'react';

// Allow CSS custom properties (e.g. --d for reveal delays) in style objects.
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
