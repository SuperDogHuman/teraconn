/** @jsxImportSource @emotion/react */
import React, { useRef } from 'react'
import { css } from '@emotion/core'
import { Container, Row, Col } from 'react-grid-system'
import useImageUploader from '../../../../libs/hooks/lesson/record/useImageUploader'
import useImageController from '../../../../libs/hooks/lesson/record/useImageController'
import ImageUploadingWideButton from './imageUploadingWideButton'
import ImageUploadingButton from './imageUploadingButton'
import ScrollArrow from './scrollArrow'
import SelectorThumbnail from './selectorThumbnail'
import DragSwappable from '../../../dragSwappable'

export default function LessonRecordImageController({ token, setSelectedImage, setRecord, hasDragOver }) {
  const inputFileRef = useRef(null)
  const selectImageBarRef = useRef(null)
  const { imageID, selectImage, removeImage, images, setImages, moveImage } = useImageController(setSelectedImage, setRecord)
  const { handleDragOver, handleDragLeave, handleDrop, handleChangeFile, handleUploadButtonClick } =
    useImageUploader(token, images, setImages, inputFileRef, selectImageBarRef)

  return (
    <div css={bodyStyle}>
      <div css={controllerStyle}>
        <input type="file" accept="image/jpeg,image/png,image/gif,image/svg+xml" multiple={true}
          onChange={handleChangeFile} css={inputFileStyle} ref={inputFileRef} />

        {images.length === 0 && (
          <ImageUploadingWideButton hasDragOver={hasDragOver} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            onDrop={handleDrop} onClick={handleUploadButtonClick} />
        )}

        {images.length > 0 && (
          <Container fluid>
            <Row>
              <Col sm={1}></Col>
              <Col sm={1} css={centeringStyle}>
                <ScrollArrow direction="left" targetRef={selectImageBarRef} />
              </Col>
              <Col sm={8}>
                <DragSwappable onSwap={moveImage} css={selectImageBarStyle} ref={selectImageBarRef}>
                  {images.map((image, i) =>
                    <SelectorThumbnail image={image} key={i} onClick={selectImage} onRemoveClick={removeImage} isSelected={image.id === imageID} />
                  )}
                </DragSwappable>
              </Col>
              <Col sm={1} css={centeringStyle}>
                <ScrollArrow direction="right" targetRef={selectImageBarRef} />
              </Col>
              <Col sm={1} css={centeringStyle}>
                <ImageUploadingButton onClick={handleUploadButtonClick} />
              </Col>
            </Row>
          </Container>
        )}
      </div>
    </div>
  )
}

const bodyStyle = css({
  width: '100%',
  height: '120px',
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
})

const controllerStyle = css({
  maxWidth: '1280px',
  height: '100%',
  margin: 'auto',
})

const inputFileStyle = css({
  display: 'none',
})

const centeringStyle = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  height: '120px',
})

const selectImageBarStyle =css({
  overflowX: 'scroll',
  ['&::-webkit-scrollbar']: {
    display: 'none',
  },
  scrollbarWidth: 'none',
  display: 'flex',
  scrollBehavior: 'auto', // smoothにするとChromeでJSからのscrollが動かなくなる
  flexDirection: 'row',
  alignItems: 'center',
  height: '120px',
})