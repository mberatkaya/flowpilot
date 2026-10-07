import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('Application bootstrap', () => {
  it('renders the application in the React test environment', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'FlowPilot', level: 1 })).toBeVisible()
  })
})
