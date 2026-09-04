import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SlashMenu } from '@/components/editor/slash-menu'

describe('SlashMenu', () => {
  const defaultProps = {
    onSelect: jest.fn(),
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the slash menu', () => {
    render(<SlashMenu {...defaultProps} />)
    expect(screen.getByTestId('slash-menu')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<SlashMenu {...defaultProps} />)
    expect(screen.getByTestId('slash-menu-search')).toBeInTheDocument()
  })

  it('renders command list', () => {
    render(<SlashMenu {...defaultProps} />)
    expect(screen.getByTestId('slash-command-heading')).toBeInTheDocument()
    expect(screen.getByTestId('slash-command-bullet-list')).toBeInTheDocument()
    expect(screen.getByTestId('slash-command-code')).toBeInTheDocument()
  })

  it('filters commands by query', () => {
    render(<SlashMenu {...defaultProps} />)
    fireEvent.change(screen.getByTestId('slash-menu-search'), {
      target: { value: 'heading' },
    })
    expect(screen.getByTestId('slash-command-heading')).toBeInTheDocument()
    expect(screen.queryByTestId('slash-command-code')).not.toBeInTheDocument()
  })

  it('calls onSelect when command clicked', () => {
    render(<SlashMenu {...defaultProps} />)
    fireEvent.click(screen.getByTestId('slash-command-heading'))
    expect(defaultProps.onSelect).toHaveBeenCalledWith('heading')
  })

  it('calls onClose on Escape key', () => {
    render(<SlashMenu {...defaultProps} />)
    fireEvent.keyDown(screen.getByTestId('slash-menu'), { key: 'Escape' })
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('navigates with arrow keys', () => {
    render(<SlashMenu {...defaultProps} />)
    const menu = screen.getByTestId('slash-menu')
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    fireEvent.keyDown(menu, { key: 'Enter' })
    expect(defaultProps.onSelect).toHaveBeenCalled()
  })

  it('shows empty message for no matches', () => {
    render(<SlashMenu {...defaultProps} />)
    fireEvent.change(screen.getByTestId('slash-menu-search'), {
      target: { value: 'zzzznonexistent' },
    })
    expect(screen.getByTestId('slash-menu-empty')).toBeInTheDocument()
  })

  it('groups commands by category', () => {
    render(<SlashMenu {...defaultProps} />)
    expect(screen.getByText('basic')).toBeInTheDocument()
    expect(screen.getByText('media')).toBeInTheDocument()
    expect(screen.getByText('ai')).toBeInTheDocument()
  })

  it('renders command icons and descriptions', () => {
    render(<SlashMenu {...defaultProps} />)
    const headingItem = screen.getByTestId('slash-command-heading')
    expect(headingItem).toHaveTextContent('Heading')
    expect(headingItem).toHaveTextContent('Add a heading')
  })

  it('applies position style', () => {
    render(<SlashMenu {...defaultProps} position={{ x: 100, y: 200 }} />)
    const menu = screen.getByTestId('slash-menu')
    expect(menu).toHaveStyle({ left: 100, top: 200 })
  })

  it('navigates up and down correctly', () => {
    render(<SlashMenu {...defaultProps} />)
    const menu = screen.getByTestId('slash-menu')
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    fireEvent.keyDown(menu, { key: 'Enter' })
    expect(defaultProps.onSelect).toHaveBeenCalled()
  })

  it('renders all slash commands', () => {
    render(<SlashMenu {...defaultProps} />)
    expect(screen.getByTestId('slash-command-heading')).toBeInTheDocument()
    expect(screen.getByTestId('slash-command-bullet-list')).toBeInTheDocument()
    expect(screen.getByTestId('slash-command-numbered-list')).toBeInTheDocument()
    expect(screen.getByTestId('slash-command-todo')).toBeInTheDocument()
    expect(screen.getByTestId('slash-command-quote')).toBeInTheDocument()
    expect(screen.getByTestId('slash-command-code')).toBeInTheDocument()
    expect(screen.getByTestId('slash-command-divider')).toBeInTheDocument()
    expect(screen.getByTestId('slash-command-image')).toBeInTheDocument()
    expect(screen.getByTestId('slash-command-table')).toBeInTheDocument()
  })

  it('searches by alias', () => {
    render(<SlashMenu {...defaultProps} />)
    fireEvent.change(screen.getByTestId('slash-menu-search'), {
      target: { value: 'h1' },
    })
    expect(screen.getByTestId('slash-command-heading')).toBeInTheDocument()
  })

  it('searches by description', () => {
    render(<SlashMenu {...defaultProps} />)
    fireEvent.change(screen.getByTestId('slash-menu-search'), {
      target: { value: 'horizontal' },
    })
    expect(screen.getByTestId('slash-command-divider')).toBeInTheDocument()
  })
})
