import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ReactTooltip from 'react-tooltip'
import VoiceText from './voiceText'
import LessonController from '../shared/components/lessonController'
import LessonMaterialLoader from './lessonMaterialLoader'
import ModalWindow from '../shared/components/modalWindow'
import {
    fetchLesson,
    fetchRawLessonMaterial,
    fetchAvatarObjectURL,
    fetchVoiceTexts,
    deleteLesson,
    updateLesson,
    uploadMaterial,
    packMaterial
} from '../common/networkManager'
import * as Const from '../common/constants'

const loadingLessonError = '授業の読み込みに失敗しました'
const publishingLessonError = '授業の公開に失敗しました'
const deletionDoneTitle = '授業を削除しました'
const deletionErrorTitle = '授業の削除に失敗しました'

export default class LessonEditor extends React.Component {
    constructor(props) {
        super(props)

        this.lessonID = props.match.params.id

        this.state = {
            isLoading: true,
            isUpdating: false,
            isGraphicLoaded: false,
            isTextVoiceLoaded: false,
            avatar: null,
            lesson: {},
            durationSec: 0,
            isPublic: false,
            timelines: [],
            poseKey: {},
            faceKey: {},
            isModalOpen: false,
            isErrorModal: false,
            modalTitle: '',
            modalMessage: '',
            modalCloseCallback: () => {}
        }

        this.loader = new LessonMaterialLoader(this.lessonID)
    }

    async componentDidMount() {
        this.loadMaterials().catch(err => {
            this.openModal(loadingLessonError, err)
        })
    }

    async componentDidUpdate() {
        if (!this.state.isLoading) return

        if (this.state.isGraphicLoaded && this.state.isTextVoiceLoaded) {
            const timelines = await this.loader.fetchVoiceURLsToTimelines(
                this.lessonID,
                this.state.timelines
            )
            this.setState({ isLoading: false, timelines: timelines })
        }
    }

    async loadMaterials() {
        await this.loadLesson()

        if (this.state.lesson.isPacked) {
            // lesson has been published.
            this.setState({ isTextVoiceLoaded: true, isGraphicLoaded: true })
            this.props.history.push(`/${this.lessonID}`) // FIXME, should editable twice the lesson
            return
        }

        await this.loadRawMaterial()
        await this.loadAvatar()

        await this.setGraphicToTimeline()
        await this.setVoiceTextToTimeline()
    }

    async loadLesson() {
        const lesson = await fetchLesson(this.lessonID)
        this.setState({ lesson: lesson })
    }

    async loadRawMaterial() {
        const material = await fetchRawLessonMaterial(this.lessonID)
        this.setState({
            durationSec: material.durationSec,
            timelines: material.timelines,
            poseKey: material.poseKey,
            faceKey: material.faceKey
        })
    }

    async loadAvatar() {
        const avatarObjectURL = await fetchAvatarObjectURL(
            this.state.lesson.avatar
        )
        const avatar = await this.loader.loadAvatar(
            avatarObjectURL,
            this.playerContainer,
            this.playerElement
        )
        this.setState({ avatar: avatar })
    }

    async setGraphicToTimeline() {
        const allGraphicInitCount = this.state.timelines.filter(t => {
            return t.graphics
        }).length

        if (allGraphicInitCount == 0) {
            this.setState({ isGraphicLoaded: true })
            return
        }

        const timelines = await this.loader.fetchAndMergeGraphicToTimeline(
            this.state.lesson.graphics,
            this.state.timelines
        )
        this.setState({ timelines: timelines, isGraphicLoaded: true })
    }

    async setVoiceTextToTimeline() {
        const allVoiceInitCount = this.state.timelines.filter(t => {
            return t.voice.id != ''
        }).length // id has blank when not voice.

        if (allVoiceInitCount == 0) {
            this.setState({ isTextVoiceLoaded: true })
            return
        }

        const voiceTexts = await fetchVoiceTexts(this.lessonID)
        if (voiceTexts.length == 0) {
            setTimeout(async () => {
                await this.setVoiceTextToTimeline()
            }, 1000)
            return
        }

        const timelines = await this.loader.fetchAndMergeVoiceTextToTimeline(
            this.state.timelines,
            voiceTexts
        )
        this.setState({ timelines: timelines })

        if (
            allVoiceInitCount >
            voiceTexts.filter(v => {
                return v.isConverted && v.isTexted
            }).length
        ) {
            setTimeout(async () => {
                await this.setVoiceTextToTimeline()
            }, 1000)
            return
        }

        this.setState({ isTextVoiceLoaded: true })
    }

    changeTimelines(timelines) {
        this.setState({ timelines: timelines })
    }

    changePublic(event) {
        this.setState({ isPublic: event.target.checked })
    }

    async confirmPublish() {
        const result = confirm(
            '授業を公開しますか？\n\n・授業は約10日間公開され、その後自動で削除されます\n・再生画面のURLへアクセスすると、誰でも閲覧可能な状態になります'
        )
        if (result) {
            this.publish()
        }
    }

    async confirmDestroy() {
        const result = confirm('収録した授業を、公開せずに削除しますか？')
        if (result) this.destroy()
    }

    publish() {
        this.setState({ isUpdating: true })

        const lesson = {
            id: this.lessonID,
            version: this.state.lesson.version + 1,
            durationSec: this.state.durationSec,
            timelines: this.state.timelines,
            poseKey: this.state.poseKey,
            faceKey: this.state.faceKey,
            isPublic: this.state.isPublic
        }

        this.publishLesson(lesson)
            .then(() => {
                this.setState({ isUpdating: false })
                this.props.history.push(`/${this.lessonID}`)
            })
            .catch(err => {
                this.setState({ isUpdating: false })
                this.openModal(publishingLessonError, err)
            })
    }

    async publishLesson(lesson) {
        const lessonBody = {
            durationSec: lesson.durationSec,
            version: lesson.version,
            isPublic: lesson.isPublic
        }
        await updateLesson(lesson.id, lessonBody)

        const materialBody = {
            durationSec: lesson.durationSec,
            timelines: lesson.timelines,
            poseKey: lesson.poseKey,
            faceKey: lesson.faceKey
        }
        await uploadMaterial(lesson.id, materialBody)
        await packMaterial(lesson.id)
    }

    async destroy() {
        await this.setState({ isLoading: true })

        deleteLesson(this.lessonID)
            .then(() => {
                this.setState({ isLoading: false })
                this.openModal(
                    deletionDoneTitle,
                    '',
                    () => {
                        this.props.history.push('/')
                    },
                    false // not error modal
                )
            })
            .catch(err => {
                this.setState({ isLoading: false })
                this.openModal(deletionErrorTitle, err)
            })
    }

    openModal(title, message, callback = () => {}, isError = true) {
        this.setState({
            isModalOpen: true,
            isErrorModal: isError,
            modalTitle: title,
            modalMessage: message,
            modalCloseCallback: () => {
                this.closeModal()
                callback()
            }
        })
    }

    closeModal() {
        this.setState({
            isModalOpen: false,
            isErrorModal: '',
            modalTitle: '',
            modalMessage: '',
            modalCloseCallback: () => {}
        })
    }

    render() {
        return (
            <div>
                <ModalWindow
                    isOpen={this.state.isModalOpen}
                    isError={this.state.isErrorModal}
                    title={this.state.modalTitle}
                    message={this.state.modalMessage}
                    onClose={this.state.modalCloseCallback.bind(this)}
                />
                <div id="lesson-editor" className="app-back-color-dark-gray">
                    <div className="container-fluid">
                        <div id="lesson-control-panel">
                            <div className="row">
                                <div className="col text-right">
                                    <button
                                        className="btn btn-primary btn-lg"
                                        onClick={this.confirmPublish.bind(this)}
                                        disabled={this.state.isLoading}
                                        data-tip="授業を公開状態にします"
                                    >
                                        授業を公開する
                                    </button>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col text-right">
                                    <button
                                        className="btn btn-danger btn-lg"
                                        onClick={this.confirmDestroy.bind(this)}
                                        disabled={this.state.isLoading}
                                        data-tip="授業をすぐに破棄します"
                                    >
                                        破棄する
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div id="editor-body" className="row">
                            <div id="text-editor" className="col-lg-7">
                                <h5 className="app-text-color-soft-white">
                                    テキスト編集
                                </h5>
                                <VoiceText
                                    isLoading={this.state.isLoading}
                                    lessonID={this.lessonID}
                                    timelines={this.state.timelines}
                                    changeTimelines={this.changeTimelines.bind(
                                        this
                                    )}
                                />
                            </div>
                            <div className="col-lg-5">
                                <h5 className="app-text-color-soft-white mb-4">
                                    プレビュー
                                </h5>
                                <div
                                    id="lesson-preview"
                                    className="app-back-color-soft-white m-2"
                                    ref={e => {
                                        this.playerContainer = e
                                    }}
                                >
                                    <LessonController
                                        avatar={this.state.avatar}
                                        lesson={{
                                            durationSec: this.state.durationSec,
                                            timelines: this.state.timelines,
                                            poseKey: this.state.poseKey,
                                            faceKey: this.state.faceKey
                                        }}
                                        isLoading={this.state.isLoading}
                                        isPreview={true}
                                        ref={e => {
                                            this.playerElement = e
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <ReactTooltip
                        className="tooltip"
                        place="bottom"
                        type="warning"
                    />
                </div>
                <style jsx>{`
                    #lesson-editor {
                        width: 100%;
                        height: 100%;
                    }
                    #lesson-control-panel {
                        padding-top: 20px;
                        padding-right: 20px;
                    }
                    #lesson-control-panel button {
                        width: 150px;
                        margin-bottom: 20px;
                        font-size: 17px;
                    }
                    #publish-checkbox {
                        display: none;
                        margin-top: 10px;
                        font-size: 13px;
                    }
                    #publish-checkbox label {
                        cursor: pointer;
                    }
                    #editor-body h5 {
                        font-size: 1vw;
                        margin-left: 1vw;
                    }
                    #text-editor {
                        position: relative;
                        max-height: 100%;
                    }
                    #lesson-preview {
                        width: 38vw;
                        height: ${38 / Const.RATIO_9_TO_16}vw;
                    }
                `}</style>
            </div>
        )
    }
}
