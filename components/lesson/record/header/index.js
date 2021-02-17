/** @jsxImportSource @emotion/react */
import React from 'react'
import Link from 'next/link'
import { css } from '@emotion/core'
import RecordingButton from './recordingButton'
import DrawingConfigPanel from './drawingConfigPanel'
import DrawingConfigButton from './drawingConfigButton'
import { useLessonRecorderContext } from '../../../../libs/contexts/lessonRecorderContext'

export default function LessonRecordHeader({ token, lessonID, isMicReady, isDrawingHide, setIsDrawingHide, enablePen, setEnablePen,
  undoDrawing, clearDrawing, drawingColor, setDrawingColor, setDrawingLineWidth, setIsShowControlPanel }) {
  const { isFinishing } = useLessonRecorderContext()

  function handleDrawingHide() {
    setIsDrawingHide(!isDrawingHide)
  }

  function handlePen() {
    setEnablePen(!enablePen)
  }

  function handleDrawingUndo() {
    undoDrawing()
  }

  function handleDrawingClear() {
    clearDrawing()
  }

  function handleSettingPanel() {
    setIsShowControlPanel(state => !state)
  }

  const settingButtonStyle = css({
    textAlign: 'right',
  })

  return (
    <header css={headerStyle} className="header-z">
      <div css={bodyStyle}>
        <div css={logoItemStyle}>
          <Link href="/">
            <a>
              <img css={logoImageStyle} src="/img/logo_white.png" srcSet="/img/logo_white.png 1x, /img/logo_white@2x.png 2x" />
            </a>
          </Link>
        </div>
        <div css={flexItemStyle}>
          <RecordingButton token={token} lessonID={lessonID} isMicReady={isMicReady} />
        </div>
        <div css={drawingButtonsLineStyle}>
          <DrawingConfigButton disabled={isFinishing} onClick={handleDrawingHide} isSelected={isDrawingHide}>
            <img src="/img/icon/hide.svg" />
          </DrawingConfigButton>
          <DrawingConfigButton disabled={isDrawingHide || isFinishing} isSelected={!isDrawingHide && enablePen} onClick={handlePen}>
            <img src="/img/icon/drawing.svg" />
          </DrawingConfigButton>
          <DrawingConfigPanel disabled={isDrawingHide || isFinishing} color={drawingColor} setColor={setDrawingColor} setLineWidth={setDrawingLineWidth}
            setEnablePen={setEnablePen} />
          <DrawingConfigButton disabled={isDrawingHide || isFinishing} onClick={handleDrawingUndo}>
            <img src="/img/icon/undo.svg" />
          </DrawingConfigButton>
          <DrawingConfigButton disabled={isDrawingHide || isFinishing} onClick={handleDrawingClear}>
            <img src="/img/icon/trash.svg" />
          </DrawingConfigButton>
        </div>
        <div css={settingButtonStyle}>
          <DrawingConfigButton  disabled={isFinishing} onClick={handleSettingPanel}>
            <img src="/img/icon/settings.svg" />
          </DrawingConfigButton>
        </div>
      </div>
    </header>
  )
}

const headerStyle = css({
  width: '100%',
  backgroundColor: 'var(--dark-gray)',
  position: 'fixed',
  top: 0,
  left: 0,
  userSelect: 'none',
})

const bodyStyle = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  maxWidth: '1280px',
  height: '77px',
  marginLeft: 'auto',
  marginRight: 'auto',
})

const logoItemStyle = css({
  width: '100%',
  textAlign: 'left1',
})

const logoImageStyle = css({
  width: '181px',
  height: '25px',
  verticalAlign: 'middle',
  marginLeft: '20px',
})

const flexItemStyle = css({
  width: '100%',
  textAlign: 'center',
})

const drawingButtonsLineStyle = css({
  width: '100%',
  textAlign: 'center',
  whiteSpace: 'nowrap',
})