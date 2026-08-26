'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader, TextEditor } from '@machi-asia/ui'

const START_HTML =
  '<h2>Release notes</h2><p>This editor supports <b>bold</b>, <i>italic</i>, <u>underline</u>, <s>strikethrough</s>, headings, quotes and lists.</p><blockquote>Try the quote button — it is fully keyboard and mobile-keyboard friendly.</blockquote><ul><li>Type anywhere</li><li>Select text then tap a tool</li></ul>'

export default function TextEditorPage() {
  const [html, setHtml] = useState(START_HTML)

  return (
    <>
      <div className="pg-hero">
        <h1>Text Editor</h1>
        <p>A dependency-free rich text editor. The toolbar keeps your selection while you tap tools; active states track the cursor.</p>
      </div>

      <section className="pg-section">
        <h2>Controlled editor (outline)</h2>
        <TextEditor value={html} onChange={setHtml} minHeight={220} />
      </section>

      <section className="pg-section">
        <h2>Variants</h2>
        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <p style={{ margin: '0 0 8px', color: 'var(--mui-text-muted)', fontSize: '.85rem' }}>variant=&quot;filled&quot;</p>
            <TextEditor variant="filled" placeholder="Filled background…" defaultValue="" minHeight={110} />
          </div>
          <div>
            <p style={{ margin: '0 0 8px', color: 'var(--mui-text-muted)', fontSize: '.85rem' }}>variant=&quot;borderless&quot; · toolbar=false</p>
            <TextEditor variant="borderless" toolbar={false} placeholder="Just type…" minHeight={90} />
          </div>
        </div>
      </section>

      <section className="pg-section">
        <h2>Current HTML output</h2>
        <Card padding="sm">
          <CardBody>
            <code style={{ fontSize: '.8rem', wordBreak: 'break-all', lineHeight: 1.6 }}>{html || '(empty)'}</code>
          </CardBody>
        </Card>
      </section>
    </>
  )
}
