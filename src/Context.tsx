import React, { ChangeEvent, createContext, EventHandler, PropsWithChildren, useRef, useState } from "react";
import {io} from "socket.io-client";
import Peer from "peerjs";
import { v4 as uuidV4 } from 'uuid'
import axios from "axios";
import { useSnackbar } from 'notistack';
import hark from 'hark';

interface user {
    userId: string;
    userName: string;
    stream?: MediaStream | null;
    speaking: boolean;
    muted: boolean;
    deafen: boolean;
}

interface stateChange {
    userId: string;
    state: {
        type: 'mute' | 'deafen',
        flag: boolean
    }
}

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
    // port: 8848,
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

    const [localMuted, setLocalMuted] = useState(false);
    const [remoteMuted, setRemoteMuted] = useState(false);
    const [joined, setJoined] = useState(false);
    const [roomId, setRoomId] = useState('');
    const [userList, setUserList] = useState<Array<user>>([]);

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
                    localStream.current = stream;
                    resolve();
                })
            } else {
                resolve();
            }
        });
    }

    const join = (roomId: string, userName: string): Promise<void> => {
        return new Promise((resolve, _reject) => {
            let errMsg: string = '';
            if (roomId.length === 0) {
                errMsg = '房间号不能为空';
            } else if (roomId.length > 10) {
                errMsg = '房间号过长';
            } else if (userName.length === 0) {
                errMsg = '昵称不能为空';
            } else if (userName.length > 20) {
                errMsg = '昵称过长';
            }

            if (errMsg.length > 0) {
                enqueueSnackbar(errMsg, {
                    variant: 'error',
                    anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'center',
                    }
                });
                resolve();
            } else {
                getPermissions().then(() => {
                    axios.post(`${URL.HTTP}/join`, {
                        roomId: roomId,
                        userId: userId,
                        userName: userName
                    }).then(res => {
                        if (res.data.status === 'success') {
                            localStorage.setItem('userName', userName);
                            setRoomId(roomId);
                            getUserList();
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
            }
        })
    }

    const create = (userName: string): Promise<void> => {
        return new Promise((resolve, _reject) => {
            let errMsg: string = '';
            if (userName.length === 0) {
                errMsg = '昵称不能为空';
            } else if (userName.length > 20) {
                errMsg = '昵称过长';
            }

            if (errMsg.length > 0) {
                enqueueSnackbar(errMsg, {
                    variant: 'error',
                    anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'center',
                    }
                });
                resolve();
            } else {
                getPermissions().then(() => {
                    axios.post(`${URL.HTTP}/create`, {
                        userId: userId,
                        userName: userName
                    }).then(res => {
                        if (res.data.status === 'success') {
                            localStorage.setItem('userName', userName);
                            setRoomId(res.data.content);
                            getUserList();
                            setJoined(true);
                            startListener();
                            resolve();
                        }
                    })
                })
            }
        })
    }

    const startListener = (): void => {
        peer.on('call', answer)
        socket.on('user-join', call)
        socket.on('user-leave', leave)
        socket.on('user-state-change', stateChange)
    }

    const call = (user: any) => {
        console.log(`${user.userName} joined`);
        console.log(`Calling ${user.userName}`);
        const call = peer.call(user.userId, localStream.current!);
        call.on('stream', stream => {
            let _userList: Array<user>;
            setUserList(userList => {
                _userList = [...userList];
                return userList;
            });
            let _user: user = {
                userId: user.userId,
                userName: user.userName,
                stream: stream,
                speaking: false,
                muted: false,
                deafen: false
            }
            _userList!.push(_user);
            handleSpeakEvent(_user);
            setUserList(_userList!);
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
            setUserList(userList => {
                for (let index in userList) {
                    if (userList[index].userId === call.peer) {
                        userList[index].stream = stream;
                        handleSpeakEvent(userList[index]);
                    }
                }
                return userList;
            })
            stream.getAudioTracks().forEach(track => {
                remoteStream.current.addTrack(track);
                audioRef.current!.srcObject = remoteStream.current;
            })
        })
    }

    const leave = (user: user): void => {
        console.log(`${user.userName} has leaved`);
        let _userList: Array<user>;
        setUserList(userList => {
            _userList = userList;
            return userList;
        });
        _userList = _userList!.filter((u: user) => u.userId !== user.userId);
        setUserList(_userList);
    }

    const stateChange = (event: stateChange): void => {
        setUserList(userList => {
            let _userList = [...userList];
            for (let index in _userList) {
                if (_userList[index].userId === event.userId) {
                    if (event.state.type === 'mute') {
                        _userList[index].muted = event.state.flag;
                    } else if (event.state.type === 'deafen') {
                        _userList[index].deafen = event.state.flag;
                    }
                }
            }
            return _userList;
        })
    }

    const handleSpeakEvent = (user: user) => {
        let speakEvents = hark(user.stream!, {
            threshold: -70
        });
        speakEvents.on('speaking', () => {
            setUserList(userList => {
                let _userList = [...userList];
                for (let index in _userList) {
                    if (_userList[index].userId === user.userId) {
                        _userList[index].speaking = true;
                    }
                }
                return _userList;
            })
        })
        speakEvents.on('stopped_speaking', () => {
            setUserList(userList => {
                let _userList = [...userList];
                for (let index in _userList) {
                    if (_userList[index].userId === user.userId) {
                        _userList[index].speaking = false;
                    }
                }
                return _userList;
            })
        })
    }

    const getUserList = () => {
        setRoomId(roomId => {
            axios.get(`${URL.HTTP}/getUsers`, {
                params: {
                    roomId: roomId
                }
            }).then(res => {
                if (res.data.status === 'success') {
                    let _userList = [];
                    for (let user of res.data.content) {
                        let _user: user = {
                            userId: user.userId,
                            userName: user.userName,
                            stream: user.userId === userId ? localStream.current : null,
                            speaking: false,
                            muted: false,
                            deafen: false
                        }
                        if (user.userId === userId) {
                            handleSpeakEvent(_user);
                        }
                        _userList.push(_user);
                    }
                    setUserList(_userList);
                } else {
                    enqueueSnackbar(res.data.content, {
                        variant: 'error',
                        anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'center',
                        }
                    });
                }
            })
            return roomId;
        })
    }

    const toggleLocalMute = () => {
        if (localStream.current) {
            let flag: boolean;
            localStream.current.getAudioTracks().forEach(track => {
                if (track.enabled) {
                    track.enabled = false;
                    flag = true;
                } else {
                    track.enabled = true;
                    flag = false;
                }
            });
            setLocalMuted(flag!);
            socket.emit('state-change', {
                type: 'mute',
                flag: flag!
            })
            setUserList(userList => {
                let _userList = [...userList];
                for (let index in _userList) {
                    if (_userList[index].userId === userId) {
                        _userList[index].muted = flag;
                    }
                }
                return _userList;
            })
        }
    }

    const toggleRemoteMute = () => {
        let flag: boolean;
        if (remoteMuted) {
            audioRef.current!.muted = false;
            flag = false;
        } else {
            audioRef.current!.muted = true;
            flag = true;
        }
        setRemoteMuted(flag);
        socket.emit('state-change', {
            type: 'deafen',
            flag: flag
        })
        setUserList(userList => {
            let _userList = [...userList];
            for (let index in _userList) {
                if (_userList[index].userId === userId) {
                    _userList[index].deafen = flag;
                }
            }
            return _userList;
        })
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
            audioRef,
            userList
        }}>
            {children}
        </socketContext.Provider>
    )
}
