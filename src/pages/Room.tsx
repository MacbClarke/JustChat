import { Person, MicOff, VolumeOff, Mic, VolumeUp } from "@mui/icons-material";
import { Tooltip, Typography, Paper, List, ListItem, ListItemAvatar, Avatar, ListItemText, Container, CssBaseline, Box, Stack, ToggleButton } from "@mui/material";
import React, { useContext, useState } from "react";
import { socketContext } from "../Context";

function RoomId() {
    const {roomId}: any = useContext(socketContext);
    const [showTip, setShowTip] = useState(false);

    function copyRoomId() {
        navigator.clipboard.writeText(roomId);
        setShowTip(true);
        setTimeout(() => {
            setShowTip(false);
        }, 1000)
    }

    return (
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
    );
}

function UserList() {
    const {userList}: any = useContext(socketContext);

    return (
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
    );
}

export function Room() {
    const {localMuted, remoteMuted, toggleLocalMute, toggleRemoteMute}: any = useContext(socketContext);

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
                <RoomId />
                <Stack sx={{mb: 2}} direction="row" spacing={1}>
                    <ToggleButton value="local" color="error" selected={localMuted} onClick={toggleLocalMute}>
                        {localMuted? <MicOff /> : <Mic />}
                    </ToggleButton>
                    <ToggleButton value="remote" color="error" selected={remoteMuted} onClick={toggleRemoteMute}>
                        {remoteMuted? <VolumeOff /> : <VolumeUp />}
                    </ToggleButton>
                </Stack>
                <UserList />
            </Box>
        </Container>
    );
}
