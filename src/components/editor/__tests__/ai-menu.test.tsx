import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AIMenu } from '@/components/editor/ai-menu'

describe('AIMenu', () => {
  const defaultProps = {
    selectedText: 'Hello world',
    onRewrite: jest.fn(),
    onContinue: jest.fn(),
    onSummarize: jest.fn(),
    onExpand: jest.fn(),
    onFixGrammar: jest.fn(),
    onChangeTone: jest.fn(),
    onTranslate: jest.fn(),
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the AI menu', () => {
    render(<AIMenu {...defaultProps} />)
    expect(screen.getByTestId('ai-menu')).toBeInTheDocument()
  })

  it('renders header with title', () => {
    render(<AIMenu {...defaultProps} />)
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
  })

  it('renders tabs', () => {
    render(<AIMenu {...defaultProps} />)
    expect(screen.getByTestId('ai-tab-rewrite')).toBeInTheDocument()
    expect(screen.getByTestId('ai-tab-tools')).toBeInTheDocument()
    expect(screen.getByTestId('ai-tab-translate')).toBeInTheDocument()
  })

  it('shows rewrite panel by default', () => {
    render(<AIMenu {...defaultProps} />)
    expect(screen.getByTestId('ai-rewrite-panel')).toBeInTheDocument()
  })

  it('shows tools panel when tools tab clicked', () => {
    render(<AIMenu {...defaultProps} />)
    fireEvent.click(screen.getByTestId('ai-tab-tools'))
    expect(screen.getByTestId('ai-tools-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('ai-rewrite-panel')).not.toBeInTheDocument()
  })

  it('shows translate panel when translate tab clicked', () => {
    render(<AIMenu {...defaultProps} />)
    fireEvent.click(screen.getByTestId('ai-tab-translate'))
    expect(screen.getByTestId('ai-translate-panel')).toBeInTheDocument()
  })

  it('calls onRewrite with tone', () => {
    render(<AIMenu {...defaultProps} />)
    fireEvent.click(screen.getByTestId('ai-tone-formal'))
    expect(defaultProps.onRewrite).toHaveBeenCalledWith('formal')
  })

  it('calls onChangeTone', () => {
    render(<AIMenu {...defaultProps} />)
    fireEvent.click(screen.getByTestId('ai-change-tone-casual'))
    expect(defaultProps.onChangeTone).toHaveBeenCalledWith('casual')
  })

  it('calls onContinue', () => {
    render(<AIMenu {...defaultProps} />)
    fireEvent.click(screen.getByTestId('ai-tab-tools'))
    fireEvent.click(screen.getByTestId('ai-continue'))
    expect(defaultProps.onContinue).toHaveBeenCalledTimes(1)
  })

  it('calls onSummarize', () => {
    render(<AIMenu {...defaultProps} />)
    fireEvent.click(screen.getByTestId('ai-tab-tools'))
    fireEvent.click(screen.getByTestId('ai-summarize'))
    expect(defaultProps.onSummarize).toHaveBeenCalledTimes(1)
  })

  it('calls onExpand', () => {
    render(<AIMenu {...defaultProps} />)
    fireEvent.click(screen.getByTestId('ai-tab-tools'))
    fireEvent.click(screen.getByTestId('ai-expand'))
    expect(defaultProps.onExpand).toHaveBeenCalledTimes(1)
  })

  it('calls onFixGrammar', () => {
    render(<AIMenu {...defaultProps} />)
    fireEvent.click(screen.getByTestId('ai-tab-tools'))
    fireEvent.click(screen.getByTestId('ai-fix-grammar'))
    expect(defaultProps.onFixGrammar).toHaveBeenCalledTimes(1)
  })

  it('calls onTranslate', () => {
    render(<AIMenu {...defaultProps} />)
    fireEvent.click(screen.getByTestId('ai-tab-translate'))
    fireEvent.click(screen.getByTestId('ai-translate-es'))
    expect(defaultProps.onTranslate).toHaveBeenCalledWith('es')
  })

  it('calls onClose when close clicked', () => {
    render(<AIMenu {...defaultProps} />)
    fireEvent.click(screen.getByTestId('ai-menu-close'))
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('disables tools when no selected text', () => {
    render(<AIMenu {...defaultProps} selectedText="" />)
    fireEvent.click(screen.getByTestId('ai-tab-tools'))
    expect(screen.getByTestId('ai-continue')).toBeDisabled()
    expect(screen.getByTestId('ai-summarize')).toBeDisabled()
  })

  it('renders all tone buttons', () => {
    render(<AIMenu {...defaultProps} />)
    expect(screen.getByTestId('ai-tone-formal')).toBeInTheDocument()
    expect(screen.getByTestId('ai-tone-casual')).toBeInTheDocument()
    expect(screen.getByTestId('ai-tone-academic')).toBeInTheDocument()
    expect(screen.getByTestId('ai-tone-creative')).toBeInTheDocument()
    expect(screen.getByTestId('ai-tone-concise')).toBeInTheDocument()
    expect(screen.getByTestId('ai-tone-detailed')).toBeInTheDocument()
  })

  it('renders translate languages', () => {
    render(<AIMenu {...defaultProps} />)
    fireEvent.click(screen.getByTestId('ai-tab-translate'))
    expect(screen.getByTestId('ai-translate-es')).toBeInTheDocument()
    expect(screen.getByTestId('ai-translate-fr')).toBeInTheDocument()
    expect(screen.getByTestId('ai-translate-de')).toBeInTheDocument()
    expect(screen.getByTestId('ai-translate-ja')).toBeInTheDocument()
    expect(screen.getByTestId('ai-translate-zh')).toBeInTheDocument()
  })
})
