import { Login, Add } from "@mui/icons-material";
import { Container, CssBaseline, Box, Typography, TextField, Divider, Stack, Button } from "@mui/material";
import React, { useContext, useState } from "react";
import { socketContext } from "../Context";

export function Home() { 
    const {join, create}: any = useContext(socketContext);

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