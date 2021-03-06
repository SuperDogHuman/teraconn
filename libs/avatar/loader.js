import * as THREE from 'three'
import { GLTFLoader } from 'ThreejsExample/jsm/loaders/GLTFLoader'
import { VRM, VRMSchema } from '@pixiv/three-vrm'
import * as Const from '../constants'

const raycaster = new THREE.Raycaster()
const mousePosition = new THREE.Vector2()
const plane = new THREE.Plane()
const planeNormal = new THREE.Vector3(0, 0, 1)
const planeIntersect = new THREE.Vector3()
const positionShift = new THREE.Vector3()

export default class AvatarLoader {
  constructor() {
    this.domSize = {}
    this.poseKey = {}
    this.faceKey = {}
    this.vrm
    this.camera
    this.scene = new THREE.Scene()
    this.renderer
    this.animationMixer
    this.animationClip ={}
    this.light
  }

  async render(avatar, container) {
    this._calcDomSize(container)

    this._setupCamera()
    await this._setupAvatar(avatar)

    this._setDefaultAnimation()

    return this._createDom()
  }

  setLightColor(color, intensity) {
    if (this.light) {
      this.light.color.setHex(color)
      this.light.intensity = intensity
    } else {
      this.light = new THREE.DirectionalLight(color, intensity)
      this.scene.add(this.light)
    }
  }

  isOverAvatar(x, y) {
    return this._intersectObjects(x, y).length > 0
  }

  prepareMovePosition(x, y) {
    const intersects = this._intersectObjects(x, y)
    if (intersects.length === 0) return false

    plane.setFromNormalAndCoplanarPoint(planeNormal, intersects[0].point)
    positionShift.subVectors(this.vrm.scene.position, intersects[0].point)

    return true
  }

  movePosition(x, y) {
    this._setRaycast(x, y)

    raycaster.ray.intersectPlane(plane, planeIntersect)
    this.vrm.scene.position.addVectors(planeIntersect, positionShift)

    this._getBone('hips').rotation.y = Math.PI - mousePosition.x * 0.7
  }

  switchSpeaking(isSpeaking) {
    if (!this.animationClip.speaking) return

    if (isSpeaking) {
      this.animationClip.speaking.play()
    } else {
      this.animationClip.speaking.stop()
    }
  }

  animate(deltaTime) {
    this.vrm.update(deltaTime)
    this.animationMixer.update(deltaTime)
    this.renderer.render(this.scene, this.camera)
  }

  updateSize(container) {
    if (!container) return // アバター表示要素がまだ存在しなければスキップ
    if (!this.renderer) return // レンダラーの初期化前にリサイズが発生したらスキップ

    this._calcDomSize(container)
    this.renderer.setSize(this.domSize.width, this.domSize.height)
    this.renderer.render(this.scene, this.camera)
  }

  clearBeforeUnload() {
    if (this.scene) {
      this.scene.remove(this.scene.children)
    }
  }

  jumpAnimationAt(timeSec) {
    this.animationMixer._actions.forEach(action => {
      action.time = timeSec
    })
    this.animate(0)
  }

  play() {
    this.animationMixer.timeScale = 1
  }

  pause() {
    this.animationMixer.timeScale = 0
  }

  stop() {
    this.animationMixer._actions.forEach(action => {
      action.paused = true
    })
  }

  currentPosition() {
    return this.vrm.scene.position
  }

  _calcDomSize(container) {
    let playerWidth, playerHeight
    if (container.clientHeight / container.clientWidth > Const.RATIO_16_TO_9) {
      playerWidth = container.clientWidth
      playerHeight = Math.round(container.clientWidth * Const.RATIO_16_TO_9)
    } else {
      playerWidth = Math.round(container.clientHeight / Const.RATIO_16_TO_9)
      playerHeight = container.clientHeight
    }

    this.domSize = { width: playerWidth, height: playerHeight }
  }

  _setRaycast(x, y) {
    mousePosition.x = (x / this.domSize.width) * 2 - 1
    mousePosition.y = ((y / this.domSize.height) * 2 - 1) * -1
    raycaster.setFromCamera(mousePosition, this.camera)
  }

  _intersectObjects(x, y) {
    if (!this.vrm) return []
    this._setRaycast(x, y)
    return raycaster.intersectObjects(this.vrm.scene.children)
  }

  _setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      1,
      this.domSize.width / this.domSize.height,
      150.0,
      160.0
    )
    //    this.camera.position.set(-0.6, 1.05, 155.0)
    this.camera.position.set(0, 0, 155.0)
  }

  async _setupAvatar(avatar) {
    this.vrm = await new Promise(resolve => {
      const loader = new GLTFLoader()
      loader.load(avatar.url, gltf => {
        VRM.from(gltf).then(vrm => {
          resolve(vrm)
        })
      })
    })

    this._setDefaultPose(avatar)

    this.scene.add(this.vrm.scene)
  }

  _setDefaultPose(avatar) {
    this._getBone('hips').rotation.y = Math.PI // どのアバターも真後ろを向いているので反転

    this.vrm.scene.scale.set(...[...Array(3)].map(() => avatar.config.scale))
    this.vrm.scene.position.set(...avatar.config.positions)
    avatar.config.initialPoses.forEach(p => {
      this._getBone(p.boneName).rotation.set(...p.rotations)
    })
  }

  _getBone(boneName) {
    return this.vrm.humanoid.getBoneNode(boneName)
  }

  _createDom() {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.domSize.width, this.domSize.height)
    this.renderer.render(this.scene, this.camera)

    return this.renderer.domElement
  }

  _setDefaultAnimation() {
    this.animationMixer = new THREE.AnimationMixer(this.vrm.scene)
    this.animationMixer.timeScale = 0
    this._setBreathAnimation()
    this._setSpeakingAnimation()
    this._initAnimationPlaying()
  }

  _setBreathAnimation() {
    const initQuat = new THREE.Quaternion(0.0, 0.0, 0.0, 1.0)

    const finHeadQuat = new THREE.Quaternion(0.0, 0.0, 0.0, 1.0)
    finHeadQuat.setFromEuler(new THREE.Euler(0.03 * Math.PI, 0.0, 0.0))
    const headTrack = new THREE.QuaternionKeyframeTrack(
      this._getBone('head').name + '.quaternion',
      [0.0, 3.0, 6.0],
      [...initQuat.toArray(), ...finHeadQuat.toArray(), ...initQuat.toArray()]
    )

    const finChestQuat = new THREE.Quaternion(0.0, 0.0, 0.0, 1.0)
    finChestQuat.setFromEuler(new THREE.Euler(0.01 * Math.PI, 0.0, 0.0))
    const chestTrack = new THREE.QuaternionKeyframeTrack(
      this._getBone('chest').name + '.quaternion',
      [0.0, 3.0, 6.0],
      [...initQuat.toArray(), ...finChestQuat.toArray(), ...initQuat.toArray()]
    )

    const clip = new THREE.AnimationClip('breath', 6.0, [headTrack, chestTrack])
    this.animationClip.initial = this.animationMixer.clipAction(clip)
  }

  _setSpeakingAnimation() {
    const clip = THREE.AnimationClip.parse({
      name: 'speaking',
      tracks: [{
        name: this.vrm.blendShapeProxy.getBlendShapeTrackName(VRMSchema.BlendShapePresetName.A),
        type: 'number',
        times: [0, 0.2, 0.5],
        values: [0, 1.0, 0],
      }],
    })
    this.animationClip.speaking = this.animationMixer.clipAction(clip)
  }

  _initAnimationPlaying() {
    this.animationClip.initial.paused = false
    this.animationClip.initial.play() // playを実行しても、mixerのtimescaleが0ならアニメーションは開始されない
  }
}
