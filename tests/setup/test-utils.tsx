import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Custom render function for React components
 * 
 * This wrapper allows adding providers, contexts, or other setup
 * that should be common across all component tests.
 */

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add custom options here if needed
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions,
) {
  // Wrapper component for providers (if needed)
  // const Wrapper = ({ children }: { children: React.ReactNode }) => {
  //   return <>{children}</>;
  // };

  return render(ui, { ...options });
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
