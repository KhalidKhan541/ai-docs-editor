'use client'

import React, { useState } from 'react'

interface AIMenuProps {
  selectedText?: string
  onRewrite?: (tone: string) => void
  onContinue?: () => void
  onSummarize?: () => void
  onExpand?: () => void
  onFixGrammar?: () => void
  onChangeTone?: (tone: string) => void
  onTranslate?: (language: string) => void
  onClose?: () => void
}

const TONES = ['formal', 'casual', 'academic', 'creative', 'concise', 'detailed']
const LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
]

export function AIMenu({
  selectedText,
  onRewrite,
  onContinue,
  onSummarize,
  onExpand,
  onFixGrammar,
  onChangeTone,
  onTranslate,
  onClose,
}: AIMenuProps) {
  const [activeTab, setActiveTab] = useState<'rewrite' | 'tools' | 'translate'>('rewrite')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAction = async (action: () => void) => {
    setIsProcessing(true)
    try {
      action()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="ai-menu" data-testid="ai-menu">
      <div className="ai-menu-header">
        <span>AI Assistant</span>
        <button onClick={onClose} data-testid="ai-menu-close" aria-label="Close AI menu">
          ×
        </button>
      </div>

      <div className="ai-menu-tabs">
        <button
          className={activeTab === 'rewrite' ? 'active' : ''}
          onClick={() => setActiveTab('rewrite')}
          data-testid="ai-tab-rewrite"
        >
          Rewrite
        </button>
        <button
          className={activeTab === 'tools' ? 'active' : ''}
          onClick={() => setActiveTab('tools')}
          data-testid="ai-tab-tools"
        >
          Tools
        </button>
        <button
          className={activeTab === 'translate' ? 'active' : ''}
          onClick={() => setActiveTab('translate')}
          data-testid="ai-tab-translate"
        >
          Translate
        </button>
      </div>

      <div className="ai-menu-content">
        {activeTab === 'rewrite' && (
          <div data-testid="ai-rewrite-panel">
            <div className="ai-section">
              <div className="ai-section-title">Rewrite as</div>
              <div className="ai-tone-grid">
                {TONES.map((tone) => (
                  <button
                    key={tone}
                    onClick={() => handleAction(() => onRewrite?.(tone))}
                    disabled={isProcessing}
                    data-testid={`ai-tone-${tone}`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>
            <div className="ai-section">
              <div className="ai-section-title">Adjust tone</div>
              <div className="ai-tone-grid">
                {TONES.map((tone) => (
                  <button
                    key={`tone-${tone}`}
                    onClick={() => handleAction(() => onChangeTone?.(tone))}
                    disabled={isProcessing}
                    data-testid={`ai-change-tone-${tone}`}
                  >
                    → {tone}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div data-testid="ai-tools-panel">
            <button
              onClick={() => handleAction(() => onContinue?.())}
              disabled={isProcessing || !selectedText}
              data-testid="ai-continue"
            >
              Continue writing
            </button>
            <button
              onClick={() => handleAction(() => onSummarize?.())}
              disabled={isProcessing || !selectedText}
              data-testid="ai-summarize"
            >
              Summarize
            </button>
            <button
              onClick={() => handleAction(() => onExpand?.())}
              disabled={isProcessing || !selectedText}
              data-testid="ai-expand"
            >
              Expand
            </button>
            <button
              onClick={() => handleAction(() => onFixGrammar?.())}
              disabled={isProcessing || !selectedText}
              data-testid="ai-fix-grammar"
            >
              Fix grammar
            </button>
          </div>
        )}

        {activeTab === 'translate' && (
          <div data-testid="ai-translate-panel">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleAction(() => onTranslate?.(lang.code))}
                disabled={isProcessing || !selectedText}
                data-testid={`ai-translate-${lang.code}`}
              >
                Translate to {lang.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="ai-processing" data-testid="ai-processing">
          Processing...
        </div>
      )}
    </div>
  )
}
