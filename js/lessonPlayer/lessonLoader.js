import 'babel-polyfill';
import axios from 'axios';
import JSZip from 'jszip';
import Utility from '../common/utility';
import * as Const from '../common/constants';

export default class LessonLoader {
    constructor(lessonID) {
        this.lessonID      = lessonID;
        this.avatarFileURL = null;
    }

    loadForPreview() {

    }

    async loadForPlayAsync() {
        const signedZipHeader = Utility.customGetHeader([{ 'id': this.lessonID, 'entity': 'Lesson', 'extension': 'zip' }]);
        const signedZipParams = { headers: signedZipHeader };
        const signedZipResult = await axios.get(Const.SIGNED_URL_API_URL, signedZipParams);
//        const lessonMaterialURL = signedZipResult.data.signed_urls[0];
        const lessonMaterialURL = 'http://localhost:1234/bdfstlck6ru000hd78eg.zip';

        const zipResult = await axios.get(lessonMaterialURL, { responseType: 'blob' });
        this.loadLessonMaterialAsync(zipResult.data);

        const lessonURL = Const.LESSON_API_URL.replace('{lessonID}', this.lessonID);
        const lessonResult = await axios.get(lessonURL);
        const avatarID = lessonResult.data.avatar.id;

        const signedVRMHeader = Utility.customGetHeader([{ 'id': avatarID, 'entity': 'Avatar', 'extension': 'vrm' }]);
        const signedVRMParams = { headers: signedVRMHeader };
        const signedVRMResult = await axios.get(Const.SIGNED_URL_API_URL, signedVRMParams);
//        const avatarURL = signedVRMResult.data.signed_urls[0];
        const avatarURL = 'http://localhost:1234/bdiuotgrbj8g00l9t3ng.vrm';

        this.avatarFileURL = avatarURL;
    }

    async loadLessonMaterialAsync(zipBody) {
        const unzip = await JSZip.loadAsync(zipBody)
        const materialString = await unzip.file('material.json').async('string');
        const material = JSON.parse(materialString);

        for (const graphic of material.graphics) {
            const graphicPath = 'graphics/' + graphic.id + '.' + graphic.fileType;
            const blob = await unzip.file(graphicPath).async('blob');
            const objectURL = window.URL.createObjectURL(blob);
            graphic.url = objectURL;
        }

        for (const voice of material.voices) {
            const voicePath = 'voices/' + voice.id + '.ogg';
            const blob = await unzip.file(voicePath).async('blob');
            const objectURL = window.URL.createObjectURL(blob);
            voice.url = objectURL;
        }

        const lessonString = await unzip.file('lesson.json').async('string');
        const lesson = JSON.parse(lessonString);

        //        this.state.lesson = null;
    }
}
