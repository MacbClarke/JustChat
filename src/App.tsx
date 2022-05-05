import React, {useContext, useEffect, useRef, useState} from 'react';
import './App.css';
import {Alert, Box, Button, Container, CssBaseline, Divider, Stack, TextField, Typography} from "@mui/material";
import {Add, Login} from "@mui/icons-material";
import { socketContext } from './Context';

interface IProps {
    localMuted?: boolean;
    remoteMuted?: boolean;
    joined?: boolean;
    roomId?: string;
    join?: (roomId: string) => void;
    create?: () => void;
    toggleLocalMute?: () => void;
    toggleRemoteMute?: () => void;
    userName?: string;
    setUserName?: (userName: string) => void;
    audioRef?: React.RefObject<HTMLAudioElement>;
}

function App() {

    const {join, create, roomId, audioRef, joined}: IProps = useContext(socketContext);

    function Home() { 

        const [inputRoomId, setInputRoomId] = useState('');

        return (
            <Container component="main" maxWidth="xs" >
                <CssBaseline />
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }} >
                    <Typography sx={{mb: 2}} variant="h4">
                        加入房间
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <TextField onChange={(e) => setInputRoomId(e.target.value)} label="房间号" />
                        <Button onClick={() => join!(inputRoomId)} variant="contained">
                            <Login />
                        </Button>
                    </Stack>
                    <Typography sx={{
                        mt: 3,
                        mb: 3
                    }} variant="h6">
                        或
                    </Typography>
                    <Typography sx={{mb: 2}} variant="h4">
                        创建房间
                    </Typography>
                    <Button onClick={() => create!()} size="large" variant="contained">
                        <Add />
                    </Button>
                </Box>
            </Container>
        );
    }
    
    function Room() {
       return (
            <Container component="main" maxWidth="xs" >
                <CssBaseline />
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }} >
                    <Typography sx={{mb: 2}} variant="h4">
                        房间号
                    </Typography>
                    <Typography sx={{mb: 2}} variant="h4">
                        {roomId!.slice(0,3)} {roomId!.slice(3)}
                    </Typography>
                    <audio autoPlay ref={audioRef!}/>
                </Box>
            </Container>
        );
    }

    return (
        <div className="App">
            {/* <Alert sx={{...(errMsg === '' && {display: 'none'})}} severity="error">{errMsg}</Alert> */}
            {
                joined ? <Room /> : <Home />
            }
        </div>
    );
}

export default App;
