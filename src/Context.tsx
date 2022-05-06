import React, { createContext, PropsWithChildren, RefObject, useRef } from "react";
import {io} from "socket.io-client";
import Peer from "peerjs";
import { v4 as uuidV4 } from 'uuid'
import axios from "axios";
import { useSnackbar } from 'notistack';
import { rejects } from "assert";

const userId = uuidV4();
const URL = {
    HTTP: `${process.env.REACT_APP_HTTP_URL}${process.env.REACT_APP_PATH}`,
    WS: `${process.env.REACT_APP_WS_URL}`
};

let socket = io(`${URL.WS}`, {
    query: {userId: userId},
    path: `${process.env.REACT_APP_PATH}/socket.io`
});
const peer = new Peer(userId, {
    host: `${process.env.REACT_APP_PEER_URL}`,
    path: `${process.env.REACT_APP_PATH}/peer`,
    config: {
        'iceServers': [
            {
                urls: process.env.REACT_APP_ICE_SERVER_URL!,
                username: process.env.REACT_APP_ICE_SERVER_USERNAME,
                credential: process.env.REACT_APP_ICE_SERVER_CREDENTIAL
            }
        ]
    }
});

export const socketContext = createContext({});

export const ContextProvider = ({ children }: PropsWithChildren<{}>) => {

    const [localMuted, setLocalMuted] = React.useState(false);
    const [remoteMuted, setRemoteMuted] = React.useState(false);
    const [joined, setJoined] = React.useState(false);
    const [roomId, setRoomId] = React.useState('');
    const [userName, setUserName] = React.useState('');

    const audioRef = useRef<HTMLAudioElement>(null);

    const { enqueueSnackbar } = useSnackbar();

    const localStream = useRef<MediaStream>();
    const remoteStream = useRef<MediaStream>(new MediaStream());

    const getPermissions = (): Promise<void> => {
        return new Promise((resolve, _reject) => {
            if (!localStream.current) {
                navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true
                }).then(stream => {
                    if (localStream != null) {
                        localStream.current = stream;
                    }
                    resolve();
                })
            } else {
                resolve();
            }
        });
    }

    const join = (roomId: string): Promise<void> => {
        return new Promise((resolve, _reject) => {
            getPermissions().then(() => {
                axios.post(`${URL.HTTP}/join`, {
                    roomId: roomId,
                    userId: userId,
                    userName: userName
                }).then(res => {
                    if (res.data.status === 'success') {
                        setRoomId(roomId);
                        setJoined(true);
                        startListener();
                        resolve();
                    } else {
                        enqueueSnackbar(res.data.content, {
                            variant: 'error',
                            anchorOrigin: {
                                vertical: 'bottom',
                                horizontal: 'center',
                            }
                        });
                        resolve();
                    }
                })
            })
        })
    }

    const create = (): Promise<void> => {
        return new Promise((resolve, _reject) => {
            getPermissions().then(() => {
                axios.post(`${URL.HTTP}/create`, {
                    userId: userId,
                    userName: userName
                }).then(res => {
                    if (res.data.status === 'success') {
                        setRoomId(res.data.content);
                        setJoined(true);
                        startListener();
                        resolve();
                    }
                })
            })
        })
    }

    const startListener = (): void => {
        peer.on('call', answer)

        socket.on('user-join', call)

        socket.on('user-leave', userId => {
            console.log(`${userId} has leaved`);
            // connectTo(userId, stream);
        })
    }

    const call = (userId: string) => {
        console.log(`${userId} joined`);
        console.log(`Calling ${userId}`);
        const call = peer.call(userId, localStream.current!);
        call.on('stream', stream => {
            console.log(`call established`);
            stream.getAudioTracks().forEach(track => {
                remoteStream.current.addTrack(track);
                audioRef.current!.srcObject = remoteStream.current;
            })
        })
    }

    const answer = (call: Peer.MediaConnection) => {
        console.log('call incoming');
        call.answer(localStream.current);
        call.on('stream', stream => {
            console.log("income call established");
            stream.getAudioTracks().forEach(track => {
                remoteStream.current.addTrack(track);
                audioRef.current!.srcObject = remoteStream.current;
            })
        })
    }

    const toggleLocalMute = () => {
        console.log('toggle local mute');
        console.log(audioRef.current?.paused);
        if (localStream.current) {
            localStream.current.getAudioTracks().forEach(track => {
                console.log(track.enabled);
                if (track.enabled) {
                    track.enabled = false;
                    setLocalMuted(true);
                } else {
                    track.enabled = true;
                    setLocalMuted(false);
                }
            });
        }
    }

    const toggleRemoteMute = () => {
        console.log(remoteStream.current.getTracks());
        if (remoteMuted) {
            audioRef.current!.muted = false;
            setRemoteMuted(false);
        } else {
            audioRef.current!.muted = true;
            setRemoteMuted(true);
        }
    }

    return (
        <socketContext.Provider value={{
            localMuted,
            remoteMuted,
            joined,
            roomId,
            join,
            create,
            toggleLocalMute,
            toggleRemoteMute,
            userName,
            setUserName,
            audioRef
        }}>
            {children}
        </socketContext.Provider>
    )
}
