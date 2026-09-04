import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { EditorToolbar } from '@/components/editor/editor-toolbar'

describe('EditorToolbar', () => {
  const defaultProps = {
    onBold: jest.fn(),
    onItalic: jest.fn(),
    onUnderline: jest.fn(),
    onCode: jest.fn(),
    onLink: jest.fn(),
    onHeading: jest.fn(),
    onBulletList: jest.fn(),
    onNumberedList: jest.fn(),
    onTodo: jest.fn(),
    onQuote: jest.fn(),
    onUndo: jest.fn(),
    onRedo: jest.fn(),
    onExport: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the toolbar', () => {
    render(<EditorToolbar />)
    expect(screen.getByTestId('editor-toolbar')).toBeInTheDocument()
  })

  it('renders formatting buttons', () => {
    render(<EditorToolbar />)
    expect(screen.getByTestId('bold-button')).toBeInTheDocument()
    expect(screen.getByTestId('italic-button')).toBeInTheDocument()
    expect(screen.getByTestId('underline-button')).toBeInTheDocument()
    expect(screen.getByTestId('code-button')).toBeInTheDocument()
    expect(screen.getByTestId('link-button')).toBeInTheDocument()
  })

  it('calls onBold when bold button clicked', () => {
    render(<EditorToolbar onBold={defaultProps.onBold} />)
    fireEvent.click(screen.getByTestId('bold-button'))
    expect(defaultProps.onBold).toHaveBeenCalledTimes(1)
  })

  it('calls onItalic when italic button clicked', () => {
    render(<EditorToolbar onItalic={defaultProps.onItalic} />)
    fireEvent.click(screen.getByTestId('italic-button'))
    expect(defaultProps.onItalic).toHaveBeenCalledTimes(1)
  })

  it('calls onUnderline when underline button clicked', () => {
    render(<EditorToolbar onUnderline={defaultProps.onUnderline} />)
    fireEvent.click(screen.getByTestId('underline-button'))
    expect(defaultProps.onUnderline).toHaveBeenCalledTimes(1)
  })

  it('calls onUndo when undo button clicked', () => {
    render(<EditorToolbar onUndo={defaultProps.onUndo} />)
    fireEvent.click(screen.getByTestId('undo-button'))
    expect(defaultProps.onUndo).toHaveBeenCalledTimes(1)
  })

  it('calls onRedo when redo button clicked', () => {
    render(<EditorToolbar onRedo={defaultProps.onRedo} />)
    fireEvent.click(screen.getByTestId('redo-button'))
    expect(defaultProps.onRedo).toHaveBeenCalledTimes(1)
  })

  it('calls onHeading when heading level changed', () => {
    render(<EditorToolbar onHeading={defaultProps.onHeading} />)
    fireEvent.change(screen.getByTestId('heading-select'), {
      target: { value: '2' },
    })
    expect(defaultProps.onHeading).toHaveBeenCalledWith(2)
  })

  it('calls onBulletList when bullet list clicked', () => {
    render(<EditorToolbar onBulletList={defaultProps.onBulletList} />)
    fireEvent.click(screen.getByTestId('bullet-list-button'))
    expect(defaultProps.onBulletList).toHaveBeenCalledTimes(1)
  })

  it('calls onNumberedList when numbered list clicked', () => {
    render(<EditorToolbar onNumberedList={defaultProps.onNumberedList} />)
    fireEvent.click(screen.getByTestId('numbered-list-button'))
    expect(defaultProps.onNumberedList).toHaveBeenCalledTimes(1)
  })

  it('calls onTodo when todo clicked', () => {
    render(<EditorToolbar onTodo={defaultProps.onTodo} />)
    fireEvent.click(screen.getByTestId('todo-button'))
    expect(defaultProps.onTodo).toHaveBeenCalledTimes(1)
  })

  it('calls onQuote when quote clicked', () => {
    render(<EditorToolbar onQuote={defaultProps.onQuote} />)
    fireEvent.click(screen.getByTestId('quote-button'))
    expect(defaultProps.onQuote).toHaveBeenCalledTimes(1)
  })

  it('calls onExport when export clicked', () => {
    render(<EditorToolbar onExport={defaultProps.onExport} />)
    fireEvent.click(screen.getByTestId('export-button'))
    expect(defaultProps.onExport).toHaveBeenCalledTimes(1)
  })

  it('highlights active formats', () => {
    render(<EditorToolbar activeFormats={['bold', 'italic']} />)
    expect(screen.getByTestId('bold-button')).toHaveClass('active')
    expect(screen.getByTestId('italic-button')).toHaveClass('active')
    expect(screen.getByTestId('underline-button')).not.toHaveClass('active')
  })

  it('sets aria-pressed on active formats', () => {
    render(<EditorToolbar activeFormats={['bold']} />)
    expect(screen.getByTestId('bold-button')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('italic-button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders read-only mode with only export button', () => {
    render(<EditorToolbar isReadOnly onExport={defaultProps.onExport} />)
    expect(screen.getByTestId('export-button')).toBeInTheDocument()
    expect(screen.queryByTestId('bold-button')).not.toBeInTheDocument()
  })

  it('renders list buttons', () => {
    render(<EditorToolbar />)
    expect(screen.getByTestId('bullet-list-button')).toBeInTheDocument()
    expect(screen.getByTestId('numbered-list-button')).toBeInTheDocument()
    expect(screen.getByTestId('todo-button')).toBeInTheDocument()
    expect(screen.getByTestId('quote-button')).toBeInTheDocument()
  })

  it('has proper aria labels', () => {
    render(<EditorToolbar />)
    expect(screen.getByLabelText('Bold')).toBeInTheDocument()
    expect(screen.getByLabelText('Italic')).toBeInTheDocument()
    expect(screen.getByLabelText('Underline')).toBeInTheDocument()
    expect(screen.getByLabelText('Undo')).toBeInTheDocument()
    expect(screen.getByLabelText('Redo')).toBeInTheDocument()
  })
})
