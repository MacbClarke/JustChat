import React, { useContext, useState} from 'react';
import './App.css';
import {Avatar, Box, Button, Container, CssBaseline, Divider, List, ListItem, ListItemAvatar, ListItemText, Paper, Stack, TextField, ToggleButton, Tooltip, Typography} from "@mui/material";
import {Add, Login, Mic, MicOff, Person, VolumeOff, VolumeUp} from "@mui/icons-material";
import { socketContext } from './Context';
import { useSnackbar } from 'notistack';

interface IProps {
    localMuted?: boolean;
    remoteMuted?: boolean;
    joined?: boolean;
    roomId?: string;
    join?: (roomId: string, userName: string) => void;
    create?: (userName: string) => void;
    toggleLocalMute?: () => void;
    toggleRemoteMute?: () => void;
    audioRef?: React.RefObject<HTMLAudioElement>;
    userList?: any;
}

function App() {

    const {join, create, roomId, audioRef, joined, localMuted, remoteMuted, toggleLocalMute, toggleRemoteMute, userList}: IProps = useContext(socketContext);
    const { enqueueSnackbar } = useSnackbar();

    function Home() { 

        const [inputRoomId, setInputRoomId] = useState('');
        const [inputUserName, setInputUserName] = useState(localStorage.getItem('userName') || '');

        return (
            <Container component="main" maxWidth="xs" >
                <CssBaseline />
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }} >
                    <Typography sx={{mb: 1, mt: 2}} variant="h4">
                        填写昵称
                    </Typography>
                    <TextField sx={{
                        mb: 2
                    }} error={inputUserName === ''} onChange={(e) => setInputUserName!(e.target.value)} value={inputUserName} variant="standard" label="昵称" />
                    <Divider sx={{
                        width: 1,
                        mt: 3,
                        mb: 3
                    }}>然后</Divider>
                    
                    <Typography sx={{mb: 2}} variant="h4">
                        加入房间
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <TextField onChange={(e) => setInputRoomId(e.target.value)} value={inputRoomId} label="房间号" />
                        <Button onClick={() => join!(inputRoomId, inputUserName)} variant="contained">
                            <Login />
                        </Button>
                    </Stack>
                    {/* <Typography sx={{
                        mt: 3,
                        mb: 3
                    }} variant="h6">
                        或
                    </Typography> */}
                    <Divider sx={{
                        width: 1,
                        mt: 3,
                        mb: 3
                    }}>或</Divider>
                    <Typography sx={{mb: 2}} variant="h4">
                        创建房间
                    </Typography>
                    <Button onClick={() => create!(inputUserName)} size="large" variant="contained">
                        <Add />
                    </Button>
                </Box>
            </Container>
        );
    }
    
    function Room() {

        const [showTip, setShowTip] = useState(false);

        function copyRoomId() {
            navigator.clipboard.writeText(roomId!);
            setShowTip(true);
            setTimeout(() => {
                setShowTip(false);
            }, 1000)
        }

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
                        <Tooltip
                            sx={{mb: 2, cursor: 'pointer'}}
                            open={showTip}
                            disableFocusListener
                            disableHoverListener
                            disableTouchListener
                            title="已复制"
                            placement='right'
                            onClick={copyRoomId}
                        >
                            <Typography variant="h4">
                                {roomId!.slice(0,3)} {roomId!.slice(3)}
                            </Typography>
                        </Tooltip>
                    {/* <Typography sx={{mb: 2}} variant="h4">
                        {roomId!.slice(0,3)} {roomId!.slice(3)}
                    </Typography> */}
                    <Stack sx={{mb: 2}} direction="row" spacing={1}>
                        <ToggleButton value="local" color="error" selected={localMuted} onClick={toggleLocalMute}>
                            {localMuted? <MicOff /> : <Mic />}
                        </ToggleButton>
                        <ToggleButton value="remote" color="error" selected={remoteMuted} onClick={toggleRemoteMute}>
                            {remoteMuted? <VolumeOff /> : <VolumeUp />}
                        </ToggleButton>
                    </Stack>
                    <Paper sx={{minWidth: 0.7}}>
                        <List >
                            {
                                userList!.map((user: any, index: any) => (
                                    <ListItem
                                        sx={{...(user.speaking && {backgroundColor: '#E3E3E3'})}}
                                        key={index}
                                    >
                                        <ListItemAvatar>
                                            <Avatar>
                                                <Person />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={user.userName} />
                                        <MicOff sx={{...(!user.muted && {display: 'none'})}} />
                                        <VolumeOff sx={{...(!user.deafen && {display: 'none'})}} />
                                    </ListItem>
                                ))
                            }
                        </List>
                    </Paper>
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
            <audio hidden autoPlay ref={audioRef!}/>
        </div>
    );
}

export default App;
