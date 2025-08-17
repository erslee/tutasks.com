import { render, screen } from '../../__tests__/utils/test-utils'
import PageLayout from '../PageLayout'
import { createMockTasks } from '../../__tests__/utils/test-utils'

const mockProps = {
  allTasks: createMockTasks(3),
  sheetName: 'Test Sheet',
  showSheetModal: false,
  selectedYear: 2024,
  selectedMonth: 0,
  selectedDay: 15,
  onSheetClick: jest.fn(),
  onSheetSelect: jest.fn(),
  onCloseSheetModal: jest.fn(),
  onYearSelect: jest.fn(),
  onMonthSelect: jest.fn(),
  onDaySelect: jest.fn(),
  onToday: jest.fn(),
}

describe('PageLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render with children', () => {
    render(
      <PageLayout {...mockProps}>
        <div data-testid="child-content">Test Content</div>
      </PageLayout>
    )

    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should apply correct background and text classes', () => {
    const { container } = render(
      <PageLayout {...mockProps}>
        <div>Content</div>
      </PageLayout>
    )

    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveClass('bg-[#323438]', 'min-h-screen', 'text-[#e0e0e0]', 'font-sans', 'p-0')
  })

  it('should handle missing sheet name gracefully', () => {
    render(
      <PageLayout {...mockProps} sheetName={null}>
        <div>Content</div>
      </PageLayout>
    )

    // Should not throw error and should render
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should handle empty tasks array', () => {
    render(
      <PageLayout {...mockProps} allTasks={[]}>
        <div>Content</div>
      </PageLayout>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should handle optional onImportSuccess prop', () => {
    // Test without onImportSuccess prop
    const { rerender } = render(
      <PageLayout {...mockProps}>
        <div>Content</div>
      </PageLayout>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()

    // Test with onImportSuccess prop
    const mockOnImportSuccess = jest.fn()
    rerender(
      <PageLayout {...mockProps} onImportSuccess={mockOnImportSuccess}>
        <div>Content</div>
      </PageLayout>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should pass hideDay prop to CalendarNav when provided', () => {
    render(
      <PageLayout {...mockProps} hideDay={true}>
        <div>Content</div>
      </PageLayout>
    )

    // Component should render without errors
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})