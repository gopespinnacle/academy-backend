/*
===========================================================
Gopes Pinnacle Academy
Virtual Classroom V2
Meeting WebRTC Engine
Part 1
===========================================================
*/

window.MeetingWebRTC = (() => {

    /*
    ===========================================================
    CONFIGURATION
    ===========================================================
    */

    const rtcConfig = {

        iceServers: [

            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302"
                ]
            },

            {
                urls: "turn:openrelay.metered.ca:80",
                username: "openrelayproject",
                credential: "openrelayproject"
            },

            {
                urls: "turn:openrelay.metered.ca:443",
                username: "openrelayproject",
                credential: "openrelayproject"
            }

        ],

        iceCandidatePoolSize: 10

    };

    /*
    ===========================================================
    GLOBAL VARIABLES
    ===========================================================
    */

    let localStream = null;

    let screenStream = null;

    let peers = {};

    let remoteStreams = {};

    let roomId = "";

    let role = "";

    let userName = "";

    let userId = "";

    let initialized = false;

    /*
    ===========================================================
    INITIALIZE
    ===========================================================
    */

    async function initialize(options = {}) {

        roomId = options.room || "";

        role = options.role || "";

        userName = options.name || "";

        userId = options.userId || "";

        MeetingUtils.success(
            "Meeting Initialize",
            {
                roomId,
                role,
                userName,
                userId
            }
        );

        initialized = true;

    }

    /*
    ===========================================================
    LOCAL MEDIA
    ===========================================================
    */

    async function startCamera() {

        if (localStream) {

            return localStream;

        }

        localStream = await navigator.mediaDevices.getUserMedia({

            video: {

                width: 1280,

                height: 720,

                frameRate: 30

            },

            audio: {

                echoCancellation: true,

                noiseSuppression: true,

                autoGainControl: true

            }

        });

        MeetingUtils.success(
            "Camera Started"
        );

        return localStream;

    }

    /*
    ===========================================================
    GET LOCAL STREAM
    ===========================================================
    */

    function getLocalStream() {

        return localStream;

    }

    /*
    ===========================================================
    GET SCREEN STREAM
    ===========================================================
    */

    function getScreenStream() {

        return screenStream;

    }

    /*
    ===========================================================
    GET PEERS
    ===========================================================
    */

    function getPeers() {

        return peers;

    }

    /*
    ===========================================================
    GET REMOTE STREAMS
    ===========================================================
    */

    function getRemoteStreams() {

        return remoteStreams;

    }

    /*
    ===========================================================
    IS INITIALIZED
    ===========================================================
    */

    function isInitialized() {

        return initialized;

    }

    /*
    ===========================================================
    EXPORT
    ===========================================================
    */

        /*
    ===========================================================
    CREATE PEER CONNECTION
    ===========================================================
    */

    async function createPeerConnection(remoteSocketId) {

        if (peers[remoteSocketId]) {

            return peers[remoteSocketId];

        }

        const peer = new RTCPeerConnection(rtcConfig);

        peers[remoteSocketId] = peer;

        if (localStream) {

            localStream.getTracks().forEach(track => {

                peer.addTrack(track, localStream);

            });

        }

        peer.onicecandidate = (event) => {

            if (!event.candidate) return;

            MeetingSocket.emit("ice-candidate", {

                targetSocketId: remoteSocketId,

                candidate: event.candidate

            });

        };

        peer.ontrack = (event) => {

            remoteStreams[remoteSocketId] = event.streams[0];

            document.dispatchEvent(

                new CustomEvent("meeting:remoteStream", {

                    detail: {

                        socketId: remoteSocketId,

                        stream: event.streams[0]

                    }

                })

            );

        };

        peer.onconnectionstatechange = () => {

            MeetingUtils.log(

                "Connection State",

                peer.connectionState

            );

            if (peer.connectionState === "failed") {

                peer.restartIce();

            }

        };

        return peer;

    }

    /*
    ===========================================================
    CREATE OFFER
    ===========================================================
    */

    async function createOffer(remoteSocketId) {

        const peer = await createPeerConnection(remoteSocketId);

        const offer = await peer.createOffer({

            offerToReceiveAudio: true,

            offerToReceiveVideo: true

        });

        await peer.setLocalDescription(offer);

        MeetingSocket.emit("offer", {

            targetSocketId: remoteSocketId,

            offer

        });

    }

    /*
    ===========================================================
    RECEIVE OFFER
    ===========================================================
    */

    async function receiveOffer(remoteSocketId, offer) {

        const peer = await createPeerConnection(remoteSocketId);

        await peer.setRemoteDescription(

            new RTCSessionDescription(offer)

        );

        const answer = await peer.createAnswer();

        await peer.setLocalDescription(answer);

        MeetingSocket.emit("answer", {

            teacherSocketId: remoteSocketId,

            answer

        });

    }

    /*
    ===========================================================
    RECEIVE ANSWER
    ===========================================================
    */

    async function receiveAnswer(remoteSocketId, answer) {

        const peer = peers[remoteSocketId];

        if (!peer) return;

        await peer.setRemoteDescription(

            new RTCSessionDescription(answer)

        );

    }

    /*
    ===========================================================
    RECEIVE ICE
    ===========================================================
    */

    async function receiveIce(remoteSocketId, candidate) {

        const peer = peers[remoteSocketId];

        if (!peer) return;

        try {

            await peer.addIceCandidate(

                new RTCIceCandidate(candidate)

            );

        }

        catch (err) {

            console.error(err);

        }

    }

    /*
    ===========================================================
    EXPORT
    ===========================================================
    */

        /*
    ===========================================================
    REMOVE PEER
    ===========================================================
    */

    function removePeer(remoteSocketId){

        const peer = peers[remoteSocketId];

        if(peer){

            peer.close();

            delete peers[remoteSocketId];

        }

        delete remoteStreams[remoteSocketId];

        document.dispatchEvent(

            new CustomEvent("meeting:participantLeft",{

                detail:{
                    socketId:remoteSocketId
                }

            })

        );

    }

    /*
    ===========================================================
    REMOVE ALL PEERS
    ===========================================================
    */

    function removeAllPeers(){

        Object.keys(peers).forEach(removePeer);

    }

    /*
    ===========================================================
    REPLACE VIDEO TRACK
    ===========================================================
    */

    async function replaceVideoTrack(track){

        Object.values(peers).forEach(peer=>{

            const sender = peer.getSenders().find(sender=>

                sender.track &&
                sender.track.kind==="video"

            );

            if(sender){

                sender.replaceTrack(track);

            }

        });

    }

    /*
    ===========================================================
    REPLACE AUDIO TRACK
    ===========================================================
    */

    async function replaceAudioTrack(track){

        Object.values(peers).forEach(peer=>{

            const sender = peer.getSenders().find(sender=>

                sender.track &&
                sender.track.kind==="audio"

            );

            if(sender){

                sender.replaceTrack(track);

            }

        });

    }

    /*
    ===========================================================
    GET PARTICIPANT COUNT
    ===========================================================
    */

    function getParticipantCount(){

        return Object.keys(peers).length;

    }

    /*
    ===========================================================
    EXPORT
    ===========================================================
    */

        /*
    ===========================================================
    RESTART ICE
    ===========================================================
    */

    async function restartIce(remoteSocketId){

        const peer = peers[remoteSocketId];

        if(!peer) return;

        try{

            const offer = await peer.createOffer({

                iceRestart:true

            });

            await peer.setLocalDescription(offer);

            MeetingSocket.emit("offer",{

                targetSocketId:remoteSocketId,

                offer

            });

        }catch(err){

            console.error(err);

        }

    }

    /*
    ===========================================================
    CAMERA ENABLE / DISABLE
    ===========================================================
    */

    function enableCamera(enabled){

        if(!localStream) return;

        localStream.getVideoTracks().forEach(track=>{

            track.enabled = enabled;

        });

    }

    /*
    ===========================================================
    MICROPHONE ENABLE / DISABLE
    ===========================================================
    */

    function enableMicrophone(enabled){

        if(!localStream) return;

        localStream.getAudioTracks().forEach(track=>{

            track.enabled = enabled;

        });

    }

    /*
    ===========================================================
    START SCREEN SHARE
    ===========================================================
    */

    async function startScreenShare(){

        screenStream = await navigator.mediaDevices.getDisplayMedia({

            video:true,

            audio:true

        });

        const track = screenStream.getVideoTracks()[0];

        await replaceVideoTrack(track);

        track.onended = async()=>{

            await stopScreenShare();

        };

        return screenStream;

    }

    /*
    ===========================================================
    STOP SCREEN SHARE
    ===========================================================
    */

    async function stopScreenShare(){

        if(!screenStream) return;

        screenStream.getTracks().forEach(track=>{

            track.stop();

        });

        screenStream = null;

        if(localStream){

            await replaceVideoTrack(

                localStream.getVideoTracks()[0]

            );

        }

    }

    /*
    ===========================================================
    CLOSE EVERYTHING
    ===========================================================
    */

    function destroy(){

        removeAllPeers();

        if(localStream){

            localStream.getTracks().forEach(track=>{

                track.stop();

            });

        }

        if(screenStream){

            screenStream.getTracks().forEach(track=>{

                track.stop();

            });

        }

        localStream = null;

        screenStream = null;

    }

    /*
    ===========================================================
    EXPORT
    ===========================================================
    */

    return {

        initialize,

        startCamera,

        getLocalStream,

        getScreenStream,

        getPeers,

        getRemoteStreams,

        isInitialized,

        createPeerConnection,

        createOffer,

        receiveOffer,

        receiveAnswer,

        receiveIce,

        removePeer,

        removeAllPeers,

        replaceVideoTrack,

        replaceAudioTrack,

        getParticipantCount,

        restartIce,

        enableCamera,

        enableMicrophone,

        startScreenShare,

        stopScreenShare,

        destroy,

        rtcConfig

    };

})();

