import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default class VoiceText extends React.Component {
    constructor(props) {
        super(props)

        this.urls = []
        this.playingAudios = []
    }

    async componentDidUpdate(prevProps) {
        if (prevProps.isLoading && !this.props.isLoading) {
            this.urls = this.props.timelines
                .filter(t => {
                    return t.voice.id != ''
                })
                .map(t => {
                    return t.voice.url
                })
        }
    }

    changeText(event) {
        const targetIndex = event.target.getAttribute('custom-index')
        const newText = event.target.value

        const timelines = this.props.timelines
        let textIndex = -1
        for (const [_, t] of timelines.entries()) {
            if (t.voice.id == '') continue

            textIndex++
            if (textIndex != targetIndex) continue
            if (textIndex == targetIndex) {
                t.text.body = newText
                break
            }
        }

        this.props.changeTimelines(timelines)
    }

    playVoice(event) {
        const voiceIndex = event.currentTarget.value
        if (this.playingAudios[voiceIndex]) {
            this.playingAudios[voiceIndex].pause()
            this.playingAudios[voiceIndex] = null
        } else {
            const audioElement = new Audio()
            this.playingAudios[voiceIndex] = audioElement
            const url = this.urls[voiceIndex]
            audioElement.src = url
            audioElement.addEventListener(
                'ended',
                () => {
                    this.playingAudios[voiceIndex] = null
                },
                true
            )
            audioElement.play()
        }
    }

    render() {
        return (
            <div id="lesson-text" className="app-back-color-dark-gray">
                <div id="lesson-text-lines">
                    {this.props.timelines
                        .filter(t => {
                            return t.voice.id != ''
                        })
                        .map((t, i) => {
                            if (t.text.body != '') {
                                return (
                                    <div key={i} className="line">
                                        <button
                                            value={i}
                                            className="voice-play-btn app-text-color-dark-gray"
                                            onClick={this.playVoice.bind(this)}
                                            disabled={this.props.isLoading}
                                            tabIndex="-1"
                                        >
                                            <FontAwesomeIcon icon="volume-up" />
                                        </button>
                                        <input
                                            type="text"
                                            custom-index={i}
                                            className="form-control voice-text"
                                            defaultValue={t.text.body}
                                            disabled={this.props.isLoading}
                                            onChange={this.changeText.bind(
                                                this
                                            )}
                                        />
                                    </div>
                                )
                            } else if (this.props.isLoading) {
                                return (
                                    <div
                                        key={i}
                                        className="line text-detecting"
                                    >
                                        <FontAwesomeIcon icon="spinner" spin />
                                    </div>
                                )
                            } else {
                                return (
                                    <div key={i} className="line">
                                        <button
                                            value={i}
                                            className="voice-play-btn app-text-color-dark-gray"
                                            onClick={this.playVoice.bind(this)}
                                            disabled={this.props.isLoading}
                                            tabIndex="-1"
                                        >
                                            <FontAwesomeIcon icon="volume-up" />
                                        </button>
                                        <input
                                            type="text"
                                            custom-index={i}
                                            className="form-control voice-text"
                                            placeholder="（検出なし）"
                                            disabled={this.props.isLoading}
                                            onChange={this.changeText.bind(
                                                this
                                            )}
                                        />
                                    </div>
                                )
                            }
                        })}
                </div>
                <style jsx>{`
                    #lesson-text-lines {
                        width: 100%;
                        height: calc(
                            100% - 50px - 146px
                        ); // header and header controller buttons heights.
                        overflow-y: scroll;
                    }
                    #lesson-text-lines::-webkit-scrollbar {
                        display: none;
                    }
                    .line {
                        position: relative;
                        display: block;
                        width: 54vw;
                        height: 40px;
                        margin-top: 20px;
                        margin-left: 1vw;
                    }
                    .voice-play-btn {
                        position: absolute;
                        outline: none;
                        height: 25px;
                        border: none;
                        cursor: pointer;
                        top: 0;
                        left: 3px;
                        bottom: 0;
                        margin: auto;
                        font-size: 18px;
                    }
                    .voice-text {
                        text-indent: 30px;
                    }
                    .text-detecting {
                        padding-top: 8px;
                        padding-left: 10px;
                        border: 1px solid #d8d8d8;
                        border-radius: 5px;
                        font-size: 20px;
                        color: var(--dark-gray);
                    }
                `}</style>
            </div>
        )
    }
}