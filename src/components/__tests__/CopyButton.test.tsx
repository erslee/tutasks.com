import { render, screen, fireEvent, waitFor } from '../../__tests__/utils/test-utils'
import CopyButton from '../CopyButton'

const mockTask = {
  number: 'T-001',
  description: 'Test task description',
}

describe('CopyButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render copy button with clipboard icon', () => {
    render(<CopyButton task={mockTask} />)
    
    const button = screen.getByRole('button', { name: /copy/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('📋')
  })

  it('should render with text when showText is true', () => {
    render(<CopyButton task={mockTask} showText />)
    
    const button = screen.getByRole('button', { name: /copy/i })
    expect(button).toHaveTextContent('📋 Copy')
  })

  it('should apply correct size classes', () => {
    const { rerender } = render(<CopyButton task={mockTask} size="sm" />)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('px-2', 'py-1', 'text-xs')

    rerender(<CopyButton task={mockTask} size="md" />)
    button = screen.getByRole('button')
    expect(button).toHaveClass('px-3', 'py-1', 'text-sm')

    rerender(<CopyButton task={mockTask} size="lg" />)
    button = screen.getByRole('button')
    expect(button).toHaveClass('px-4', 'py-1', 'text-base')
  })

  it('should apply custom className', () => {
    render(<CopyButton task={mockTask} className="custom-class" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should copy task to clipboard when clicked', async () => {
    const mockWriteText = navigator.clipboard.writeText as jest.Mock
    
    render(<CopyButton task={mockTask} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockWriteText).toHaveBeenCalledWith('T-001 - Test task description')
  })

  it('should show "Copied!" feedback after clicking', async () => {
    render(<CopyButton task={mockTask} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(button).toHaveTextContent('Copied!')
    
    // Wait for the timeout to restore original content
    await waitFor(() => {
      expect(button).toHaveTextContent('📋')
    }, { timeout: 1100 })
  })

  it('should show "Copied!" feedback with text when showText is true', async () => {
    render(<CopyButton task={mockTask} showText />)
    
    const button = screen.getByRole('button')
    const originalContent = button.innerHTML
    
    fireEvent.click(button)
    
    expect(button).toHaveTextContent('Copied!')
    
    // Wait for the timeout to restore original content
    await waitFor(() => {
      expect(button.innerHTML).toBe(originalContent)
    }, { timeout: 1100 })
  })

  it('should call onClick callback when provided', () => {
    const mockOnClick = jest.fn()
    
    render(<CopyButton task={mockTask} onClick={mockOnClick} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
    expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object))
  })

  it('should prevent event propagation', () => {
    const mockParentClick = jest.fn()
    
    render(
      <div onClick={mockParentClick}>
        <CopyButton task={mockTask} />
      </div>
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockParentClick).not.toHaveBeenCalled()
  })

  it('should have proper accessibility attributes', () => {
    render(<CopyButton task={mockTask} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Copy task number and description')
  })

  it('should handle clipboard API not being available', () => {
    // Temporarily remove clipboard API
    const originalClipboard = navigator.clipboard
    // @ts-expect-error - Intentionally deleting clipboard for testing
    delete navigator.clipboard
    
    render(<CopyButton task={mockTask} />)
    
    const button = screen.getByRole('button')
    // Should not throw error
    expect(() => fireEvent.click(button)).not.toThrow()
    
    // Restore clipboard
    navigator.clipboard = originalClipboard
  })
})